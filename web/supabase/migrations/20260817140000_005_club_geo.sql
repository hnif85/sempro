-- =============================================
-- SEMP — 005_club_geo
-- Data geografis club dari RajaOngkir Komerce API
-- Idempotent: aman dijalankan berulang
-- =============================================

alter table public.clubs
  add column if not exists destination_id bigint,
  add column if not exists province_name text,
  add column if not exists city_name text,
  add column if not exists district_name text,
  add column if not exists subdistrict_name text,
  add column if not exists zip_code text;