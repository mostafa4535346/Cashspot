import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { predictAtm, submitReport, toggleFavorite } from "@/lib/atms.functions";
import { supabase } from "@/integrations/supabase/client";
import { Navigation, Share2, Heart, Flag, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Atm = Database["public"]["Tables"]["atms"]["Row"];
type Bank = Database["public"]["Tables"]["banks"]["Row"];

const STATUS_CLASS: Record<string, string> = {
  cash_available: "bg-cash text-white",
  no_cash: "bg-nocash text-white",
  busy: "bg-busy text-white",
  out_of_service: "bg-offline text-white",
  deposit_available: "bg-deposit text-white",
  unknown: "bg-muted text-muted-foreground",
};

export function AtmSheet({ atm, onClose }: { atm: Atm; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [bank, setBank] = useState<Bank | null>(null);
  const [fav, setFav] = useState(false);
  const [prediction, setPrediction] = useState<{ probability: number; reasoning: string } | null>(null);
  const [reporting, setReporting] = useState(false);
  const predict = useServerFn(predictAtm);
  const report = useServerFn(submitReport);
  const favFn = useServerFn(toggleFavorite);

  useEffect(() => {
    if (atm.bank_id) supabase.from("banks").select("*").eq("id", atm.bank_id).maybeSingle().then(({ data }) => setBank(data));
    predict({ data: { atmId: atm.id } }).then((p) => setPrediction({ probability: p.probability, reasoning: p.reasoning })).catch(() => {});
    if (user) supabase.from("favorites").select("id").eq("user_id", user.id).eq("atm_id", atm.id).maybeSingle().then(({ data }) => setFav(!!data));
  }, [atm.id, user, predict, atm.bank_id]);

  const submitKind = async (kind: "cash_available" | "no_cash" | "broken" | "busy" | "deposit_working" | "cardless_working") => {
    if (!user) { toast.error(t("signIn")); return; }
    try {
      await report({ data: { atmId: atm.id, kind } });
      toast.success("✓");
      setReporting(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const share = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/atm/${atm.id}` : "";
    if (navigator.share) await navigator.share({ title: atm.name, url });
    else { navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  const openDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${atm.lat},${atm.lng}`, "_blank");
  };

  const toggleFav = async () => {
    if (!user) { toast.error(t("signIn")); return; }
    const r = await favFn({ data: { atmId: atm.id } });
    setFav(r.favorited);
  };

  const displayName = lang === "ar" && atm.name_ar ? atm.name_ar : atm.name;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-20 pointer-events-none">
      <div className="glass-strong pointer-events-auto mx-3 w-full max-w-lg rounded-3xl p-5 shadow-[var(--shadow-glass)] animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl brand-gradient flex items-center justify-center text-lg font-bold text-brand-foreground" style={{ background: bank?.color ?? undefined }}>
              {(bank?.name ?? atm.name).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold leading-tight">{displayName}</h3>
              <p className="text-xs text-muted-foreground">{atm.address ?? atm.city}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_CLASS[atm.status])}>{t(atm.status as never)}</span>
          {atm.supports_deposit && <span className="rounded-full bg-muted px-3 py-1 text-xs">{t("deposit")}</span>}
          {atm.supports_cardless && <span className="rounded-full bg-muted px-3 py-1 text-xs">{t("cardless")}</span>}
          {atm.accessible && <span className="rounded-full bg-muted px-3 py-1 text-xs">{t("accessible")}</span>}
          {atm.open_24h && <span className="rounded-full bg-muted px-3 py-1 text-xs">{t("open24h")}</span>}
        </div>

        {prediction && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-accent/60 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-brand" />
            <div className="text-xs">
              <p className="font-medium">{t("predictedCash", { p: prediction.probability })}</p>
              <p className="text-muted-foreground">{prediction.reasoning}</p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button onClick={openDirections} className="flex flex-col items-center gap-1 rounded-2xl bg-secondary p-2.5 text-xs hover:bg-muted transition-colors">
            <Navigation className="h-4 w-4" />{t("directions")}
          </button>
          <button onClick={toggleFav} className="flex flex-col items-center gap-1 rounded-2xl bg-secondary p-2.5 text-xs hover:bg-muted transition-colors">
            <Heart className={cn("h-4 w-4", fav && "fill-nocash text-nocash")} />{t("favorite")}
          </button>
          <button onClick={share} className="flex flex-col items-center gap-1 rounded-2xl bg-secondary p-2.5 text-xs hover:bg-muted transition-colors">
            <Share2 className="h-4 w-4" />{t("share")}
          </button>
          <button onClick={() => setReporting(true)} className="flex flex-col items-center gap-1 rounded-2xl brand-gradient p-2.5 text-xs font-medium text-brand-foreground">
            <Flag className="h-4 w-4" />{t("report")}
          </button>
        </div>

        {reporting && (
          <div className="mt-4 rounded-2xl border p-3 space-y-2">
            <p className="text-sm font-medium">{t("report")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["cash_available", "no_cash", "broken", "busy", "deposit_working", "cardless_working"] as const).map((k) => (
                <button key={k} onClick={() => submitKind(k)} className="rounded-xl border bg-card px-3 py-2 text-xs hover:bg-muted transition-colors">
                  {t(k === "deposit_working" ? "deposit" : k === "cardless_working" ? "cardless" : k === "broken" ? "outOfService" : (k as never))}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
