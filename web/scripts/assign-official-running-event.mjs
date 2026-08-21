#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const officialEmail = 'panitia01@renang.com';
const participantEmail = 'peserta001@renang.com';

const { data: users, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (usersError) throw usersError;
const officialUser = users.users.find((user) => user.email === officialEmail);
const participantUser = users.users.find((user) => user.email === participantEmail);
if (!officialUser) throw new Error(`User tidak ditemukan: ${officialEmail}`);
if (!participantUser) throw new Error(`User tidak ditemukan: ${participantEmail}`);

const { data: officialProfile } = await admin.from('profiles').select('id, role').eq('id', officialUser.id).single();
const { data: participantProfile } = await admin.from('profiles').select('athlete_id, club_id').eq('id', participantUser.id).single();
if (officialProfile?.role !== 'official') throw new Error(`${officialEmail} bukan role official`);
if (!participantProfile?.athlete_id) throw new Error(`${participantEmail} belum terhubung ke athlete`);

let { data: event, error: eventError } = await admin
  .from('events')
  .select('id, name, status, lanes_count')
  .in('status', ['running', 'registration_open', 'published'])
  .order('start_date', { ascending: true })
  .limit(1)
  .maybeSingle();
if (eventError) throw eventError;
if (!event) throw new Error('Tidak ada event aktif untuk dijadikan running');
if (event.status !== 'running') {
  const { data: updatedEvent, error: updateEventError } = await admin
    .from('events')
    .update({ status: 'running' })
    .eq('id', event.id)
    .select('id, name, status, lanes_count')
    .single();
  if (updateEventError) throw updateEventError;
  event = updatedEvent;
}

const { data: eventNumber, error: numberError } = await admin
  .from('event_numbers')
  .select('id, name, fee')
  .eq('event_id', event.id)
  .order('name')
  .limit(1)
  .maybeSingle();
if (numberError) throw numberError;
if (!eventNumber) throw new Error(`Event ${event.name} belum punya nomor lomba`);

const { error: assignmentError } = await admin
  .from('event_officials')
  .upsert({ event_id: event.id, user_id: officialUser.id }, { onConflict: 'event_id,user_id' });
if (assignmentError) throw assignmentError;

const { data: existingRegistration } = await admin
  .from('registrations')
  .select('id')
  .eq('event_id', event.id)
  .eq('athlete_id', participantProfile.athlete_id)
  .eq('event_number_id', eventNumber.id)
  .maybeSingle();

let registrationId = existingRegistration?.id;
if (!registrationId) {
  const { data: registration, error: registrationError } = await admin
    .from('registrations')
    .insert({
      event_id: event.id,
      club_id: participantProfile.club_id,
      athlete_id: participantProfile.athlete_id,
      event_number_id: eventNumber.id,
      status: 'finalized',
      seed_time: null,
    })
    .select('id')
    .single();
  if (registrationError) throw registrationError;
  registrationId = registration.id;
} else {
  const { error: updateError } = await admin.from('registrations').update({ status: 'finalized' }).eq('id', registrationId);
  if (updateError) throw updateError;
}

const { data: scheduleItem } = await admin
  .from('schedule_items')
  .select('id')
  .eq('event_id', event.id)
  .eq('event_number_id', eventNumber.id)
  .maybeSingle();

let scheduleItemId = scheduleItem?.id;
if (!scheduleItemId) {
  const { data: createdSchedule, error: scheduleError } = await admin
    .from('schedule_items')
    .insert({ event_id: event.id, event_number_id: eventNumber.id, acara_number: 1 })
    .select('id')
    .single();
  if (scheduleError) throw scheduleError;
  scheduleItemId = createdSchedule.id;
}

const { data: heat } = await admin
  .from('heats')
  .select('id')
  .eq('schedule_item_id', scheduleItemId)
  .order('heat_number')
  .limit(1)
  .maybeSingle();

let heatId = heat?.id;
if (!heatId) {
  const { data: createdHeat, error: heatError } = await admin
    .from('heats')
    .insert({ schedule_item_id: scheduleItemId, heat_number: 1, status: 'dns' })
    .select('id')
    .single();
  if (heatError) throw heatError;
  heatId = createdHeat.id;
}

const { data: existingEntry } = await admin
  .from('heat_entries')
  .select('id')
  .eq('heat_id', heatId)
  .eq('registration_id', registrationId)
  .maybeSingle();
if (!existingEntry) {
  const { error: entryError } = await admin.from('heat_entries').insert({
    heat_id: heatId,
    registration_id: registrationId,
    lane: 1,
    status: 'registered',
  });
  if (entryError) throw entryError;
}

console.log(JSON.stringify({
  official: officialEmail,
  participant: participantEmail,
  event: { id: event.id, name: event.name, status: event.status },
  number: { id: eventNumber.id, name: eventNumber.name },
  registrationId,
  heatId,
}, null, 2));
