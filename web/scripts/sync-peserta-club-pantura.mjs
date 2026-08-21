#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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

const { data: club, error: clubError } = await admin.from('clubs').select('id, name').eq('name', 'Aqua Prima').single();
if (clubError) throw clubError;

const { data: event, error: eventError } = await admin.from('events').select('id').eq('name', 'Pantura swimming').single();
if (eventError) throw eventError;

const { data: registrations, error: registrationsError } = await admin
  .from('registrations')
  .select('athlete_id, club_id')
  .eq('event_id', event.id)
  .order('created_at')
  .limit(50);
if (registrationsError) throw registrationsError;

const athleteIds = [...new Set((registrations ?? []).map((registration) => registration.athlete_id))];
const { data: athletes, error: athletesError } = await admin.from('athletes').select('id, club_id').in('id', athleteIds);
if (athletesError) throw athletesError;

const athleteById = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
let synced = 0;
for (const registration of registrations ?? []) {
  const athlete = athleteById.get(registration.athlete_id);
  const clubId = registration.club_id ?? athlete?.club_id ?? club.id;
  if (!athlete || athlete.club_id === clubId) continue;

  const { error: athleteUpdateError } = await admin.from('athletes').update({ club_id: clubId }).eq('id', athlete.id);
  if (athleteUpdateError) throw athleteUpdateError;

  const { error: profileUpdateError } = await admin.from('profiles').update({ club_id: clubId }).eq('athlete_id', athlete.id);
  if (profileUpdateError) throw profileUpdateError;
  synced += 1;
}

const { count, error: countError } = await admin.from('athletes').select('*', { count: 'exact', head: true }).eq('club_id', club.id);
if (countError) throw countError;
const { data: distribution, error: distributionError } = await admin
  .from('registrations')
  .select('club_id, clubs(name)')
  .eq('event_id', event.id)
  .limit(50);
if (distributionError) throw distributionError;
const groups = new Map();
for (const row of distribution ?? []) {
  const relation = Array.isArray(row.clubs) ? row.clubs[0] : row.clubs;
  const name = relation?.name ?? 'Tanpa club';
  groups.set(name, (groups.get(name) ?? 0) + 1);
}
console.log(JSON.stringify({ event: 'Pantura swimming', club: club.name, synced, clubAthleteCount: count, registrationDistribution: Object.fromEntries(groups) }, null, 2));
