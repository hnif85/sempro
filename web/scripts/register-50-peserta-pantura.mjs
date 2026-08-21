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

const { data: event, error: eventError } = await admin
  .from('events')
  .select('id, name')
  .eq('name', 'Pantura swimming')
  .single();
if (eventError) throw eventError;

const { data: eventNumber, error: numberError } = await admin
  .from('event_numbers')
  .select('id, name')
  .eq('event_id', event.id)
  .order('name')
  .limit(1)
  .single();
if (numberError) throw numberError;

const { data: fallbackClub, error: clubError } = await admin
  .from('clubs')
  .select('id, name')
  .eq('name', 'Aqua Prima')
  .single();
if (clubError) throw clubError;

const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (usersError) throw usersError;

const targets = authUsers.users
  .filter((user) => /^peserta\d{3}@renang\.com$/.test(user.email ?? ''))
  .sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''))
  .slice(0, 50);
if (targets.length < 50) throw new Error(`Akun peserta hanya ditemukan ${targets.length}, butuh 50.`);

const targetIds = targets.map((user) => user.id);
const { data: profiles, error: profilesError } = await admin
  .from('profiles')
  .select('id, athlete_id, club_id')
  .in('id', targetIds);
if (profilesError) throw profilesError;

const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
const rows = targets.map((user) => {
  const profile = profileById.get(user.id);
  if (!profile?.athlete_id) throw new Error(`${user.email} belum punya athlete_id.`);
  return {
    event_id: event.id,
    club_id: profile.club_id ?? fallbackClub.id,
    athlete_id: profile.athlete_id,
    event_number_id: eventNumber.id,
    status: 'finalized',
  };
});

const { data: registrations, error: registrationError } = await admin
  .from('registrations')
  .upsert(rows, { onConflict: 'event_id,athlete_id,event_number_id', ignoreDuplicates: false })
  .select('id, athlete_id');
if (registrationError) throw registrationError;

console.log(JSON.stringify({
  event: event,
  number: eventNumber,
  requested: rows.length,
  upserted: registrations?.length ?? 0,
  accounts: targets.map((user) => user.email),
}, null, 2));
