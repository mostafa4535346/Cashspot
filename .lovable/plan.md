# CashSpot — Build Plan

A premium community-powered ATM cash-availability app, Egypt/Arab world first, world-ready. Google Maps + Uber + Revolut feel. Bilingual (EN/AR with full RTL), dark/light mode.

This is a large scope. I'll ship a coherent v1 with everything wired end-to-end, then we can iterate on AI depth and admin analytics in follow-ups.

---

## 1. Stack & Foundations

- TanStack Start (already scaffolded) + Tailwind v4 design system
- Lovable Cloud (Supabase) for DB, auth, RLS, storage
- Google Sign-In via Lovable Cloud managed OAuth (+ Email/password, + Phone OTP)
- Maps: MapLibre GL JS + free OSM tiles (no API key needed, works globally). Google Maps SDK requires a paid key — MapLibre gives the same look/feel without blocking the build. We can swap to Google Maps later if you provide a key.
- i18n: lightweight custom provider (EN/AR), `dir="rtl"` toggling on `<html>`, persisted in `localStorage`
- Design tokens in `src/styles.css` (oklch), glassmorphism utilities, rounded-2xl, motion via CSS + Framer-style transitions

## 2. Onboarding Flow (`/onboarding`)

First-launch gate stored in `localStorage.cashspot_onboarded`. Root redirects `/` → `/onboarding` until complete.

- Step 1: Logo + city illustration (generated), "Welcome to CashSpot", Get Started
- Step 2: Language (EN / العربية) — sets `dir` + persists
- Step 3: Geolocation permission → auto-detect; fallback to country picker (Egypt default, then Arab countries, then world)
- Step 4: Notification permission (Web Notification API) with clear rationale

## 3. Home / Map (`/`)

- Full-screen MapLibre map, user location marker, ATM pins colored by status (green/red/orange/gray/blue)
- Top: glass search bar (name/bank/street/city/governorate/country) + filter chips
- FAB: Report ATM
- Bottom nav: Map · Nearby · Favorites · Notifications · Profile
- ATM detail sheet: bank logo, name, address, distance, status, queue, deposit, cardless, accessibility, last update, Directions/Favorite/Share/Report

## 4. Community Reports

- Report sheet: status (cash/no cash/broken/busy/deposit ok/cardless ok), optional comment, optional photo (Supabase Storage)
- Recomputes ATM current status from recent reports (weighted by recency + reporter XP)
- Awards XP + badges

## 5. AI Features (Lovable AI Gateway, `openai/gpt-5.5`)

- Server function `predictAtm`: given recent reports + time-of-day, returns availability probability + recommended alternative
- Server function `detectFakeReport`: flags suspicious reports (heuristic + LLM)
- Surfaced in ATM detail ("AI: 82% likely to have cash") and Nearby ("Best pick")

## 6. Auth

- Google OAuth (managed), Email/password, Phone OTP
- `profiles` table auto-created via trigger (photo, display name, xp, country, language)
- `user_roles` table + `has_role()` security-definer function (owner/admin/moderator/user)

## 7. Owner + Admin Panel (`/AdminXYG`)

- Server-side role check via `has_role`; non-admins get 403 page (no link anywhere in public UI)
- Owner seeded on first boot: `sasasasa0n2@gmail.com` / `sasa1234` (via signed-in server function that promotes this specific email to `owner` on first login; password managed by Supabase Auth — we cannot pre-seed a plaintext password securely, so on first sign-up with that email the role is auto-assigned)
- Pages: Dashboard, Users, ATMs, Reports (approve/reject), Banks, Analytics, Heatmap, Leaderboard, Notifications, Settings, Logs
- Owner-only "Admin Management" subpage: create/edit/disable/delete/reset admins, view per-admin activity log
- Every mutation goes through `requireSupabaseAuth` + role check + writes to `activity_logs`

## 8. Notifications

- In-app notifications table + bell dropdown
- Web Push (Notification API) for: favorite ATM cash / nearby status change / broken repaired
- Triggered by DB triggers on new reports affecting favorites/nearby

## 9. Database (Lovable Cloud migrations)

Tables: `profiles`, `user_roles`, `banks`, `atms`, `reports`, `favorites`, `notifications`, `badges`, `user_badges`, `leaderboard` (view), `activity_logs`, `ai_predictions`. RLS on all. Public read for `banks`/`atms`; authenticated write for `reports`/`favorites`; owner/admin-only for management tables. GRANTs per Lovable standard. Seed: Egypt banks (NBE, CIB, Banque Misr, QNB, AAIB, Alex Bank…) + ~30 sample Cairo/Alexandria ATMs so the map isn't empty.

## 10. Security

- Passwords: Supabase Auth (bcrypt) — never plaintext
- RLS everywhere, role checks server-side on every admin route
- Input validation with Zod on every server function
- Report spam guard: max N reports/user/ATM/hour (checked in server fn, since no infra rate-limiter)
- Owner email hardcoded in a server-only constant; role assignment is server-verified

## 11. Design

- Palette: deep midnight navy + electric mint (cash-green) + coral (no-cash) accents; oklch tokens
- Glassmorphism sheets, rounded-2xl, subtle shadows, SF-like system font stack + Cairo for Arabic
- Full dark/light with system default; language toggle + theme toggle in Profile

## 12. Routes

```
/onboarding                (public, gates first launch)
/                          (map home)
/nearby /favorites /notifications /profile
/atm/$id
/auth                      (login/signup/google/phone)
/AdminXYG                  (owner+admin only)
/AdminXYG/users /atms /reports /banks /analytics /heatmap /leaderboard /notifications /settings /logs /admins
/403
```

## 13. Out of scope for v1 (flag for follow-up)

- Real Google Maps SDK (needs paid API key) — using MapLibre + OSM
- Real SMS provider for phone OTP beyond Supabase's built-in
- Native mobile push (web push only)
- Full ML model — AI uses LLM heuristics on recent reports
- Full multi-country ATM dataset — seeding Egypt; other countries populated by community

---

Shall I proceed to build this? If yes, I'll enable Lovable Cloud, run the schema migration, seed banks + Egypt ATMs, and build the UI in one pass.
