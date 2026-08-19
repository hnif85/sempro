-- =============================================
-- SEMP — 014_profile_contact_fields
-- Semua data pribadi pengguna disimpan di tabel profiles
-- Idempotent: aman dijalankan berulang
-- =============================================

alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists gender text check (gender in ('putra', 'putri')),
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists postal_code text;