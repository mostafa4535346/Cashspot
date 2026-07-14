
-- Enums
create type public.app_role as enum ('owner', 'admin', 'moderator', 'user');
create type public.atm_status as enum ('cash_available', 'no_cash', 'busy', 'out_of_service', 'deposit_available', 'unknown');
create type public.report_kind as enum ('cash_available', 'no_cash', 'broken', 'busy', 'deposit_working', 'cardless_working');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  photo_url text,
  xp integer not null default 0,
  language text not null default 'en',
  country text not null default 'EG',
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read all" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "roles read own" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role in ('owner','admin','moderator'))
$$;

-- Trigger: create profile + auto-promote owner
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if lower(new.email) = 'sasasasa0n2@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- BANKS
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  slug text unique not null,
  logo_url text,
  color text default '#0f172a',
  country text not null default 'EG',
  created_at timestamptz not null default now()
);
grant select on public.banks to anon, authenticated;
grant all on public.banks to service_role;
alter table public.banks enable row level security;
create policy "banks public read" on public.banks for select using (true);
create policy "banks staff write" on public.banks for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ATMS
create table public.atms (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid references public.banks(id) on delete set null,
  name text not null,
  name_ar text,
  address text,
  city text,
  governorate text,
  country text not null default 'EG',
  lat double precision not null,
  lng double precision not null,
  supports_deposit boolean not null default false,
  supports_cardless boolean not null default false,
  accessible boolean not null default false,
  open_24h boolean not null default true,
  status atm_status not null default 'unknown',
  last_status_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index atms_lat_lng_idx on public.atms(lat, lng);
create index atms_country_idx on public.atms(country);
grant select on public.atms to anon, authenticated;
grant insert, update on public.atms to authenticated;
grant all on public.atms to service_role;
alter table public.atms enable row level security;
create policy "atms public read" on public.atms for select using (true);
create policy "atms authenticated insert" on public.atms for insert to authenticated with check (auth.uid() = created_by);
create policy "atms staff update" on public.atms for update to authenticated using (public.is_staff(auth.uid()));
create policy "atms staff delete" on public.atms for delete to authenticated using (public.is_staff(auth.uid()));

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  atm_id uuid not null references public.atms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind report_kind not null,
  comment text,
  photo_url text,
  approved boolean not null default true,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index reports_atm_idx on public.reports(atm_id, created_at desc);
grant select on public.reports to anon, authenticated;
grant insert on public.reports to authenticated;
grant update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports public read" on public.reports for select using (true);
create policy "reports insert own" on public.reports for insert to authenticated with check (auth.uid() = user_id);
create policy "reports staff moderate" on public.reports for update to authenticated using (public.is_staff(auth.uid()));
create policy "reports staff delete" on public.reports for delete to authenticated using (public.is_staff(auth.uid()));

-- After a report, update ATM status & award XP
create or replace function public.after_report_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_status atm_status;
begin
  new_status := case new.kind
    when 'cash_available' then 'cash_available'::atm_status
    when 'no_cash' then 'no_cash'::atm_status
    when 'broken' then 'out_of_service'::atm_status
    when 'busy' then 'busy'::atm_status
    when 'deposit_working' then 'deposit_available'::atm_status
    when 'cardless_working' then 'cash_available'::atm_status
  end;
  update public.atms set status = new_status, last_status_at = now(), updated_at = now() where id = new.atm_id;
  update public.profiles set xp = xp + 10, updated_at = now() where id = new.user_id;
  return new;
end $$;
create trigger reports_after_insert after insert on public.reports
  for each row execute function public.after_report_insert();

-- FAVORITES
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  atm_id uuid not null references public.atms(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, atm_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favorites own" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  atm_id uuid references public.atms(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications own read" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "notifications own update" on public.notifications for update to authenticated using (auth.uid() = user_id);

-- BADGES
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  name_ar text,
  description text,
  icon text
);
grant select on public.badges to anon, authenticated;
grant all on public.badges to service_role;
alter table public.badges enable row level security;
create policy "badges public read" on public.badges for select using (true);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique(user_id, badge_id)
);
grant select on public.user_badges to anon, authenticated;
grant all on public.user_badges to service_role;
alter table public.user_badges enable row level security;
create policy "user_badges public read" on public.user_badges for select using (true);

-- ACTIVITY LOGS
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs(created_at desc);
grant all on public.activity_logs to service_role;
grant select on public.activity_logs to authenticated;
alter table public.activity_logs enable row level security;
create policy "logs staff read" on public.activity_logs for select to authenticated using (public.is_staff(auth.uid()));

-- AI PREDICTIONS
create table public.ai_predictions (
  id uuid primary key default gen_random_uuid(),
  atm_id uuid not null references public.atms(id) on delete cascade,
  probability_cash numeric(5,2),
  queue_estimate integer,
  reasoning text,
  created_at timestamptz not null default now()
);
grant select on public.ai_predictions to anon, authenticated;
grant all on public.ai_predictions to service_role;
alter table public.ai_predictions enable row level security;
create policy "ai public read" on public.ai_predictions for select using (true);

-- LEADERBOARD view
create or replace view public.leaderboard as
  select p.id as user_id, p.display_name, p.photo_url, p.xp,
         (select count(*) from public.reports r where r.user_id = p.id) as reports_count
  from public.profiles p
  where p.suspended = false
  order by p.xp desc
  limit 100;
