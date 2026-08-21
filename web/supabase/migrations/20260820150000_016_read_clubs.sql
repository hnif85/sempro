-- SEMP — Izinkan semua user authenticated membaca data club.
-- Tanpa ini, nested relation clubs(name) pada registrasi/atlet selalu null
-- untuk role selain admin dan manager club sendiri.

drop policy if exists "read_clubs" on public.clubs;
create policy "read_clubs" on public.clubs for select
  to authenticated
  using (true);
