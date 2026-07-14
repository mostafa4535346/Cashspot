import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AtmSheet } from "@/components/AtmSheet";
import { BottomNav } from "@/components/BottomNav";
import { MapView } from "@/components/MapView";
import { useTheme } from "@/lib/theme";
import type { Database } from "@/integrations/supabase/types";
import { ArrowLeft } from "lucide-react";

type Atm = Database["public"]["Tables"]["atms"]["Row"];

export const Route = createFileRoute("/atm/$id")({ component: AtmDetail });

function AtmDetail() {
  const { id } = useParams({ from: "/atm/$id" });
  const { theme } = useTheme();
  const [atm, setAtm] = useState<Atm | null>(null);
  useEffect(() => { supabase.from("atms").select("*").eq("id", id).maybeSingle().then(({ data }) => setAtm(data)); }, [id]);
  if (!atm) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <MapView atms={[atm]} center={{ lat: atm.lat, lng: atm.lng }} onSelect={() => {}} isDark={theme === "dark"} />
      <Link to="/" className="glass-strong absolute top-4 start-4 z-30 flex h-10 w-10 items-center justify-center rounded-full"><ArrowLeft className="h-4 w-4" /></Link>
      <AtmSheet atm={atm} onClose={() => history.back()} />
      <BottomNav />
    </div>
  );
}
