#!/usr/bin/env node
// =============================================
// SEMP — Seed users untuk SEMUA role
// =============================================
// Cara pakai (dari folder web/):
//   node scripts/seed-users.mjs [jumlahEO] [jumlahOfficial] [jumlahCoach] [jumlahPeserta]
//
// Default: 3 EO, 5 official, 20 coach, 100 peserta
// Password semua akun: "password123" (ubah lewat SEED_PASSWORD di .env.local)
//
// CATATAN:
//   - Role "club_coach" hanya ada jika migrasi 013_role_club_coach sudah dijalankan.
//   - Script aman dijalankan ulang: email yang sudah ada dilewati (skip).
// =============================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- load .env.local ----------
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Butuh NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- config ----------
const argv = process.argv.slice(2);
const COUNT = {
  eo: Number(argv[0] ?? 3),
  official: Number(argv[1] ?? 5),
  coach: Number(argv[2] ?? 20),
  peserta: Number(argv[3] ?? 100),
};
const PASSWORD = process.env.SEED_PASSWORD ?? 'password123';
const pad = (n, w) => String(n).padStart(w, '0');

// ---------- helpers ----------
async function createAuthUser(email, role, fullName) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  });
  if (error) {
    if (/already|registered|exists|duplicate/i.test(error.message)) return null; // skip
    throw new Error(`createUser ${email}: ${error.message}`);
  }
  return data.user.id;
}

async function insertProfile(id, { fullName, role, clubId = null, athleteId = null }) {
  const { error } = await admin
    .from('profiles')
    .insert({ id, full_name: fullName, role, club_id: clubId, athlete_id: athleteId });
  if (error) throw new Error(`profile ${fullName}: ${error.message}`);
}

function pick(arr, i) {
  return arr.length ? arr[i % arr.length].id : null;
}

// ---------- data referensi ----------
const { data: clubs } = await admin.from('clubs').select('id, name').order('name');
const { data: events } = await admin.from('events').select('id, name').order('start_date').limit(1);

if (!clubs?.length) {
  console.warn('⚠️  Tidak ada club. Coach & sebagian peserta akan dibuat TANPA club.');
}
if (!events?.length) {
  console.warn('⚠️  Tidak ada event. Official tidak akan ditugaskan ke event mana pun.');
}

const summary = [];
let created = 0;
let skipped = 0;

// ---------- 1) EO (admin_event) ----------
console.log(`\n— Membuat ${COUNT.eo} EO (admin_event)…`);
for (let i = 1; i <= COUNT.eo; i++) {
  const n = pad(i, 2);
  const email = `eo${n}@renang.com`;
  const name = `EO ${n}`;
  const uid = await createAuthUser(email, 'admin_event', name);
  if (!uid) { skipped++; continue; }
  await insertProfile(uid, { fullName: name, role: 'admin_event' });
  summary.push({ role: 'EO (admin_event)', email, name });
  created++;
}

// ---------- 2) Official / Panitia ----------
console.log(`— Membuat ${COUNT.official} Panitia (official)…`);
for (let i = 1; i <= COUNT.official; i++) {
  const n = pad(i, 2);
  const email = `panitia${n}@renang.com`;
  const name = `Panitia ${n}`;
  const uid = await createAuthUser(email, 'official', name);
  if (!uid) { skipped++; continue; }
  await insertProfile(uid, { fullName: name, role: 'official' });
  if (events?.length) {
    await admin.from('event_officials').insert({ event_id: events[0].id, user_id: uid });
  }
  summary.push({ role: 'Panitia (official)', email, name });
  created++;
}

// ---------- 3) Coach (club_coach) ----------
console.log(`— Membuat ${COUNT.coach} Coach (club_coach)…`);
for (let i = 1; i <= COUNT.coach; i++) {
  const n = pad(i, 2);
  const email = `coach${n}@renang.com`;
  const name = `Coach ${n}`;
  const uid = await createAuthUser(email, 'club_coach', name);
  if (!uid) { skipped++; continue; }
  await insertProfile(uid, { fullName: name, role: 'club_coach', clubId: pick(clubs, i - 1) });
  summary.push({ role: 'Coach (club_coach)', email, name });
  created++;
}

// ---------- 4) Peserta ----------
console.log(`— Membuat ${COUNT.peserta} Peserta (peserta)…`);
const genders = ['putra', 'putri'];
for (let i = 1; i <= COUNT.peserta; i++) {
  const n = pad(i, 3);
  const email = `peserta${n}@renang.com`;
  const name = `Peserta ${n}`;
  const gender = genders[i % 2];
  // ~30% peserta individu (tanpa club), sisanya tersebar ke club
  const clubId = i % 3 === 0 ? null : pick(clubs, i - 1);
  const birthYear = 2008 + (i % 9); // 2008..2016
  const birthDate = `${birthYear}-${pad((i % 12) + 1, 2)}-${pad((i % 27) + 1, 2)}`;

  const uid = await createAuthUser(email, 'peserta', name);
  if (!uid) { skipped++; continue; }

  const { data: athlete, error: aErr } = await admin
    .from('athletes')
    .insert({ club_id: clubId, name, gender, birth_date: birthDate })
    .select('id')
    .single();
  if (aErr || !athlete) throw new Error(`athlete ${name}: ${aErr?.message}`);

  await insertProfile(uid, { fullName: name, role: 'peserta', clubId, athleteId: athlete.id });
  summary.push({ role: 'Peserta', email, name });
  created++;
}

// ---------- ringkasan ----------
console.log('\n==========================================');
console.log(`✅ Selesai: ${created} dibuat, ${skipped} dilewati (email sudah ada)`);
console.log(`🔑 Password semua akun: "${PASSWORD}"`);
console.log('==========================================');

const groups = {};
for (const s of summary) {
  (groups[s.role] ??= []).push(s.email);
}
for (const [role, emails] of Object.entries(groups)) {
  console.log(`\n${role} (${emails.length}):`);
  console.log('  ' + emails.join(', '));
}
console.log('\nContoh login:');
for (const s of summary.slice(0, 4)) {
  console.log(`  ${s.email} / ${PASSWORD}  (${s.role})`);
}
