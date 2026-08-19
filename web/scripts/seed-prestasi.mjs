#!/usr/bin/env node
// Isi hasil/prestasi dummy untuk peserta001.
// Run: node scripts/seed-prestasi.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ATHLETE_ID = '39318195-332f-4c78-a889-4f59b871f4f2';

const { data: athleteRow } = await admin.from('athletes').select('club_id').eq('id', ATHLETE_ID).single();
const CLUB_ID = athleteRow?.club_id ?? null;
if (!CLUB_ID) throw new Error('Atlet peserta001 tidak punya club_id');

// event number id -> (event id, name)
const NUMBERS = {
  '0f9044da-0090-4fdf-a6d3-a2ebdd2708ae': { event: '436edd3e-10d8-4fec-92ed-c4f69418468f', name: '100 meter gaya bebas' },
  '1c83b65d-640c-4b79-a1b5-cf38fe07fd7a': { event: '436edd3e-10d8-4fec-92ed-c4f69418468f', name: '50 meter gaya dada senior' },
  '476c6ebb-6dd9-4305-a1b9-45ae4b4b77c1': { event: '436edd3e-10d8-4fec-92ed-c4f69418468f', name: '400 meter terbuka' },
  'dec257c2-3a46-42e8-9bff-2cd14a11e0a0': { event: '6426803e-8ee4-493b-9cff-6a1efb25d242', name: '100m Gaya Dada Putri KU 11-12' },
  '9b1f30c7-0a03-4b06-b69f-19300d7de389': { event: '6426803e-8ee4-493b-9cff-6a1efb25d242', name: '50m Gaya Bebas Putra KU 8-10' },
};

// hasil dummy (number_id, place, time)
const RESULTS = [
  { numberId: '0f9044da-0090-4fdf-a6d3-a2ebdd2708ae', place: 1, time: '01:02.45' },
  { numberId: '1c83b65d-640c-4b79-a1b5-cf38fe07fd7a', place: 2, time: '00:37.12' },
  { numberId: 'dec257c2-3a46-42e8-9bff-2cd14a11e0a0', place: 1, time: '01:28.54' },
  { numberId: '476c6ebb-6dd9-4305-a1b9-45ae4b4b77c1', place: 3, time: '05:12.30' },
  { numberId: '9b1f30c7-0a03-4b06-b69f-19300d7de389', place: 2, time: '00:33.80' },
];

async function ensureRegistration(eventId, numberId) {
  const { data } = await admin.from('registrations').select('id').eq('athlete_id', ATHLETE_ID).eq('event_number_id', numberId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await admin.from('registrations').insert({ event_id: eventId, athlete_id: ATHLETE_ID, event_number_id: numberId, club_id: CLUB_ID, status: 'finalized' }).select('id').single();
  if (error) throw new Error('registration: ' + error.message);
  return created.id;
}

async function ensureScheduleItem(eventId, numberId) {
  const { data } = await admin.from('schedule_items').select('id').eq('event_id', eventId).eq('event_number_id', numberId).maybeSingle();
  if (data) return data.id;
  const { data: maxAcara } = await admin.from('schedule_items').select('acara_number').eq('event_id', eventId).order('acara_number', { ascending: false }).limit(1);
  const nextAcara = ((maxAcara?.[0]?.acara_number ?? 0)) + 1;
  const { data: created, error } = await admin.from('schedule_items').insert({ event_id: eventId, event_number_id: numberId, acara_number: nextAcara }).select('id').single();
  if (error) throw new Error('schedule_item: ' + error.message);
  return created.id;
}

async function ensureHeat(scheduleItemId) {
  const { data } = await admin.from('heats').select('id').eq('schedule_item_id', scheduleItemId).eq('heat_number', 1).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await admin.from('heats').insert({ schedule_item_id: scheduleItemId, heat_number: 1, status: 'dnt' }).select('id').single();
  if (error) throw new Error('heat: ' + error.message);
  return created.id;
}

async function ensureHeatEntry(heatId, registrationId, lane, time, place) {
  const { data } = await admin.from('heat_entries').select('id').eq('heat_id', heatId).eq('registration_id', registrationId).maybeSingle();
  if (data) {
    await admin.from('heat_entries').update({ result_time: time, place }).eq('id', data.id);
    return;
  }
  const { error } = await admin.from('heat_entries').insert({ heat_id: heatId, registration_id: registrationId, lane, result_time: time, place, status: 'selesai' });
  if (error) throw new Error('heat_entry: ' + error.message);
}

let lane = 1;
for (const r of RESULTS) {
  const meta = NUMBERS[r.numberId];
  const registrationId = await ensureRegistration(meta.event, r.numberId);
  const scheduleItemId = await ensureScheduleItem(meta.event, r.numberId);
  const heatId = await ensureHeat(scheduleItemId);
  await ensureHeatEntry(heatId, registrationId, lane, r.time, r.place);
  console.log(`✅ ${meta.name} — Juara ${r.place} (${r.time})`);
  lane++;
}

console.log('\nSelesai. Prestasi dummy untuk peserta001 sudah dibuat (5 hasil).');
