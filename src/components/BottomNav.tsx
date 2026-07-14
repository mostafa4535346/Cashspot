import { Link, useLocation } from "@tanstack/react-router";
import { Map, Compass, Heart, Bell, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const loc = useLocation();
  const items = [
    { to: "/", icon: Map, label: t("map") },
    { to: "/nearby", icon: Compass, label: t("nearby") },
    { to: "/favorites", icon: Heart, label: t("favorites") },
    { to: "/notifications", icon: Bell, label: t("notifications") },
    { to: "/profile", icon: User, label: t("profile") },
  ] as const;

  return (
    <nav className="glass-strong fixed bottom-3 left-3 right-3 z-40 flex items-center justify-around rounded-full px-2 py-2 shadow-[var(--shadow-glass)]">
      {items.map(({ to, icon: Icon, label }) => {
        const active = loc.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-medium transition-all",
              active ? "text-brand-foreground brand-gradient shadow-[var(--shadow-float)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
