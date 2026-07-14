import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { Heart } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Atm = Database["public"]["Tables"]["atms"]["Row"];

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [favs, setFavs] = useState<Atm[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("favorites").select("atm_id, atms(*)").eq("user_id", user.id).then(({ data }) => {
      setFavs(((data ?? []) as unknown as { atms: Atm }[]).map((r) => r.atms).filter(Boolean));
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <h1 className="font-display text-xl font-bold">{t("favorites")}</h1>
      </header>
      <div className="mx-auto max-w-lg space-y-2 p-4">
        {!user && <p className="text-center text-sm text-muted-foreground py-16">{t("signIn")} · <Link to="/auth" className="text-brand underline">{t("signIn")}</Link></p>}
        {user && favs.length === 0 && (
          <div className="py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t("noResults")}</p>
          </div>
        )}
        {favs.map((a) => (
          <Link key={a.id} to="/atm/$id" params={{ id: a.id }} className="block rounded-2xl border bg-card p-4 hover:shadow-md transition">
            <p className="font-semibold">{lang === "ar" && a.name_ar ? a.name_ar : a.name}</p>
            <p className="text-xs text-muted-foreground">{a.address ?? a.city}</p>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
