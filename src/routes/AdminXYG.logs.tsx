import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminData } from "@/lib/admin.functions";

export const Route = createFileRoute("/AdminXYG/logs")({ component: LogsPage });

type Row = { id: string; action: string; actor_id: string | null; target_type: string | null; target_id: string | null; created_at: string };

function LogsPage() {
  const list = useServerFn(listAdminData);
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { list({ data: { table: "activity_logs" } }).then((r) => setRows(r.rows as Row[])).catch(() => {}); }, [list]);
  return (
    <div className="p-6 md:p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold">Activity Logs</h1>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-start">Action</th><th className="p-3">Target</th><th className="p-3">When</th></tr></thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3">{r.action}</td>
                <td className="p-3 text-xs text-muted-foreground">{r.target_type}:{r.target_id}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
