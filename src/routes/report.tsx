import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createAtm } from "@/lib/atms.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ArrowLeft } from "lucide-react";

type Bank = Database["public"]["Tables"]["banks"]["Row"];

export const Route = createFileRoute("/report")({ component: ReportPage });

function ReportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const create = useServerFn(createAtm);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({ name: "", bankId: "", address: "", city: "", country: "EG" });
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("banks").select("*").then(({ data }) => setBanks(data ?? []));
    if (typeof localStorage !== "undefined") {
      const g = localStorage.getItem("cashspot_geo");
      if (g) try { setLoc(JSON.parse(g)); } catch { /* ignore */ }
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t("signIn")); navigate({ to: "/auth" }); return; }
    if (!loc) { toast.error("Location required"); return; }
    setLoading(true);
    try {
      const r = await create({ data: { name: form.name, bankId: form.bankId || null, lat: loc.lat, lng: loc.lng, address: form.address || undefined, city: form.city || undefined, country: form.country } });
      toast.success("ATM added");
      navigate({ to: "/atm/$id", params: { id: r.id } });
    } catch (err) { toast.error((err as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
        <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="font-display text-lg font-bold">{t("reportAtm")}</h1>
      </header>
      <form onSubmit={submit} className="mx-auto max-w-lg p-4 space-y-3">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ATM name" className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none" />
        <select value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} className="w-full rounded-xl border bg-card px-4 py-3 text-sm">
          <option value="">Bank (optional)</option>
          {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none" />
        <div className="grid grid-cols-2 gap-3">
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-xl border bg-card px-4 py-3 text-sm outline-none" />
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} maxLength={3} placeholder="Country" className="rounded-xl border bg-card px-4 py-3 text-sm outline-none" />
        </div>
        <p className="text-xs text-muted-foreground">Location: {loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : "Enable location on home first"}</p>
        <button type="submit" disabled={loading || !loc} className="w-full rounded-2xl brand-gradient py-3 font-semibold text-brand-foreground disabled:opacity-50">
          {t("submit")}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}
