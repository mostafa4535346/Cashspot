import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminData, moderateReport } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/AdminXYG/reports")({ component: ReportsPage });

type Row = { id: string; kind: string; comment: string | null; approved: boolean; flagged: boolean; created_at: string };

function ReportsPage() {
  const list = useServerFn(listAdminData);
  const mod = useServerFn(moderateReport);
  const [rows, setRows] = useState<Row[]>([]);
  const load = () => list({ data: { table: "reports" } }).then((r) => setRows(r.rows as Row[])).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <div className="p-6 md:p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold">Reports</h1>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-start">Kind</th><th className="p-3">Comment</th><th className="p-3">Status</th><th className="p-3">When</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3">{r.kind}</td>
                <td className="p-3">{r.comment}</td>
                <td className="p-3 text-center">{r.flagged ? "Flagged" : r.approved ? "Approved" : "Pending"}</td>
                <td className="p-3 text-center text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 text-center space-x-2">
                  <button onClick={async () => { await mod({ data: { reportId: r.id, approved: true } }); toast.success("Approved"); load(); }} className="text-xs text-cash underline">Approve</button>
                  <button onClick={async () => { await mod({ data: { reportId: r.id, approved: false } }); toast.success("Rejected"); load(); }} className="text-xs text-destructive underline">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
