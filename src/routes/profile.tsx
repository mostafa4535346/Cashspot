import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Moon, Sun, Globe, Trophy, Award, LifeBuoy, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [xp, setXp] = useState(0);
  const [top, setTop] = useState<{ user_id: string; display_name: string | null; xp: number }[]>([]);

  useEffect(() => {
    if (user) supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle().then(({ data }) => setXp(data?.xp ?? 0));
    supabase.from("leaderboard").select("user_id, display_name, xp").limit(10).then(({ data }) => setTop((data ?? []) as { user_id: string; display_name: string | null; xp: number }[]));
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="hero-gradient text-white px-5 pt-8 pb-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl font-bold">{t("profile")}</h1>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl brand-gradient flex items-center justify-center text-2xl font-bold text-brand-foreground">
              {(user?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.email ?? "Guest"}</p>
              <p className="text-xs text-white/60 flex items-center gap-1"><Trophy className="h-3 w-3" /> {xp} {t("xp")}</p>
              {roles.length > 0 && <p className="text-[10px] text-brand mt-1 uppercase tracking-wide">{roles.join(" · ")}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-10 max-w-lg space-y-3 px-4">
        {!user && (
          <Link to="/auth" className="block rounded-2xl brand-gradient py-4 text-center font-semibold text-brand-foreground shadow-[var(--shadow-float)]">
            {t("signIn")}
          </Link>
        )}

        <div className="glass-strong rounded-2xl divide-y">
          <button onClick={toggle} className="flex w-full items-center justify-between px-4 py-4">
            <span className="flex items-center gap-3 text-sm">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Theme</span>
            <span className="text-xs text-muted-foreground">{theme}</span>
          </button>
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="flex w-full items-center justify-between px-4 py-4">
            <span className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4" /> Language</span>
            <span className="text-xs text-muted-foreground">{lang === "en" ? "English" : "العربية"}</span>
          </button>
          {user && (
            <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="flex w-full items-center gap-3 px-4 py-4 text-sm text-destructive">
              <LogOut className="h-4 w-4" /> {t("signOut")}
            </button>
          )}
        </div>

        <div className="glass-strong rounded-2xl p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold text-sm"><Award className="h-4 w-4 text-brand" /> {t("leaderboard")}</p>
          <div className="space-y-1">
            {top.map((r, i) => (
              <div key={r.user_id} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-muted">
                <span>#{i + 1} {r.display_name ?? "Anonymous"}</span>
                <span className="text-xs text-muted-foreground">{r.xp} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-4 space-y-2">
          <p className="flex items-center gap-2 font-semibold text-sm"><LifeBuoy className="h-4 w-4 text-brand" /> Support</p>
          <p className="text-xs text-muted-foreground">Need help? Reach us anytime.</p>
          <div className="flex gap-2">
            <a href="tel:01033022988" className="flex-1 brand-gradient rounded-xl px-3 py-2 text-center text-xs font-semibold text-brand-foreground">Call 01033022988</a>
            <a href="https://wa.me/201033022988" target="_blank" rel="noreferrer" className="flex-1 rounded-xl border px-3 py-2 text-center text-xs font-semibold inline-flex items-center justify-center gap-1"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">Powered by <span className="font-semibold text-foreground">Mostafa Ahmed</span></p>
      </div>
      <BottomNav />
    </div>
  );
}
