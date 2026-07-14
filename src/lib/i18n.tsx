import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const dict = {
  en: {
    appName: "CashSpot",
    welcome: "Welcome to CashSpot",
    tagline: "Find ATMs with cash in real time.",
    getStarted: "Get Started",
    chooseLanguage: "Choose your language",
    continue: "Continue",
    allowLocation: "Allow location access",
    locationRationale: "We use your location to show ATMs near you.",
    allow: "Allow",
    skip: "Skip",
    manualCountry: "Select country manually",
    enableNotifications: "Enable notifications",
    notifRationale: "We'll notify you when nearby ATMs receive cash updates.",
    map: "Map",
    nearby: "Nearby",
    favorites: "Favorites",
    notifications: "Notifications",
    profile: "Profile",
    search: "Search ATM, bank, city…",
    reportAtm: "Report ATM",
    cashAvailable: "Cash Available",
    noCash: "No Cash",
    busy: "Busy",
    outOfService: "Out of Service",
    depositAvailable: "Deposit Available",
    unknown: "Unknown",
    filters: "Filters",
    deposit: "Deposit",
    cardless: "Cardless",
    openNow: "Open Now",
    open24h: "24 Hours",
    accessible: "Accessible",
    directions: "Directions",
    share: "Share",
    favorite: "Favorite",
    report: "Report",
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Sign up",
    signInGoogle: "Continue with Google",
    email: "Email",
    password: "Password",
    lastUpdate: "Last update",
    submit: "Submit",
    cancel: "Cancel",
    optionalComment: "Optional comment",
    admin: "Admin",
    accessDenied: "403 — Access Denied",
    notAuthorized: "You are not authorized to view this page.",
    dashboard: "Dashboard",
    users: "Users",
    atms: "ATMs",
    reports: "Reports",
    banks: "Banks",
    analytics: "Analytics",
    heatmap: "Heatmap",
    leaderboard: "Leaderboard",
    logs: "Logs",
    settings: "Settings",
    admins: "Administrators",
    goHome: "Go home",
    xp: "XP",
    yourLocation: "Your location",
    noResults: "No results",
    predictedCash: "AI: {p}% likely to have cash",
    findBest: "Find best nearby ATM",
    country: "Country",
  },
  ar: {
    appName: "كاش سبوت",
    welcome: "مرحباً بك في كاش سبوت",
    tagline: "اعثر على أجهزة الصراف الآلي بها كاش لحظياً.",
    getStarted: "ابدأ الآن",
    chooseLanguage: "اختر لغتك",
    continue: "متابعة",
    allowLocation: "السماح بالوصول للموقع",
    locationRationale: "نستخدم موقعك لعرض الصرافات القريبة منك.",
    allow: "سماح",
    skip: "تخطي",
    manualCountry: "اختر الدولة يدوياً",
    enableNotifications: "تفعيل الإشعارات",
    notifRationale: "سنُعلمك عند تحديث توفر الكاش في الصرافات القريبة.",
    map: "الخريطة",
    nearby: "القريبة",
    favorites: "المفضلة",
    notifications: "الإشعارات",
    profile: "الحساب",
    search: "ابحث عن صراف، بنك، مدينة…",
    reportAtm: "الإبلاغ عن صراف",
    cashAvailable: "يوجد كاش",
    noCash: "لا يوجد كاش",
    busy: "مزدحم",
    outOfService: "خارج الخدمة",
    depositAvailable: "يقبل الإيداع",
    unknown: "غير معروف",
    filters: "التصفية",
    deposit: "إيداع",
    cardless: "بدون بطاقة",
    openNow: "مفتوح الآن",
    open24h: "24 ساعة",
    accessible: "متاح لذوي الهمم",
    directions: "الاتجاهات",
    share: "مشاركة",
    favorite: "المفضلة",
    report: "إبلاغ",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    signUp: "إنشاء حساب",
    signInGoogle: "المتابعة عبر Google",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    lastUpdate: "آخر تحديث",
    submit: "إرسال",
    cancel: "إلغاء",
    optionalComment: "تعليق اختياري",
    admin: "الإدارة",
    accessDenied: "403 — الوصول مرفوض",
    notAuthorized: "غير مصرح لك بعرض هذه الصفحة.",
    dashboard: "لوحة التحكم",
    users: "المستخدمون",
    atms: "الصرافات",
    reports: "التقارير",
    banks: "البنوك",
    analytics: "التحليلات",
    heatmap: "الخريطة الحرارية",
    leaderboard: "المتصدرون",
    logs: "السجلات",
    settings: "الإعدادات",
    admins: "المشرفون",
    goHome: "الرئيسية",
    xp: "نقاط",
    yourLocation: "موقعك",
    noResults: "لا توجد نتائج",
    predictedCash: "الذكاء الاصطناعي: احتمال {p}% لتوفر الكاش",
    findBest: "اقتراح أفضل صراف قريب",
    country: "الدولة",
  },
} as const;

type Key = keyof typeof dict.en;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("cashspot_lang")) as Lang | null;
    if (saved === "en" || saved === "ar") setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== "undefined") localStorage.setItem("cashspot_lang", l);
  };

  const t = (k: Key, vars?: Record<string, string | number>) => {
    let s: string = (dict[lang] as Record<string, string>)[k] ?? (dict.en as Record<string, string>)[k] ?? k;
    if (vars) for (const [key, val] of Object.entries(vars)) s = s.replace(`{${key}}`, String(val));
    return s;
  };

  return <Ctx.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