grant select on public.leaderboard to anon, authenticated;

-- Seed banks (Egypt)
insert into public.banks (name, name_ar, slug, color, country) values
  ('National Bank of Egypt', 'البنك الأهلي المصري', 'nbe', '#0b6b3a', 'EG'),
  ('Banque Misr', 'بنك مصر', 'banque-misr', '#c8102e', 'EG'),
  ('Commercial International Bank', 'البنك التجاري الدولي', 'cib', '#5b2a86', 'EG'),
  ('QNB Alahli', 'بنك قطر الوطني الأهلي', 'qnb', '#780c1f', 'EG'),
  ('Arab African International Bank', 'العربي الأفريقي الدولي', 'aaib', '#1b3a6b', 'EG'),
  ('Bank of Alexandria', 'بنك الإسكندرية', 'alex-bank', '#e30613', 'EG'),
  ('HSBC Egypt', 'إتش إس بي سي مصر', 'hsbc-eg', '#db0011', 'EG'),
  ('Credit Agricole Egypt', 'كريدي أجريكول مصر', 'ca-eg', '#009639', 'EG');

-- Seed ATMs (Cairo & Alexandria)
insert into public.atms (bank_id, name, name_ar, address, city, governorate, country, lat, lng, supports_deposit, supports_cardless, accessible, status, last_status_at) values
  ((select id from public.banks where slug='nbe'), 'NBE Tahrir Square', 'الأهلي - ميدان التحرير', 'Tahrir Square', 'Cairo', 'Cairo', 'EG', 30.0444, 31.2357, true, true, true, 'cash_available', now()),
  ((select id from public.banks where slug='cib'), 'CIB Zamalek', 'CIB - الزمالك', '26th July St, Zamalek', 'Cairo', 'Cairo', 'EG', 30.0619, 31.2194, true, true, true, 'cash_available', now()),
  ((select id from public.banks where slug='banque-misr'), 'Banque Misr Nasr City', 'بنك مصر - مدينة نصر', 'Abbas El Akkad', 'Cairo', 'Cairo', 'EG', 30.0626, 31.3446, false, false, true, 'no_cash', now()),
  ((select id from public.banks where slug='qnb'), 'QNB Maadi', 'QNB - المعادي', 'Road 9, Maadi', 'Cairo', 'Cairo', 'EG', 29.9603, 31.2569, true, true, true, 'busy', now()),
  ((select id from public.banks where slug='aaib'), 'AAIB Heliopolis', 'العربي الأفريقي - مصر الجديدة', 'El Merghany St', 'Cairo', 'Cairo', 'EG', 30.0906, 31.3253, true, false, false, 'cash_available', now()),
  ((select id from public.banks where slug='alex-bank'), 'Alex Bank Downtown', 'بنك الإسكندرية - وسط البلد', 'Talaat Harb St', 'Cairo', 'Cairo', 'EG', 30.0505, 31.2410, true, true, true, 'cash_available', now()),
  ((select id from public.banks where slug='hsbc-eg'), 'HSBC Smart Village', 'HSBC - القرية الذكية', 'Km 28 Cairo-Alex Rd', 'Giza', 'Giza', 'EG', 30.0714, 31.0176, true, true, true, 'out_of_service', now()),
  ((select id from public.banks where slug='ca-eg'), 'CA Mohandessin', 'كريدي أجريكول - المهندسين', 'Gameat El Dowal', 'Giza', 'Giza', 'EG', 30.0563, 31.2011, false, false, true, 'cash_available', now()),
  ((select id from public.banks where slug='nbe'), 'NBE Alexandria Corniche', 'الأهلي - كورنيش الإسكندرية', 'Corniche Rd', 'Alexandria', 'Alexandria', 'EG', 31.2001, 29.9187, true, false, true, 'cash_available', now()),
  ((select id from public.banks where slug='cib'), 'CIB San Stefano', 'CIB - سان ستيفانو', 'San Stefano Mall', 'Alexandria', 'Alexandria', 'EG', 31.2451, 29.9647, true, true, true, 'deposit_available', now()),
  ((select id from public.banks where slug='qnb'), 'QNB New Cairo', 'QNB - القاهرة الجديدة', 'Tagamoa El Khames', 'Cairo', 'Cairo', 'EG', 30.0271, 31.4970, true, true, true, 'cash_available', now()),
  ((select id from public.banks where slug='banque-misr'), 'Banque Misr 6 October', 'بنك مصر - 6 أكتوبر', 'Hosary Square', 'Giza', 'Giza', 'EG', 29.9660, 30.9187, true, false, true, 'cash_available', now());

-- Seed badges
insert into public.badges (code, name, name_ar, description, icon) values
  ('first_report', 'First Report', 'أول تقرير', 'Submitted your first report', 'award'),
  ('ten_reports', '10 Reports', '10 تقارير', 'Submitted 10 reports', 'medal'),
  ('cash_finder', 'Cash Finder', 'مكتشف الكاش', 'Helped others find cash', 'banknote'),
  ('community_hero', 'Community Hero', 'بطل المجتمع', 'Top contributor', 'trophy');
