import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "@/components/BottomNav";
import type { Database } from "@/integrations/supabase/types";

type Atm = Database["public"]["Tables"]["atms"]["Row"];

export const Route = createFileRoute("/nearby")({ component: Nearby });

function dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function Nearby() {
  const { t, lang } = useI18n();
  const [atms, setAtms] = useState<Atm[]>([]);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const g = localStorage.getItem("cashspot_geo");
      if (g) try { setLoc(JSON.parse(g)); } catch { /* ignore */ }
    }
    supabase.from("atms").select("*").limit(500).then(({ data }) => setAtms(data ?? []));
  }, []);

  const sorted = loc ? [...atms].sort((a, b) => dist(loc, { lat: a.lat, lng: a.lng }) - dist(loc, { lat: b.lat, lng: b.lng })) : atms;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <h1 className="font-display text-xl font-bold">{t("nearby")}</h1>
      </header>
      <div className="mx-auto max-w-lg p-4 space-y-2">
        {sorted.slice(0, 50).map((a) => {
          const d = loc ? dist(loc, { lat: a.lat, lng: a.lng }) : null;
          return (
            <Link key={a.id} to="/atm/$id" params={{ id: a.id }} className="flex items-center gap-3 rounded-2xl border bg-card p-4 hover:shadow-md transition">
              <div className={`h-3 w-3 rounded-full ${a.status === "cash_available" ? "bg-cash" : a.status === "no_cash" ? "bg-nocash" : a.status === "busy" ? "bg-busy" : a.status === "deposit_available" ? "bg-deposit" : "bg-offline"}`} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{lang === "ar" && a.name_ar ? a.name_ar : a.name}</p>
                <p className="text-xs text-muted-foreground">{a.city} · {t(a.status as never)}</p>
              </div>
              {d !== null && <span className="text-xs text-muted-foreground">{d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}</span>}
            </Link>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
