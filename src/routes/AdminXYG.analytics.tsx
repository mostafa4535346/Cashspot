import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminAnalytics } from "@/lib/admin.functions";

export const Route = createFileRoute("/AdminXYG/analytics")({ component: AnalyticsPage });

type Analytics = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof getAdminAnalytics>>>>;

function AnalyticsPage() {
  const fn = useServerFn(getAdminAnalytics);
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => { fn({}).then(setData).catch(() => {}); }, [fn]);

  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading analytics…</div>;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Live overview of ATMs, governorates and activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total ATMs" v={data.totals.atms} />
        <Stat label="Governorates / Cities" v={data.totals.governorates} />
        <Stat label="Reports" v={data.totals.reports} />
        <Stat label="Users" v={data.totals.users} />
      </div>

      <Section title="ATMs per Governorate / City (المحافظات)">
        <BarList items={data.byCity} />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="By Country"><BarList items={data.byCountry} /></Section>
        <Section title="By Status"><BarList items={data.byStatus} /></Section>
      </div>

      <Section title="ATMs added over time">
        <BarList items={data.byDay.slice(-14)} />
      </Section>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-2xl font-bold">{v}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="space-y-1">
          <div className="flex justify-between text-xs"><span className="font-medium">{i.label}</span><span className="text-muted-foreground">{i.value}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full brand-gradient" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
