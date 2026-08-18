-- =============================================
-- SEMP — Base Schema (PRD + PDF merge)
-- Idempotent: aman dijalankan berulang
-- =============================================

-- ---------- Helper: current user role from JWT app_metadata ----------
-- Role is stored in app_metadata (not user_metadata) per security best practice.
create or replace function auth_role()
returns text
language sql
stable
as $$
  select coalesce(nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''), 'anon')
$$;

-- ---------- Enums ----------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'event_status' and n.nspname = 'public') then
    create type public.event_status as enum (
      'draft', 'published', 'registration_open', 'registration_closed', 'running', 'finished'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum (
      'super_admin', 'admin_event', 'club_manager', 'official'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'club_status' and n.nspname = 'public') then
    create type public.club_status as enum (
      'draft', 'complete', 'finalized'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'registration_status' and n.nspname = 'public') then
    create type public.registration_status as enum (
      'draft', 'finalized', 'cancelled'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'invoice_status' and n.nspname = 'public') then
    create type public.invoice_status as enum (
      'draft', 'awaiting_payment', 'paid', 'cancelled'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'payment_method' and n.nspname = 'public') then
    create type public.payment_method as enum (
      'bank_transfer', 'qris', 'manual'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'entry_status' and n.nspname = 'public') then
    create type public.entry_status as enum (
      'registered', 'hadir', 'dns', 'selesai'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'certificate_type' and n.nspname = 'public') then
    create type public.certificate_type as enum (
      'peserta', 'juara'
    );
  end if;
end $$;

-- ---------- Profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'club_manager',
  club_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Clubs ----------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pic_name text,
  whatsapp text,
  city text,
  school text,
  token text unique,
  status public.club_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_club_id_fkey;
alter table public.profiles
  add constraint profiles_club_id_fkey foreign key (club_id) references public.clubs(id) on delete set null;

-- ---------- Events ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  banner_url text,
  logo_url text,
  location text,
  organizer text,
  start_date date,
  end_date date,
  lanes_count int not null default 6,
  status public.event_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Master reference ----------
create table if not exists public.swimming_styles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
insert into public.swimming_styles (name) values
  ('Gaya Bebas'), ('Gaya Dada'), ('Gaya Punggung'), ('Gaya Kupu'), ('Gaya Ganti')
on conflict (name) do nothing;

create table if not exists public.age_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_age int,
  max_age int
);
insert into public.age_categories (name, min_age, max_age) values
  ('KU 5-7', 5, 7),
  ('KU 8-10', 8, 10),
  ('KU 11-12', 11, 12),
  ('KU 13-14', 13, 14),
  ('Open', null, null)
on conflict (name) do nothing;

create table if not exists public.distances (
  id uuid primary key default gen_random_uuid(),
  meters int not null unique
);
insert into public.distances (meters) values (25), (50), (100), (200), (400)
on conflict (meters) do nothing;

-- ---------- Nomor Lomba ----------
create table if not exists public.event_numbers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  style_id uuid references public.swimming_styles(id),
  distance_id uuid references public.distances(id),
  gender text not null check (gender in ('putra', 'putri', 'campuran')),
  age_category_id uuid references public.age_categories(id),
  max_participants int,
  fee numeric(12,0) not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

-- ---------- Athletes ----------
create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  name text not null,
  birth_date date,
  gender text check (gender in ('putra', 'putri')),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Registrasi ----------
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  event_number_id uuid not null references public.event_numbers(id) on delete cascade,
  seed_time text,
  status public.registration_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (event_id, athlete_id, event_number_id)
);

-- ---------- Invoice & Payment ----------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  invoice_number text not null unique,
  total numeric(12,0) not null default 0,
  status public.invoice_status not null default 'draft',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  description text,
  amount numeric(12,0) not null default 0
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  method public.payment_method not null,
  amount numeric(12,0) not null,
  proof_url text,
  status text not null default 'pending', -- pending | verified | rejected
  verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Susunan Acara ----------
create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_number_id uuid not null references public.event_numbers(id) on delete cascade,
  acara_number int not null,
  estimated_time text,
  created_at timestamptz not null default now(),
  unique (event_id, acara_number)
);

-- ---------- Heat / Seri / Kelompok ----------
create table if not exists public.heats (
  id uuid primary key default gen_random_uuid(),
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  heat_number int not null default 1,
  status text not null default 'dns', -- dns | dnt
  created_at timestamptz not null default now(),
  unique (schedule_item_id, heat_number)
);

create table if not exists public.heat_entries (
  id uuid primary key default gen_random_uuid(),
  heat_id uuid not null references public.heats(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  lane int not null,
  seed_time text,
  result_time text,
  place int,
  status public.entry_status not null default 'registered',
  created_at timestamptz not null default now(),
  unique (heat_id, lane),
  unique (heat_id, registration_id)
);

-- ---------- Hasil / Rekap ----------
create table if not exists public.medal_tallies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  athlete_id uuid references public.athletes(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  gold int not null default 0,
  silver int not null default 0,
  bronze int not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, athlete_id),
  unique (event_id, club_id)
);

