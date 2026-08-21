-- SEMP — Admin event hanya mengakses event yang dibuat sendiri.

-- Event demo lama belum punya owner. Tetapkan ke super admin agar tetap terkelola;
-- EO baru hanya melihat event yang mereka buat setelah ini.
update public.events
set created_by = (
  select p.id
  from public.profiles p
  where p.role = 'super_admin'
  order by p.id
  limit 1
)
where created_by is null
  and exists (
    select 1 from public.profiles p where p.role = 'super_admin'
  );

create or replace function public.can_access_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.auth_role() = 'super_admin'
    or (
      public.auth_role() = 'admin_event'
      and exists (
        select 1
        from public.events e
        where e.id = p_event_id
          and e.created_by = auth.uid()
      )
    )
    or (
      public.auth_role() = 'official'
      and exists (
        select 1
        from public.event_officials eo
        where eo.event_id = p_event_id
          and eo.user_id = auth.uid()
      )
    );
$$;

revoke execute on function public.can_access_event(uuid) from public;
grant execute on function public.can_access_event(uuid) to authenticated;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.auth_role() = 'super_admin'
    or (
      public.auth_role() = 'admin_event'
      and exists (
        select 1
        from public.events e
        where e.id = p_event_id
          and e.created_by = auth.uid()
      )
    );
$$;

revoke execute on function public.can_manage_event(uuid) from public;
grant execute on function public.can_manage_event(uuid) to authenticated;

-- Events: super admin global, EO own events, other authenticated users read public events.
drop policy if exists "admin_all_events" on public.events;
drop policy if exists "read_events" on public.events;

create policy "super_admin_all_events" on public.events for all
  to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

create policy "admin_event_own_events" on public.events for all
  to authenticated
  using (public.auth_role() = 'admin_event' and created_by = auth.uid())
  with check (public.auth_role() = 'admin_event' and created_by = auth.uid());

create policy "read_non_admin_events" on public.events for select
  to authenticated
  using (public.auth_role() <> 'admin_event');

-- Event-owned tables: EO can access only rows belonging to own event.
drop policy if exists "admin_all_event_numbers" on public.event_numbers;
drop policy if exists "read_event_numbers" on public.event_numbers;
create policy "admin_event_scoped_event_numbers" on public.event_numbers for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_event_numbers" on public.event_numbers for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

drop policy if exists "admin_all_registrations" on public.registrations;
drop policy if exists "read_registrations" on public.registrations;
create policy "admin_event_scoped_registrations" on public.registrations for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_registrations" on public.registrations for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

drop policy if exists "admin_all_invoices" on public.invoices;
create policy "admin_event_scoped_invoices" on public.invoices for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "admin_all_schedule" on public.schedule_items;
drop policy if exists "read_schedule" on public.schedule_items;
create policy "admin_event_scoped_schedule" on public.schedule_items for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_schedule" on public.schedule_items for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

drop policy if exists "admin_all_medal_tallies" on public.medal_tallies;
drop policy if exists "read_medal_tallies" on public.medal_tallies;
create policy "admin_event_scoped_medal_tallies" on public.medal_tallies for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_medal_tallies" on public.medal_tallies for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

drop policy if exists "admin_all_certificates" on public.certificates;
drop policy if exists "read_certificates" on public.certificates;
create policy "admin_event_scoped_certificates" on public.certificates for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_certificates" on public.certificates for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

drop policy if exists "admin_all_sponsors" on public.sponsors;
drop policy if exists "read_sponsors" on public.sponsors;
create policy "admin_event_scoped_sponsors" on public.sponsors for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_sponsors" on public.sponsors for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

drop policy if exists "admin_all_event_docs" on public.event_docs;
drop policy if exists "read_event_docs" on public.event_docs;
create policy "admin_event_scoped_event_docs" on public.event_docs for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_scoped_event_docs" on public.event_docs for select
  to authenticated
  using (public.auth_role() <> 'admin_event' or public.can_access_event(event_id));

-- Heats and entries derive event ownership through schedule items / heats.
drop policy if exists "admin_all_heats" on public.heats;
drop policy if exists "read_heats" on public.heats;
create policy "admin_event_scoped_heats" on public.heats for all
  to authenticated
  using (
    exists (
        select 1
        from public.schedule_items s
        where s.id = schedule_item_id
        and public.can_manage_event(s.event_id)
    )
  )
  with check (
    exists (
      select 1
      from public.schedule_items s
      where s.id = schedule_item_id
        and public.can_manage_event(s.event_id)
    )
  );
create policy "read_scoped_heats" on public.heats for select
  to authenticated
  using (
    public.auth_role() <> 'admin_event'
    or exists (
      select 1
      from public.schedule_items s
      where s.id = schedule_item_id
        and public.can_access_event(s.event_id)
    )
  );

create policy "official_assigned_heats" on public.heats for all
  to authenticated
  using (
    public.auth_role() = 'official'
    and exists (
      select 1
      from public.schedule_items s
      where s.id = schedule_item_id
        and public.can_access_event(s.event_id)
    )
  )
  with check (
    public.auth_role() = 'official'
    and exists (
      select 1
      from public.schedule_items s
      where s.id = schedule_item_id
        and public.can_access_event(s.event_id)
    )
  );

drop policy if exists "admin_all_heat_entries" on public.heat_entries;
drop policy if exists "read_heat_entries" on public.heat_entries;
create policy "admin_event_scoped_heat_entries" on public.heat_entries for all
  to authenticated
  using (
    exists (
      select 1
      from public.heats h
      join public.schedule_items s on s.id = h.schedule_item_id
      where h.id = heat_id
        and public.can_manage_event(s.event_id)
    )
  )
  with check (
    exists (
      select 1
      from public.heats h
      join public.schedule_items s on s.id = h.schedule_item_id
      where h.id = heat_id
        and public.can_manage_event(s.event_id)
    )
  );
create policy "read_scoped_heat_entries" on public.heat_entries for select
  to authenticated
  using (
    public.auth_role() <> 'admin_event'
    or exists (
      select 1
      from public.heats h
      join public.schedule_items s on s.id = h.schedule_item_id
      where h.id = heat_id
        and public.can_access_event(s.event_id)
    )
  );

create policy "official_assigned_heat_entries" on public.heat_entries for all
  to authenticated
  using (
    public.auth_role() = 'official'
    and exists (
      select 1
      from public.heats h
      join public.schedule_items s on s.id = h.schedule_item_id
      where h.id = heat_id
        and public.can_access_event(s.event_id)
    )
  )
  with check (
    public.auth_role() = 'official'
    and exists (
      select 1
      from public.heats h
      join public.schedule_items s on s.id = h.schedule_item_id
      where h.id = heat_id
        and public.can_access_event(s.event_id)
    )
  );

-- Official assignments: super admin global, EO only for own events.
drop policy if exists "admin_all_event_officials" on public.event_officials;
drop policy if exists "read_event_officials" on public.event_officials;
create policy "super_admin_all_event_officials" on public.event_officials for all
  to authenticated
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');
create policy "admin_event_own_event_officials" on public.event_officials for all
  to authenticated
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));
create policy "read_assigned_event_officials" on public.event_officials for select
  to authenticated
  using (
    public.auth_role() <> 'admin_event'
    or public.can_access_event(event_id)
  );
