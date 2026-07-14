import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminData } from "@/lib/admin.functions";

export const Route = createFileRoute("/AdminXYG/banks")({ component: BanksPage });

type Row = { id: string; name: string; name_ar: string | null; slug: string; country: string };

function BanksPage() {
  const list = useServerFn(listAdminData);
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { list({ data: { table: "banks" } }).then((r) => setRows(r.rows as Row[])).catch(() => {}); }, [list]);
  return (
    <div className="p-6 md:p-8 space-y-4">
      <h1 className="font-display text-2xl font-bold">Banks</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((b) => (
          <div key={b.id} className="rounded-2xl border bg-card p-4">
            <p className="font-semibold">{b.name}</p>
            {b.name_ar && <p className="text-sm text-muted-foreground">{b.name_ar}</p>}
            <p className="text-xs text-muted-foreground mt-1">{b.slug} · {b.country}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
