import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminData, setUserRole, setAdminPermissions, ADMIN_SECTIONS } from "@/lib/admin.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/AdminXYG/admins")({ component: AdminsPage });

type Profile = { id: string; email: string | null; display_name: string | null };
type RoleRow = { user_id: string; role: string; permissions: string[] | null };

function AdminsPage() {
  const list = useServerFn(listAdminData);
  const setRole = useServerFn(setUserRole);
  const setPerms = useServerFn(setAdminPermissions);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, RoleRow[]>>({});

  const load = async () => {
    const r = await list({ data: { table: "profiles" } });
    setProfiles(r.rows as Profile[]);
    const { data } = await supabase.from("user_roles").select("user_id, role, permissions");
    const map: Record<string, RoleRow[]> = {};
    ((data ?? []) as RoleRow[]).forEach((row) => {
      map[row.user_id] = [...(map[row.user_id] ?? []), row];
    });
    setRolesMap(map);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const toggle = async (userId: string, role: "admin" | "moderator", grant: boolean) => {
    await setRole({ data: { userId, role, action: grant ? "grant" : "revoke" } });
    toast.success("Role updated");
    load();
  };

  const togglePerm = async (userId: string, role: "admin" | "moderator", perm: string, current: string[]) => {
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
    await setPerms({ data: { userId, role, permissions: next as never } });
    toast.success("Permissions updated");
    load();
  };

  return (
    <div className="p-6 md:p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold">Administrators</h1>
      <p className="text-sm text-muted-foreground">Only the Owner can grant or revoke administrative roles and choose which sections each admin can access.</p>
      <div className="space-y-3">
        {profiles.map((p) => {
          const rows = rolesMap[p.id] ?? [];
          const roleNames = rows.map((r) => r.role);
          const isOwner = roleNames.includes("owner");
          const adminRow = rows.find((r) => r.role === "admin");
          const modRow = rows.find((r) => r.role === "moderator");
          const activeRow = adminRow ?? modRow;
          return (
            <div key={p.id} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-sm">{p.email}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{roleNames.join(" · ") || "user"}</p>
                </div>
                {isOwner ? (
                  <span className="text-xs text-muted-foreground">Owner — full access</span>
                ) : (
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!adminRow} onChange={(e) => toggle(p.id, "admin", e.target.checked)} /> Admin</label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!modRow} onChange={(e) => toggle(p.id, "moderator", e.target.checked)} /> Moderator</label>
                  </div>
                )}
              </div>
              {!isOwner && activeRow && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Allowed sections</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ADMIN_SECTIONS.map((perm) => {
                      const on = (activeRow.permissions ?? []).includes(perm);
                      return (
                        <button key={perm} onClick={() => togglePerm(p.id, activeRow.role as "admin" | "moderator", perm, activeRow.permissions ?? [])}
                          className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${on ? "brand-gradient text-brand-foreground border-transparent" : "text-muted-foreground"}`}>
                          {perm}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
