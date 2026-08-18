-- =============================================
-- SEMP — 012_public_event_storage
-- Pastikan media event dapat dibaca publik
-- Idempotent: aman dijalankan berulang
-- =============================================

update storage.buckets
set public = true
where id = 'event-images';
