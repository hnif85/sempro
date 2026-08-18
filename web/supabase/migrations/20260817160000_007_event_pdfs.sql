-- =============================================
-- SEMP — 007_event_pdfs
-- Perluas event_docs untuk mendukung PDF
-- (media_type + file_name), file disimpan di
-- bucket storage 'event-images'
-- =============================================

alter table public.event_docs
  drop constraint if exists event_docs_media_type_check;

alter table public.event_docs
  add constraint event_docs_media_type_check
  check (media_type in ('foto', 'video', 'pdf'));

alter table public.event_docs
  add column if not exists file_name text;