-- ---------- Sertifikat ----------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  cert_type public.certificate_type not null,
  title text,
  place int,
  qr_token text not null unique,
  file_url text,
  created_at timestamptz not null default now()
);

-- ---------- Sponsor & Branding ----------
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  logo_url text,
  position int not null default 1,
  created_at timestamptz not null default now()
);

-- ---------- Dokumentasi Event ----------
create table if not exists public.event_docs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  media_type text not null check (media_type in ('foto', 'video', 'pdf')),
  url text not null,
  caption text,
  file_name text,
  created_at timestamptz not null default now()
);

-- ---------- Riwayat Atlet (view) ----------
-- Ranking hasil per nomor untuk personal best
create or replace view public.athlete_results with (security_invoker = true) as
select
  r.event_id,
  r.athlete_id,
  a.name as athlete_name,
  a.club_id,
  en.name as number_name,
  he.result_time,
  he.place,
  e.name as event_name
from public.heat_entries he
join public.registrations r on r.id = he.registration_id
join public.athletes a on a.id = r.athlete_id
join public.event_numbers en on en.id = r.event_number_id
join public.events e on e.id = r.event_id
where he.result_time is not null;

-- ---------- Audit Log ----------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists clubs_updated_at on public.clubs;
create trigger clubs_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
drop trigger if exists athletes_updated_at on public.athletes;
create trigger athletes_updated_at before update on public.athletes
  for each row execute function public.set_updated_at();

-- =============================================
-- RLS
-- =============================================
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.events enable row level security;
alter table public.swimming_styles enable row level security;
alter table public.age_categories enable row level security;
alter table public.distances enable row level security;
alter table public.event_numbers enable row level security;
alter table public.athletes enable row level security;
alter table public.registrations enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.schedule_items enable row level security;
alter table public.heats enable row level security;
alter table public.heat_entries enable row level security;
alter table public.medal_tallies enable row level security;
alter table public.certificates enable row level security;
alter table public.sponsors enable row level security;
alter table public.event_docs enable row level security;
alter table public.audit_logs enable row level security;

-- Admin (super_admin & admin_event) can read all
drop policy if exists "admin_read_profiles" on public.profiles;
create policy "admin_read_profiles" on public.profiles for select
  to authenticated using (auth_role() in ('super_admin', 'admin_event'));

-- Super admin: full manage
drop policy if exists "super_admin_all_profiles" on public.profiles;
create policy "super_admin_all_profiles" on public.profiles for all
  to authenticated using (auth_role() = 'super_admin')
  with check (auth_role() = 'super_admin');

-- User reads own profile
drop policy if exists "own_profile" on public.profiles;
create policy "own_profile" on public.profiles for select
  to authenticated using (auth.uid() = id);

-- Admin reads/writes clubs
drop policy if exists "admin_all_clubs" on public.clubs;
create policy "admin_all_clubs" on public.clubs for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

-- Club manager reads own club
drop policy if exists "club_read_own" on public.clubs;
create policy "club_read_own" on public.clubs for select
  to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.club_id = clubs.id
    )
  );

-- Club manager updates own club
drop policy if exists "club_update_own" on public.clubs;
create policy "club_update_own" on public.clubs for update
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = clubs.id)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = clubs.id)
  );

-- Events: admins manage, others read
drop policy if exists "admin_all_events" on public.events;
create policy "admin_all_events" on public.events for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "read_events" on public.events;
create policy "read_events" on public.events for select
  to authenticated using (true);

-- Master reference: readable by all authenticated
drop policy if exists "read_styles" on public.swimming_styles;
create policy "read_styles" on public.swimming_styles for select
  to authenticated using (true);
drop policy if exists "read_age_categories" on public.age_categories;
create policy "read_age_categories" on public.age_categories for select
  to authenticated using (true);
drop policy if exists "read_distances" on public.distances;
create policy "read_distances" on public.distances for select
  to authenticated using (true);

-- Nomor lomba: admins manage, others read
drop policy if exists "admin_all_event_numbers" on public.event_numbers;
create policy "admin_all_event_numbers" on public.event_numbers for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));
drop policy if exists "read_event_numbers" on public.event_numbers;
create policy "read_event_numbers" on public.event_numbers for select
  to authenticated using (true);

-- Athletes: club manager manages own club's athletes, admin manages all
drop policy if exists "admin_all_athletes" on public.athletes;
create policy "admin_all_athletes" on public.athletes for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "club_all_athletes" on public.athletes;
create policy "club_all_athletes" on public.athletes for all
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = athletes.club_id)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = athletes.club_id)
  );

