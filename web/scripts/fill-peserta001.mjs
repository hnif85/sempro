#!/usr/bin/env node
// Isi data lengkap + ganti nama peserta001 (disimpan di profiles).
// Prasyarat: migrasi 014_profile_contact_fields sudah dijalankan di SQL Editor.
// Run: node scripts/fill-peserta001.mjs
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

const USER_ID = '401bd10f-affe-4467-930e-f34e1b92897a';
const ATHLETE_ID = '39318195-332f-4c78-a889-4f59b871f4f2';
const NEW_NAME = 'Salsabila Rahma Putri';

const data = {
  full_name: NEW_NAME,
  birth_date: '2010-05-14',
  gender: 'putri',
  phone: '0812-3456-7890',
  address: 'Jl. Kolam Renang No. 10, Kel. Cilandak Timur',
  city: 'Jakarta Selatan',
  province: 'DKI Jakarta',
  postal_code: '12560',
};

const { error: pErr } = await admin.from('profiles').update(data).eq('id', USER_ID);
if (pErr) {
  console.error('Gagal update profiles:', pErr.message);
  if (/column/i.test(pErr.message)) {
    console.error('→ Jalankan migrasi 014_profile_contact_fields dulu di SQL Editor Supabase.');
  }
  process.exit(1);
}
console.log('✅ profiles diupdate');

const { error: aErr } = await admin.from('athletes').update({ name: NEW_NAME }).eq('id', ATHLETE_ID);
if (aErr) { console.error('Gagal sync athletes.name:', aErr.message); process.exit(1); }
console.log('✅ athletes.name disinkronkan');

const { error: mErr } = await admin.auth.admin.updateUserById(USER_ID, {
  user_metadata: { full_name: NEW_NAME },
});
if (mErr) { console.error('Gagal update user_metadata:', mErr.message); process.exit(1); }
console.log('✅ user_metadata diupdate');

console.log('\nData peserta001 sekarang (di profiles):');
console.log(JSON.stringify({ ...data, email: 'peserta001@renang.com', club: 'Aqua Prima' }, null, 2));