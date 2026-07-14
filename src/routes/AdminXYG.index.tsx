import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminDashboard,
  getAdminStatus,
  broadcastNotification,
  addAdminByEmail,
  ADMIN_SECTIONS,
} from "@/lib/admin.functions";
import { Users, MapPin, Flag, Building2, Megaphone, UserPlus, Loader2, LifeBuoy, ScrollText, ShieldCheck, Phone } from "lucide-react";
import { toast } from "sonner";

export const SUPPORT_PHONE = "01033022988";

export const Route = createFileRoute("/AdminXYG/")({ component: Dashboard });

function Dashboard() {
  const fn = useServerFn(getAdminDashboard);
  const statusFn = useServerFn(getAdminStatus);
  const broadcast = useServerFn(broadcastNotification);
  const addAdmin = useServerFn(addAdminByEmail);

  const [data, setData] = useState<Awaited<ReturnType<typeof fn>> | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [bTitle, setBTitle] = useState("");
  const [bBody, setBBody] = useState("");
  const [sending, setSending] = useState(false);

  const [aEmail, setAEmail] = useState("");
  const [aRole, setARole] = useState<"admin" | "moderator">("admin");
  const [aPerms, setAPerms] = useState<string[]>([...ADMIN_SECTIONS]);
  const [adding, setAdding] = useState(false);
  const togglePerm = (p: string) =>
    setAPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  useEffect(() => {
    fn({}).then(setData).catch(() => {});
    statusFn({}).then((s) => setIsOwner(s.isOwner)).catch(() => {});
  }, [fn, statusFn]);

  const sendBroadcast = async () => {
    if (!bTitle.trim() || !bBody.trim()) return toast.error("Title and message required");
    setSending(true);
    try {
      const res = await broadcast({ data: { title: bTitle.trim(), body: bBody.trim() } });
      toast.success(`Broadcast sent to ${res.recipients} user${res.recipients === 1 ? "" : "s"}`);
      setBTitle(""); setBBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to broadcast");
    } finally { setSending(false); }
  };

  const addAdminUser = async () => {
    if (!aEmail.trim()) return toast.error("Email required");
    setAdding(true);
    try {
      if (aPerms.length === 0) { toast.error("Pick at least one permission"); setAdding(false); return; }
      const res = await addAdmin({ data: { email: aEmail.trim(), role: aRole, permissions: aPerms as never } });
      toast.success(`${res.email} is now a ${aRole}`);
      setAEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add admin");
    } finally { setAdding(false); }
  };

  if (!data) return <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  const cards = [
    { label: "Users", value: data.counts.users, icon: Users, color: "bg-brand/20 text-brand" },
    { label: "ATMs", value: data.counts.atms, icon: MapPin, color: "bg-cash/20 text-cash" },
    { label: "Reports", value: data.counts.reports, icon: Flag, color: "bg-busy/20 text-busy" },
    { label: "Banks", value: data.counts.banks, icon: Building2, color: "bg-deposit/20 text-deposit" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your CashSpot platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.color}`}><c.icon className="h-5 w-5" /></div>
            <p className="mt-3 text-2xl font-bold">{c.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand/20 text-brand flex items-center justify-center"><Megaphone className="h-4 w-4" /></div>
              <div>
                <h2 className="font-semibold">Broadcast to all users</h2>
                <p className="text-xs text-muted-foreground">Owner-only. Delivers an in-app notification to every account.</p>
              </div>
            </div>
            <input
              value={bTitle} onChange={(e) => setBTitle(e.target.value)}
              placeholder="Title" maxLength={120}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <textarea
              value={bBody} onChange={(e) => setBBody(e.target.value)}
              placeholder="Message" rows={3} maxLength={1000}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={sendBroadcast} disabled={sending}
              className="brand-gradient rounded-full px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60 inline-flex items-center gap-2"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" />} Send broadcast
            </button>
          </div>

          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-deposit/20 text-deposit flex items-center justify-center"><UserPlus className="h-4 w-4" /></div>
              <div>
                <h2 className="font-semibold">Add an administrator</h2>
                <p className="text-xs text-muted-foreground">Owner-only. Grant admin or moderator by email. User must have signed up.</p>
              </div>
            </div>
            <input
              value={aEmail} onChange={(e) => setAEmail(e.target.value)}
              placeholder="user@example.com" type="email"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              {(["admin", "moderator"] as const).map((r) => (
                <button key={r} onClick={() => setARole(r)}
                  className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium ${aRole === r ? "brand-gradient text-brand-foreground border-transparent" : ""}`}>
                  {r}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Permissions (what this admin can access)</p>
              <div className="flex flex-wrap gap-1.5">
                {ADMIN_SECTIONS.map((p) => {
                  const on = aPerms.includes(p);
                  return (
                    <button key={p} type="button" onClick={() => togglePerm(p)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${on ? "brand-gradient text-brand-foreground border-transparent" : "text-muted-foreground"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={addAdminUser} disabled={adding}
              className="brand-gradient rounded-full px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60 inline-flex items-center gap-2"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />} Grant role
            </button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/AdminXYG/admins" className="rounded-2xl border bg-card p-5 hover:border-brand transition-colors">
            <div className="h-9 w-9 rounded-xl bg-brand/20 text-brand flex items-center justify-center mb-2"><ShieldCheck className="h-4 w-4" /></div>
            <p className="font-semibold text-sm">Manage administrators</p>
            <p className="text-xs text-muted-foreground">Edit roles & per-section permissions.</p>
          </Link>
          <Link to="/AdminXYG/logs" className="rounded-2xl border bg-card p-5 hover:border-brand transition-colors">
            <div className="h-9 w-9 rounded-xl bg-busy/20 text-busy flex items-center justify-center mb-2"><ScrollText className="h-4 w-4" /></div>
            <p className="font-semibold text-sm">Activity logs</p>
            <p className="text-xs text-muted-foreground">Audit every admin action.</p>
          </Link>
          <div className="rounded-2xl border bg-card p-5">
            <div className="h-9 w-9 rounded-xl bg-cash/20 text-cash flex items-center justify-center mb-2"><LifeBuoy className="h-4 w-4" /></div>
            <p className="font-semibold text-sm">Support hotline</p>
            <a href={`tel:${SUPPORT_PHONE}`} className="text-xs text-brand inline-flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {SUPPORT_PHONE}</a>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card">
        <div className="p-5 border-b"><h2 className="font-semibold">Recent Reports</h2></div>
        <div className="divide-y">
          {data.recentReports.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No reports yet.</div>
          )}
          {data.recentReports.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="font-medium">{r.kind.replace("_", " ")}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
