import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminData, deleteAtm, adminCreateAtm } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/AdminXYG/atms")({ component: AtmsPage });

type Row = { id: string; name: string; city: string | null; country: string; status: string; created_at: string };

function AtmsPage() {
  const list = useServerFn(listAdminData);
  const del = useServerFn(deleteAtm);
  const create = useServerFn(adminCreateAtm);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", country: "EG", address: "", lat: "", lng: "" });
  const [busy, setBusy] = useState(false);

  const load = () => list({ data: { table: "atms" } }).then((r) => setRows(r.rows as Row[])).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtered = rows.filter((r) =>
    !q || [r.name, r.city, r.country].some((v) => (v ?? "").toLowerCase().includes(q.toLowerCase())),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(form.lat), lng = parseFloat(form.lng);
    if (!form.name || Number.isNaN(lat) || Number.isNaN(lng)) { toast.error("Name and valid lat/lng required"); return; }
    setBusy(true);
    try {
      await create({ data: {
        name: form.name, lat, lng, country: form.country || "EG",
        city: form.city || undefined, address: form.address || undefined,
      } });
      toast.success("ATM added");
      setForm({ name: "", city: "", country: "EG", address: "", lat: "", lng: "" });
      setOpen(false);
      load();
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">ATMs</h1>
          <p className="text-xs text-muted-foreground">{rows.length} total · auto-removed after 6 broken reports</p>
        </div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-xl border bg-card px-3 py-2 text-sm" />
          <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-xl brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground">
            <Plus className="h-4 w-4" /> Add ATM
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="rounded-2xl border bg-card p-4 grid gap-3 md:grid-cols-2">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ATM name" className="rounded-xl border bg-background px-3 py-2 text-sm md:col-span-2" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="rounded-xl border bg-background px-3 py-2 text-sm md:col-span-2" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City / Governorate" className="rounded-xl border bg-background px-3 py-2 text-sm" />
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} maxLength={3} placeholder="Country (EG)" className="rounded-xl border bg-background px-3 py-2 text-sm" />
          <input required value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Latitude" className="rounded-xl border bg-background px-3 py-2 text-sm" />
          <input required value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="Longitude" className="rounded-xl border bg-background px-3 py-2 text-sm" />
          <button disabled={busy} className="md:col-span-2 rounded-xl brand-gradient py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50">
            {busy ? "Adding…" : "Create ATM"}
          </button>
        </form>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3 text-start">Name</th><th className="p-3">City</th><th className="p-3">Country</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody className="divide-y">
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="p-3">{a.name}</td>
                <td className="p-3 text-center">{a.city}</td>
                <td className="p-3 text-center">{a.country}</td>
                <td className="p-3 text-center">{a.status}</td>
                <td className="p-3 text-center">
                  <button onClick={async () => { if (confirm("Delete this ATM?")) { await del({ data: { atmId: a.id } }); toast.success("Deleted"); load(); } }} className="text-xs text-destructive underline">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No ATMs found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
