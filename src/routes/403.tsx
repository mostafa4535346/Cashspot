import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/403")({
  head: () => ({ meta: [{ title: "Access Denied — CashSpot" }, { name: "robots", content: "noindex" }] }),
  component: Forbidden,
});

function Forbidden() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center text-white px-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="mx-auto h-14 w-14 text-nocash" />
        <h1 className="mt-4 font-display text-3xl font-bold">{t("accessDenied")}</h1>
        <p className="mt-2 text-white/70">{t("notAuthorized")}</p>
        <Link to="/" className="mt-6 inline-flex rounded-full brand-gradient px-5 py-2 text-sm font-semibold text-brand-foreground">{t("goHome")}</Link>
      </div>
    </div>
  );
}
