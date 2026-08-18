-- =============================================
-- SEMP — Seed data demo (untuk development)
-- Idempotent: aman dijalankan berulang
-- =============================================

-- Default admin user (password: semp1234)
-- Note: dibuat lewat auth; insert profile setelah user dibuat via dashboard.

-- Clubs demo
insert into public.clubs (name, pic_name, whatsapp, city, token, status) values
  ('Tirta Sport Club', 'Bambang S.', '081234567890', 'Jakarta', 'tokentirta2026', 'complete'),
  ('Aqua Prima', 'Dewi L.', '081298765432', 'Bandung', 'tokenaqua2026', 'complete'),
  ('Garuda Aquatic', 'Rudi H.', '081211122233', 'Surabaya', 'tokengaruda2026', 'draft')
on conflict (token) do nothing;

-- Event demo
insert into public.events (name, description, location, organizer, start_date, end_date, lanes_count, status)
select 'Jakarta Open 2026', 'Kejuaraan renang terbuka antar club se-Jabodetabek', 'Kolam Renang Gelora Bung Karno', 'PRSI Jakarta', '2026-09-12', '2026-09-14', 8, 'registration_open'
where not exists (select 1 from public.events where name = 'Jakarta Open 2026');

-- Nomor lomba demo
insert into public.event_numbers (event_id, name, style_id, distance_id, gender, age_category_id, fee)
select
  e.id,
  '50m Gaya Bebas Putra KU 8-10',
  (select id from public.swimming_styles where name = 'Gaya Bebas'),
  (select id from public.distances where meters = 50),
  'putra',
  (select id from public.age_categories where name = 'KU 8-10'),
  75000
from public.events e
where e.name = 'Jakarta Open 2026'
  and not exists (
    select 1 from public.event_numbers en
    where en.event_id = e.id and en.name = '50m Gaya Bebas Putra KU 8-10'
  );

insert into public.event_numbers (event_id, name, style_id, distance_id, gender, age_category_id, fee)
select
  e.id,
  '100m Gaya Dada Putri KU 11-12',
  (select id from public.swimming_styles where name = 'Gaya Dada'),
  (select id from public.distances where meters = 100),
  'putri',
  (select id from public.age_categories where name = 'KU 11-12'),
  75000
from public.events e
where e.name = 'Jakarta Open 2026'
  and not exists (
    select 1 from public.event_numbers en
    where en.event_id = e.id and en.name = '100m Gaya Dada Putri KU 11-12'
  );

insert into public.event_numbers (event_id, name, style_id, distance_id, gender, age_category_id, fee)
select
  e.id,
  '50m Gaya Kupu Putra KU 8-10',
  (select id from public.swimming_styles where name = 'Gaya Kupu'),
  (select id from public.distances where meters = 50),
  'putra',
  (select id from public.age_categories where name = 'KU 8-10'),
  75000
from public.events e
where e.name = 'Jakarta Open 2026'
  and not exists (
    select 1 from public.event_numbers en
    where en.event_id = e.id and en.name = '50m Gaya Kupu Putra KU 8-10'
  );

-- Atlet demo (Tirta Sport Club)
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Andi Wijaya', '2016-03-01', 'putra' from public.clubs where name = 'Tirta Sport Club'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Andi Wijaya');
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Budi Santoso', '2015-07-15', 'putra' from public.clubs where name = 'Tirta Sport Club'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Budi Santoso');
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Cici Lestari', '2014-01-20', 'putri' from public.clubs where name = 'Tirta Sport Club'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Cici Lestari');
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Dedi Kurnia', '2016-11-05', 'putra' from public.clubs where name = 'Tirta Sport Club'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Dedi Kurnia');
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Eka Putri', '2015-05-30', 'putri' from public.clubs where name = 'Tirta Sport Club'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Eka Putri');

-- Atlet demo (Aqua Prima)
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Fajar Nugroho', '2015-02-11', 'putra' from public.clubs where name = 'Aqua Prima'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Fajar Nugroho');
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Gita Prameswari', '2014-08-22', 'putri' from public.clubs where name = 'Aqua Prima'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Gita Prameswari');
insert into public.athletes (club_id, name, birth_date, gender)
select id, 'Hendra Gunawan', '2016-04-18', 'putra' from public.clubs where name = 'Aqua Prima'
  and not exists (select 1 from public.athletes a where a.club_id = public.clubs.id and a.name = 'Hendra Gunawan');