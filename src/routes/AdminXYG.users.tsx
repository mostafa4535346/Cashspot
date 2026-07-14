import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminData, setUserSuspended } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/AdminXYG/users")({ component: UsersPage });

type Row = { id: string; email: string | null; display_name: string | null; xp: number; suspended: boolean; created_at: string };

function UsersPage() {
  const list = useServerFn(listAdminData);
  const susp = useServerFn(setUserSuspended);
  const [rows, setRows] = useState<Row[]>([]);
  const load = () => list({ data: { table: "profiles" } }).then((r) => setRows(r.rows as Row[])).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <div className="p-6 md:p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-start">Email</th><th className="p-3 text-start">Name</th><th className="p-3">XP</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
          <tbody className="divide-y">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.display_name}</td>
                <td className="p-3 text-center">{u.xp}</td>
                <td className="p-3 text-center">{u.suspended ? <span className="text-nocash">Suspended</span> : <span className="text-cash">Active</span>}</td>
                <td className="p-3 text-center">
                  <button onClick={async () => { await susp({ data: { userId: u.id, suspended: !u.suspended } }); toast.success("Updated"); load(); }} className="text-xs underline text-brand">
                    {u.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
