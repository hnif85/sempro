-- =============================================
-- SEMP — 009_event_fields
-- Tambah kolom kategori, kelas, jumlah seri pernomor
-- =============================================

alter table public.events
  add column if not exists category text,
  add column if not exists class_name text,
  add column if not exists heats_per_number int not null default 1;