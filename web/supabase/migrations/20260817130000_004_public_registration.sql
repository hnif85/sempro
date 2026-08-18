-- =============================================
-- SEMP — 004_public_registration
-- Dukungan pendaftaran publik: peserta boleh tanpa club
-- Idempotent: aman dijalankan berulang
-- =============================================

-- Peserta individu (tanpa club): club_id boleh kosong
alter table public.athletes
  alter column club_id drop not null;

-- RLS: anon boleh insert ke athletes via RPC/insert policy saat daftar publik.
-- Insert publik dikerjakan server action (service role), jadi cukup izinkan
-- baca daftar club untuk dropdown pendaftaran (nama & kota saja).
drop policy if exists "anon_read_clubs_public" on public.clubs;
create policy "anon_read_clubs_public" on public.clubs for select
  to anon using (status in ('draft', 'complete', 'finalized'));

drop policy if exists "anon_read_athletes_public" on public.athletes;
create policy "anon_read_athletes_public" on public.athletes for select
  to anon using (true);

-- Read clubs for dropdown registration
drop policy if exists "anon_read_event_numbers" on public.event_numbers;
create policy "anon_read_event_numbers" on public.event_numbers for select
  to anon using (true);