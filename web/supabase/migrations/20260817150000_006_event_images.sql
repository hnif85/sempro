-- =============================================
-- SEMP — 006_event_images
-- Storage bucket untuk banner / logo event
-- Idempotent: aman dijalankan berulang
-- =============================================

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

update storage.buckets
set public = true
where id = 'event-images';

drop policy if exists "event_images_public_read" on storage.objects;
create policy "event_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-images');

drop policy if exists "event_images_authenticated_write" on storage.objects;
create policy "event_images_authenticated_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images');

drop policy if exists "event_images_authenticated_update" on storage.objects;
create policy "event_images_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-images')
  with check (bucket_id = 'event-images');

drop policy if exists "event_images_authenticated_delete" on storage.objects;
create policy "event_images_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-images');
