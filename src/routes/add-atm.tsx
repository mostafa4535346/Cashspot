import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAtm } from "@/lib/atms.functions";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowLeft, LocateFixed } from "lucide-react";

export const Route = createFileRoute("/add-atm")({
  head: () => ({ meta: [{ title: "Add ATM — CashSpot" }] }),
  component: AddAtmPage,
});

function AddAtmPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const call = useServerFn(createAtm);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("EG");
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const g = localStorage.getItem("cashspot_geo");
      if (g) setLoc(JSON.parse(g));
    } catch { /* ignore */ }
  }, []);

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const l = { lat: p.coords.latitude, lng: p.coords.longitude };
      setLoc(l);
      localStorage.setItem("cashspot_geo", JSON.stringify(l));
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loc) { toast.error("Location required"); return; }
    setLoading(true);
    try {
      await call({ data: { name, bankId: null, lat: loc.lat, lng: loc.lng, address, city, country } });
      toast.success("ATM added");
      navigate({ to: "/" });
    } catch (err) { toast.error((err as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg p-4 space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("goHome")}
        </Link>
        <h1 className="font-display text-xl font-bold">Add ATM</h1>
        <form onSubmit={submit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="ATM name"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City"
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none" />
            <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="Country" maxLength={3}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none" />
          </div>
          <button type="button" onClick={locate}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm inline-flex items-center justify-center gap-2">
            <LocateFixed className="h-4 w-4" />
            {loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : "Use my location"}
          </button>
          <button type="submit" disabled={loading || !loc}
            className="w-full rounded-2xl brand-gradient py-3 font-semibold text-brand-foreground disabled:opacity-50">
            {loading ? "Saving…" : "Add ATM"}
          </button>
        </form>
      </div>
    </div>
  );
}
