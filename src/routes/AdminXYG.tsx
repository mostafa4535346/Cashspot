import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStatus } from "@/lib/admin.functions";
import { LayoutDashboard, Users, MapPin, Flag, Building2, BarChart3, ShieldCheck, ScrollText, Settings } from "lucide-react";

export const Route = createFileRoute("/AdminXYG")({
  head: () => ({ meta: [{ title: "Admin — CashSpot" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useServerFn(getAdminStatus);
  const [allowed, setAllowed] = useState<null | { isStaff: boolean; isOwner: boolean; permissions: string[] }>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    status({}).then((r) => setAllowed(r)).catch(() => setAllowed({ isStaff: false, isOwner: false, permissions: [] }));
  }, [user, loading, status, navigate]);

  useEffect(() => {
    if (allowed && !allowed.isStaff) navigate({ to: "/403" });
  }, [allowed, navigate]);

  if (!allowed?.isStaff) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">Verifying access…</div>;

  const can = (key: string) => allowed.isOwner || allowed.permissions.includes(key);
  const allLinks: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; perm?: string }[] = [
    { to: "/AdminXYG", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/AdminXYG/users", label: "Users", icon: Users, perm: "users" },
    { to: "/AdminXYG/atms", label: "ATMs", icon: MapPin, perm: "atms" },
    { to: "/AdminXYG/reports", label: "Reports", icon: Flag, perm: "reports" },
    { to: "/AdminXYG/banks", label: "Banks", icon: Building2, perm: "banks" },
    { to: "/AdminXYG/analytics", label: "Analytics", icon: BarChart3, perm: "analytics" },
    { to: "/AdminXYG/logs", label: "Logs", icon: ScrollText, perm: "logs" },
    { to: "/AdminXYG/settings", label: "Settings", icon: Settings, perm: "settings" },
    ...(allowed.isOwner ? [{ to: "/AdminXYG/admins", label: "Administrators", icon: ShieldCheck }] : []),
  ];
  const links = allLinks.filter((l) => !l.perm || can(l.perm));

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-e bg-card">
        <div className="p-5 border-b">
          <p className="font-display font-bold text-lg">CashSpot Admin</p>
          <p className="text-xs text-muted-foreground">{allowed.isOwner ? "Owner" : "Staff"}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {links.map((l) => {
            const active = l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to);
            return (
              <Link key={l.to} to={l.to} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active ? "brand-gradient text-brand-foreground" : "hover:bg-muted"}`}>
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t"><Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to app</Link></div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}
