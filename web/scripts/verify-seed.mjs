#!/usr/bin/env node
// Verifikasi hasil seed + RBAC di project SEMP (pakai service-role key).
// Run: node scripts/verify-seed.mjs

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

const { data: profiles, error: pErr } = await admin.from('profiles').select('role, club_id, athlete_id');
if (pErr) throw new Error('profiles: ' + pErr.message);

const byRole = {};
for (const p of profiles ?? []) byRole[p.role] = (byRole[p.role] ?? 0) + 1;
const coachWithClub = (profiles ?? []).filter((p) => p.role === 'club_coach' && p.club_id).length;

const { count: athletes } = await admin.from('athletes').select('id', { count: 'exact', head: true });
const { count: officials } = await admin.from('event_officials').select('id', { count: 'exact', head: true });

// auth.users app_metadata role (RLS source of truth)
const rolesFromAuth = {};
for (let page = 1; page <= 20; page++) {
  const { data: users, error: uErr } = await admin.auth.admin.listUsers({ page, perPage: 500 });
  if (uErr) { console.error('listUsers: ' + uErr.message); break; }
  if (!users?.users?.length) break;
  for (const u of users.users) {
    const r = u.app_metadata?.role ?? 'anon';
    rolesFromAuth[r] = (rolesFromAuth[r] ?? 0) + 1;
  }
  if (users.users.length < 500) break;
}

console.log('profiles.role      :', JSON.stringify(byRole));
console.log('auth.app_metadata  :', JSON.stringify(rolesFromAuth));
console.log('coach dgn club     :', coachWithClub);
console.log('athletes           :', athletes);
console.log('event_officials    :', officials);