drop policy if exists "read_athletes" on public.athletes;
create policy "read_athletes" on public.athletes for select
  to authenticated using (true);

-- Registrations: admins all, club manages own, officials read
drop policy if exists "admin_all_registrations" on public.registrations;
create policy "admin_all_registrations" on public.registrations for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "club_all_registrations" on public.registrations;
create policy "club_all_registrations" on public.registrations for all
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = registrations.club_id)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = registrations.club_id)
  );

drop policy if exists "read_registrations" on public.registrations;
create policy "read_registrations" on public.registrations for select
  to authenticated using (true);

-- Invoices: admins all, club reads/writes own
drop policy if exists "admin_all_invoices" on public.invoices;
create policy "admin_all_invoices" on public.invoices for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "club_read_invoices" on public.invoices;
create policy "club_read_invoices" on public.invoices for select
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.club_id = invoices.club_id)
  );

-- Invoice items follow invoice visibility
drop policy if exists "admin_all_invoice_items" on public.invoice_items;
create policy "admin_all_invoice_items" on public.invoice_items for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "club_read_invoice_items" on public.invoice_items;
create policy "club_read_invoice_items" on public.invoice_items for select
  to authenticated using (
    exists (
      select 1 from public.invoices i
      join public.profiles p on p.id = auth.uid()
      where i.id = invoice_items.invoice_id and p.club_id = i.club_id
    )
  );

-- Payments: admins all, club manages own
drop policy if exists "admin_all_payments" on public.payments;
create policy "admin_all_payments" on public.payments for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "club_all_payments" on public.payments;
create policy "club_all_payments" on public.payments for all
  to authenticated using (
    exists (
      select 1 from public.invoices i
      join public.profiles p on p.id = auth.uid()
      where i.id = payments.invoice_id and p.club_id = i.club_id
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      join public.profiles p on p.id = auth.uid()
      where i.id = payments.invoice_id and p.club_id = i.club_id
    )
  );

-- Schedule: admins all, others read
drop policy if exists "admin_all_schedule" on public.schedule_items;
create policy "admin_all_schedule" on public.schedule_items for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));
drop policy if exists "read_schedule" on public.schedule_items;
create policy "read_schedule" on public.schedule_items for select
  to authenticated using (true);

-- Heats: admins + officials manage, others read
drop policy if exists "admin_all_heats" on public.heats;
create policy "admin_all_heats" on public.heats for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event', 'official'))
  with check (auth_role() in ('super_admin', 'admin_event', 'official'));
drop policy if exists "read_heats" on public.heats;
create policy "read_heats" on public.heats for select
  to authenticated using (true);

-- Heat entries: admins + officials manage, others read
drop policy if exists "admin_all_heat_entries" on public.heat_entries;
create policy "admin_all_heat_entries" on public.heat_entries for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event', 'official'))
  with check (auth_role() in ('super_admin', 'admin_event', 'official'));
drop policy if exists "read_heat_entries" on public.heat_entries;
create policy "read_heat_entries" on public.heat_entries for select
  to authenticated using (true);

-- Medal tallies: admins manage, others read
drop policy if exists "admin_all_medal_tallies" on public.medal_tallies;
create policy "admin_all_medal_tallies" on public.medal_tallies for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));
drop policy if exists "read_medal_tallies" on public.medal_tallies;
create policy "read_medal_tallies" on public.medal_tallies for select
  to authenticated using (true);

-- Certificates: admins manage, read by all + public verification
drop policy if exists "admin_all_certificates" on public.certificates;
create policy "admin_all_certificates" on public.certificates for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));
drop policy if exists "read_certificates" on public.certificates;
create policy "read_certificates" on public.certificates for select
  to authenticated using (true);

-- Public QR verification (no auth)
drop policy if exists "public_verify_certificate" on public.certificates;
create policy "public_verify_certificate" on public.certificates for select
  to anon using (true);

-- Sponsors: admins manage, others read
drop policy if exists "admin_all_sponsors" on public.sponsors;
create policy "admin_all_sponsors" on public.sponsors for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));
drop policy if exists "read_sponsors" on public.sponsors;
create policy "read_sponsors" on public.sponsors for select
  to authenticated using (true);

-- Event docs: admins manage, others read
drop policy if exists "admin_all_event_docs" on public.event_docs;
create policy "admin_all_event_docs" on public.event_docs for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));
drop policy if exists "read_event_docs" on public.event_docs;
create policy "read_event_docs" on public.event_docs for select
  to authenticated using (true);

-- Audit logs: admins read, super admin writes via trigger
drop policy if exists "admin_read_audit_logs" on public.audit_logs;
create policy "admin_read_audit_logs" on public.audit_logs for select
  to authenticated using (auth_role() in ('super_admin', 'admin_event'));