-- =============================================
-- SEMP — 010_event_entry_fee
-- Biaya pendaftaran per nomor lomba
-- =============================================

alter table public.events
  add column if not exists entry_fee numeric(12,0) not null default 0;