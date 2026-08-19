-- =============================================
-- SEMP — 013_role_club_coach
-- Tambah role 'club_coach' (Pelatih / PIC club)
--
-- Akses data club-scoped sudah berbasis keanggotaan
-- (profiles.club_id), bukan berbasis role, jadi club_coach
-- otomatis mendapat akses atlet/registrasi/invoice milik
-- club-nya tanpa perlu policy tambahan.
-- Pembatasan akses billing (canManageBilling) diterapkan
-- di layer aplikasi.
-- Idempotent: aman dijalankan berulang
-- =============================================

do $$ begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'public'
  ) then
    raise exception 'type public.user_role tidak ada — jalankan migrasi 001 dulu';
  end if;
end $$;

alter type public.user_role add value if not exists 'club_coach';