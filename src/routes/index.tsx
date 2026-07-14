import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { MapView } from "@/components/MapView";
import { BottomNav } from "@/components/BottomNav";
import { AtmSheet } from "@/components/AtmSheet";
import { Search, LocateFixed, Filter, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Atm = Database["public"]["Tables"]["atms"]["Row"];

export const Route = createFileRoute("/")({
  component: Home,
});

const FILTERS = [
  { key: "cash", label: "cashAvailable" },
  { key: "deposit", label: "deposit" },
  { key: "cardless", label: "cardless" },
  { key: "open24h", label: "open24h" },
  { key: "accessible", label: "accessible" },
] as const;

function Home() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [atms, setAtms] = useState<Atm[]>([]);
  const [selected, setSelected] = useState<Atm | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("cashspot_onboarded") !== "1") { navigate({ to: "/onboarding" }); return; }
      const geo = localStorage.getItem("cashspot_geo");
      if (geo) try { setUserLoc(JSON.parse(geo)); } catch { /* ignore */ }
    }
    supabase.from("atms").select("*").limit(500).then(({ data }) => setAtms(data ?? []));
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return atms.filter((a) => {
      if (q && !`${a.name} ${a.name_ar ?? ""} ${a.address ?? ""} ${a.city ?? ""} ${a.governorate ?? ""} ${a.country}`.toLowerCase().includes(q)) return false;
      if (activeFilters.has("cash") && a.status !== "cash_available") return false;
      if (activeFilters.has("deposit") && !a.supports_deposit) return false;
      if (activeFilters.has("cardless") && !a.supports_cardless) return false;
      if (activeFilters.has("open24h") && !a.open_24h) return false;
      if (activeFilters.has("accessible") && !a.accessible) return false;
      return true;
    });
  }, [atms, query, activeFilters]);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const l = { lat: p.coords.latitude, lng: p.coords.longitude };
      setUserLoc(l);
      localStorage.setItem("cashspot_geo", JSON.stringify(l));
    });
  };

  const toggleFilter = (k: string) => {
    setActiveFilters((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <MapView
        atms={filtered}
        center={userLoc ?? { lat: 30.0444, lng: 31.2357 }}
        userLocation={userLoc}
        onSelect={setSelected}
        isDark={theme === "dark"}
      />

      <div className="absolute inset-x-0 top-0 z-30 px-3 pt-3 pb-2 pointer-events-none">
        <div className="mx-auto max-w-lg space-y-2 pointer-events-auto">
          <div className="glass-strong flex items-center gap-2 rounded-full px-4 py-3 shadow-[var(--shadow-glass)]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => toggleFilter(f.key)}
                className={`glass whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${activeFilters.has(f.key) ? "brand-gradient text-brand-foreground" : "text-foreground"}`}>
                {t(f.label as never)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={locateMe}
        className="glass-strong absolute bottom-28 end-4 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-[var(--shadow-glass)]">
        <LocateFixed className="h-5 w-5" />
      </button>

      <button onClick={() => navigate({ to: "/add-atm" })}
        className="brand-gradient absolute bottom-28 start-4 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-brand-foreground shadow-[var(--shadow-float)]">
        <Plus className="h-4 w-4" /> Add ATM
      </button>

      {selected && <AtmSheet atm={selected} onClose={() => setSelected(null)} />}

      <BottomNav />
    </div>
  );
}
