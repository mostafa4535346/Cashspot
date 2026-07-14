import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — CashSpot" }] }),
  component: Auth,
});

function Auth() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) { toast.error((err as Error).message); }
    finally { setLoading(false); }
  };

  const google = async () => {
    setLoading(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) { toast.error(r.error.message); return; }
      if (r.redirected) return;
      navigate({ to: "/" });
    } catch (err) { toast.error((err as Error).message); }
    finally { setLoading(false); }
  };

  // Reset loading state when the user returns to the tab (e.g. cancelled OAuth popup)
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") setLoading(false); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="min-h-screen hero-gradient text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t("goHome")}</Link>
        <div className="glass-strong rounded-3xl p-8 shadow-[var(--shadow-glass)]">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl brand-gradient flex items-center justify-center font-bold text-brand-foreground">C</div>
            <div>
              <p className="font-display text-lg font-bold">{t("appName")}</p>
              <p className="text-xs text-white/60">{mode === "in" ? t("signIn") : t("signUp")}</p>
            </div>
          </div>

          <button type="button" onClick={google} disabled={loading}
            className="w-full rounded-2xl bg-white text-black py-3 font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.8 6C12.3 13 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17.5z"/><path fill="#FBBC05" d="M10.3 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.5-5.8c-2.1 1.4-4.7 2.2-7.8 2.2-6.3 0-11.7-3.5-13.7-9.2l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
            {t("signInGoogle")}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-white/40"><div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" /></div>

          <form onSubmit={submit} className="space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")}
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm outline-none focus:border-brand" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")}
              minLength={6} className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm outline-none focus:border-brand" />
            <button type="submit" disabled={loading}
              className="w-full rounded-2xl brand-gradient py-3 font-semibold text-brand-foreground shadow-[var(--shadow-float)]">
              {mode === "in" ? t("signIn") : t("signUp")}
            </button>
          </form>

          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-xs text-white/60 hover:text-white">
            {mode === "in" ? t("signUp") : t("signIn")}
          </button>
        </div>
      </div>
    </div>
  );
}
