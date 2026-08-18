-- =============================================
-- SEMP — 008_event_pdf_column
-- Simpan PDF utama event langsung di tabel events
-- =============================================

alter table public.events
  add column if not exists pdf_url text;