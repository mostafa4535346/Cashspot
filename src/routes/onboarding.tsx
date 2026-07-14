import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MapPin, Bell, Globe, Sparkles, ChevronRight } from "lucide-react";
import cityImg from "@/assets/onboarding-city.jpg";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — CashSpot" }] }),
  component: Onboarding,
});

const COUNTRIES = [
  { code: "EG", name: "Egypt", nameAr: "مصر" },
  { code: "SA", name: "Saudi Arabia", nameAr: "السعودية" },
  { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات" },
  { code: "MA", name: "Morocco", nameAr: "المغرب" },
  { code: "DZ", name: "Algeria", nameAr: "الجزائر" },
  { code: "TN", name: "Tunisia", nameAr: "تونس" },
  { code: "JO", name: "Jordan", nameAr: "الأردن" },
  { code: "LB", name: "Lebanon", nameAr: "لبنان" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت" },
  { code: "QA", name: "Qatar", nameAr: "قطر" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين" },
  { code: "OM", name: "Oman", nameAr: "عُمان" },
  { code: "IQ", name: "Iraq", nameAr: "العراق" },
  { code: "SD", name: "Sudan", nameAr: "السودان" },
  { code: "SY", name: "Syria", nameAr: "سوريا" },
  { code: "YE", name: "Yemen", nameAr: "اليمن" },
  { code: "PS", name: "Palestine", nameAr: "فلسطين" },
  { code: "LY", name: "Libya", nameAr: "ليبيا" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
];

function Onboarding() {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("EG");
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("cashspot_onboarded") === "1") {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const finish = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("cashspot_onboarded", "1");
      localStorage.setItem("cashspot_country", country);
    }
    navigate({ to: "/" });
  };

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setStep(3); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("cashspot_geo", JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        }
        setStep(3);
      },
      () => setStep(3),
      { timeout: 8000 },
    );
  };

  const requestNotif = async () => {
    if (typeof Notification !== "undefined") {
      try { await Notification.requestPermission(); } catch { /* ignore */ }
    }
    finish();
  };

  return (
    <div className="relative min-h-screen overflow-hidden hero-gradient text-white">
      <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${cityImg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/85" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl brand-gradient flex items-center justify-center font-bold text-brand-foreground">C</div>
          <span className="font-display text-lg font-bold">{t("appName")}</span>
        </div>

        <div className="mt-auto space-y-6 pb-6">
          {step === 0 && (
            <>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
                  <Sparkles className="h-3 w-3 text-brand" />
                  Community-powered · Real-time
                </div>
                <h1 className="font-display text-4xl font-bold leading-tight">{t("welcome")}</h1>
                <p className="text-white/70 text-base">{t("tagline")}</p>
              </div>
              <button onClick={() => setStep(1)} className="w-full rounded-2xl brand-gradient py-4 text-base font-semibold text-brand-foreground shadow-[var(--shadow-float)] flex items-center justify-center gap-2">
                {t("getStarted")} <ChevronRight className="h-5 w-5" />
              </button>
              <p className="text-center text-[11px] tracking-wide text-white/50">Powered by <span className="font-semibold text-white/80">Mostafa Ahmed</span></p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-brand" />
                <h2 className="font-display text-2xl font-bold">{t("chooseLanguage")}</h2>
              </div>
              <div className="space-y-3">
                {(["en", "ar"] as const).map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`w-full rounded-2xl px-5 py-4 text-start text-lg font-medium transition-all ${lang === l ? "brand-gradient text-brand-foreground shadow-[var(--shadow-float)]" : "glass hover:bg-white/10"}`}>
                    {l === "en" ? "🇬🇧  English" : "🇸🇦  العربية"}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full rounded-2xl bg-white text-black py-4 text-base font-semibold">{t("continue")}</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-brand" />
                <h2 className="font-display text-2xl font-bold">{t("allowLocation")}</h2>
              </div>
              <p className="text-white/70">{t("locationRationale")}</p>
              <div className="max-h-56 space-y-1 overflow-y-auto glass rounded-2xl p-2">
                <p className="px-2 py-1 text-xs text-white/50">{t("manualCountry")}</p>
                {COUNTRIES.map((c) => (
                  <button key={c.code} onClick={() => setCountry(c.code)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm ${country === c.code ? "bg-brand text-brand-foreground" : "hover:bg-white/10"}`}>
                    <span>{lang === "ar" && c.nameAr ? c.nameAr : c.name}</span>
                    <span className="text-xs opacity-60">{c.code}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="flex-1 rounded-2xl glass py-4 text-base font-semibold">{t("skip")}</button>
                <button onClick={requestLocation} className="flex-1 rounded-2xl brand-gradient py-4 text-base font-semibold text-brand-foreground shadow-[var(--shadow-float)]">{t("allow")}</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-brand" />
                <h2 className="font-display text-2xl font-bold">{t("enableNotifications")}</h2>
              </div>
              <p className="text-white/70">{t("notifRationale")}</p>
              <div className="flex gap-2">
                <button onClick={finish} className="flex-1 rounded-2xl glass py-4 text-base font-semibold">{t("skip")}</button>
                <button onClick={requestNotif} className="flex-1 rounded-2xl brand-gradient py-4 text-base font-semibold text-brand-foreground shadow-[var(--shadow-float)]">{t("allow")}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
