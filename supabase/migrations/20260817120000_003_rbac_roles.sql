-- =============================================
-- SEMP — 003_rbac_roles (5 role RBAC)
-- super_admin, admin_event, club_manager, official (per-event), peserta
-- Idempotent: aman dijalankan berulang
-- =============================================

-- ---------- Tambah role 'peserta' ----------
alter type public.user_role add value if not exists 'peserta';

-- ---------- Link profile ke athlete (untuk role peserta) ----------
alter table public.profiles
  add column if not exists athlete_id uuid references public.athletes(id) on delete set null;

-- ---------- Penugasan official per event ----------
create table if not exists public.event_officials (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_officials enable row level security;

drop policy if exists "admin_all_event_officials" on public.event_officials;
create policy "admin_all_event_officials" on public.event_officials for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "read_event_officials" on public.event_officials;
create policy "read_event_officials" on public.event_officials for select
  to authenticated using (true);

-- ---------- Helper: cek official ditugaskan ke event ----------
create or replace function public.is_event_official(event_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_officials
    where event_id = event_uuid and user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_heat(schedule_item_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schedule_items si
    join public.event_officials eo on eo.event_id = si.event_id
    where si.id = schedule_item_uuid and eo.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_heat_entry(entry_heat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.heats h
    join public.schedule_items si on si.id = h.schedule_item_id
    join public.event_officials eo on eo.event_id = si.event_id
    where h.id = entry_heat_id and eo.user_id = auth.uid()
  );
$$;

-- ---------- Rombak policy heats: hapus 'official' global, scoped ke event ----------
drop policy if exists "admin_all_heats" on public.heats;
create policy "admin_all_heats" on public.heats for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "official_manage_assigned_heats" on public.heats;
create policy "official_manage_assigned_heats" on public.heats for all
  to authenticated using (auth_role() = 'official' and public.can_manage_heat(schedule_item_id))
  with check (auth_role() = 'official' and public.can_manage_heat(schedule_item_id));

drop policy if exists "admin_all_heat_entries" on public.heat_entries;
create policy "admin_all_heat_entries" on public.heat_entries for all
  to authenticated using (auth_role() in ('super_admin', 'admin_event'))
  with check (auth_role() in ('super_admin', 'admin_event'));

drop policy if exists "official_manage_assigned_heat_entries" on public.heat_entries;
create policy "official_manage_assigned_heat_entries" on public.heat_entries for all
  to authenticated using (auth_role() = 'official' and public.can_manage_heat_entry(heat_id))
  with check (auth_role() = 'official' and public.can_manage_heat_entry(heat_id));

-- ---------- Peserta: daftar sendiri (insert registrasi untuk athlete miliknya) ----------
drop policy if exists "peserta_register_own" on public.registrations;
create policy "peserta_register_own" on public.registrations for insert
  to authenticated with check (
    auth_role() = 'peserta'
    and athlete_id = (select p.athlete_id from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "peserta_update_own_registration" on public.registrations;
create policy "peserta_update_own_registration" on public.registrations for update
  to authenticated using (
    auth_role() = 'peserta'
    and athlete_id = (select p.athlete_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    auth_role() = 'peserta'
    and athlete_id = (select p.athlete_id from public.profiles p where p.id = auth.uid())
  );