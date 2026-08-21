#!/usr/bin/env node
// Seed demo lengkap untuk SEMP.
// Reset total data event Pantura swimming lalu regenerate alur kompetisi penuh:
// registrasi -> heat -> hasil -> medali -> sertifikat -> sponsor -> invoice -> dokumentasi.
// Plus: registrasi Jakarta Open 2026 + satu event "finished" untuk hasil landing.
// Idempotent: aman dijalankan berulang.
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

const PANTURA = '436edd3e-10d8-4fec-92ed-c4f69418468f';
const JAKARTA = '6426803e-8ee4-493b-9cff-6a1efb25d242';
const ADMIN_ID = '326cdd01-67f9-4140-81fe-4cc110392fb3';

// Pantura schedule items (acara_number -> event_number)
const PANTURA_SCHEDULE = [
  { scheduleItemId: '39a4b525-fe1e-45f5-be7d-30dd7f529de2', eventNumberId: '0f9044da-0090-4fdf-a6d3-a2ebdd2708ae', name: '100 meter gaya bebas' },
  { scheduleItemId: 'd65a7c95-4b25-4ae8-ad54-d6aa9a9bf8ac', eventNumberId: '476c6ebb-6dd9-4305-a1b9-45ae4b4b77c1', name: '400 meter terbuka' },
  { scheduleItemId: '81ee6734-68d0-490c-8b57-4fa645792a5a', eventNumberId: '1c83b65d-640c-4b79-a1b5-cf38fe07fd7a', name: '50 meter gaya dada senior' },
];

function baseTime(name) {
  if (name.includes('100')) return 52 + Math.random() * 12;
  if (name.includes('400')) return 250 + Math.random() * 50;
  if (name.includes('50')) return 30 + Math.random() * 9;
  return 60;
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(2).padStart(5, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
}
function seedFromTime(txt) {
  if (!txt) return Infinity;
  const [m, s] = String(txt).split(':');
  return Number(m || 0) * 60 + Number(s || 0);
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function clearPantura() {
  const tables = ['heat_entries', 'heats', 'certificates', 'invoices', 'medal_tallies', 'sponsors', 'event_docs', 'registrations', 'event_officials'];
  for (const t of tables) {
    await admin.from(t).delete().eq('event_id', PANTURA);
  }
  const siIds = PANTURA_SCHEDULE.map((s) => s.scheduleItemId);
  const { data: heats } = await admin.from('heats').select('id').in('schedule_item_id', siIds);
  const heatIds = (heats ?? []).map((h) => h.id);
  if (heatIds.length > 0) await admin.from('heat_entries').delete().in('heat_id', heatIds);
  await admin.from('heats').delete().in('schedule_item_id', siIds);
}

// Generate registrasi + heat + hasil untuk satu event. Kembalikan medali (3 besar/nomor).
async function generateEventData(eventId, lanes, scheduleItems, athletes, clubNameById) {
  let cursor = 0;
  const summary = { registrations: 0, heats: 0, entries: 0, medals: [] };

  for (const item of scheduleItems) {
    const pool = athletes.slice(cursor, cursor + item.count);
    cursor += item.count;

    // 1. registrations dengan seed_time
    const regRows = pool.map((a) => ({
      event_id: eventId,
      club_id: a.club_id,
      athlete_id: a.id,
      event_number_id: item.eventNumberId,
      seed_time: fmtTime(baseTime(item.name)),
      status: 'finalized',
    }));
    const { data: regs } = await admin
      .from('registrations')
      .upsert(regRows, { onConflict: 'event_id,athlete_id,event_number_id', ignoreDuplicates: false })
      .select('id, athlete_id');
    summary.registrations += regs?.length ?? 0;

    // map athlete_id -> seed_time
    const seedByAthlete = new Map(regRows.map((r) => [r.athlete_id, r.seed_time]));

    // 2. heats + entries (collect in-memory untuk hasil)
    const totalHeats = Math.max(1, Math.ceil((regs ?? []).length / lanes));
    const entries = []; // { entryId, registrationId, athleteId, seedTime }
    for (let h = 0; h < totalHeats; h++) {
      const { data: heat } = await admin
        .from('heats')
        .insert({ schedule_item_id: item.scheduleItemId, heat_number: h + 1, status: 'dnt' })
        .select()
        .single();
      if (!heat) continue;
      summary.heats += 1;
      const laneRegs = (regs ?? []).slice(h * lanes, (h + 1) * lanes);
      const entryRows = laneRegs.map((r, idx) => ({
        heat_id: heat.id,
        registration_id: r.id,
        lane: idx + 1,
        seed_time: seedByAthlete.get(r.athlete_id) ?? null,
      }));
      if (entryRows.length > 0) {
        const { data: inserted } = await admin.from('heat_entries').insert(entryRows).select('id, registration_id');
        summary.entries += inserted?.length ?? 0;
        for (const e of inserted ?? []) {
          const reg = (regs ?? []).find((r) => r.id === e.registration_id);
          entries.push({
            entryId: e.id,
            registrationId: e.registration_id,
            athleteId: reg?.athlete_id,
            seedTime: seedByAthlete.get(reg?.athlete_id) ?? null,
          });
        }
      }
    }

    // 3. hasil: urutkan berdasar seed_time, isi result_time + place (1..n)
    const sorted = [...entries].sort((a, b) => seedFromTime(a.seedTime) - seedFromTime(b.seedTime));
    let place = 0;
    for (const e of sorted) {
      place += 1;
      const resultTime = fmtTime(baseTime(item.name) + place * 0.4 + Math.random() * 0.3);
      await admin.from('heat_entries').update({ result_time: resultTime, place, status: 'selesai' }).eq('id', e.entryId);
      if (place <= 3) {
        const ath = athletes.find((a) => a.id === e.athleteId);
        summary.medals.push({
          place,
          number: item.name,
          eventNumberId: item.eventNumberId,
          athleteId: e.athleteId,
          athleteName: ath?.name ?? '-',
          clubId: ath?.club_id ?? null,
          clubName: clubNameById.get(ath?.club_id) ?? '-',
        });
      }
    }
  }

  return summary;
}

async function seedCertificates(eventId, medals) {
  for (const m of medals) {
    const title = `${m.place === 1 ? 'Juara 1' : m.place === 2 ? 'Juara 2' : 'Juara 3'} ${m.number}`;
    const qr = `CERT-${eventId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
    const { data: reg } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('athlete_id', m.athleteId)
      .eq('event_number_id', m.eventNumberId)
      .maybeSingle();
    await admin.from('certificates').insert({
      event_id: eventId,
      athlete_id: m.athleteId,
      registration_id: reg?.id ?? null,
      cert_type: 'juara',
      title,
      place: m.place,
      qr_token: qr,
    });
  }
  return medals.length;
}

async function seedSponsors(eventId) {
  const sponsors = [
    { name: 'Arena Indonesia', position: 1 },
    { name: 'Speedo', position: 2 },
    { name: 'Mizuno', position: 3 },
    { name: 'Aqua Pure Mineral', position: 4 },
    { name: 'Bank Nusantara', position: 5 },
  ];
  await admin.from('sponsors').insert(sponsors.map((s) => ({ event_id: eventId, ...s })));
  return sponsors.length;
}

async function seedInvoices(eventId, clubIds, entryFee) {
  const rows = [];
  const statuses = ['paid', 'paid', 'awaiting_payment', 'awaiting_payment'];
  clubIds.forEach((clubId, i) => {
    const status = statuses[i % statuses.length];
    rows.push({
      event_id: eventId,
      club_id: clubId,
      invoice_number: `INV-${eventId.slice(0, 8)}-${Date.now()}-${i}`,
      total: entryFee * (3 + i),
      status,
      paid_at: status === 'paid' ? new Date(Date.now() - (i + 1) * 86400000).toISOString() : null,
    });
  });
  await admin.from('invoices').insert(rows);
  return rows.length;
}

async function seedDocs(eventId) {
  const docs = [
    { media_type: 'foto', url: 'https://picsum.photos/seed/pantura1/800/600', caption: 'Pembukaan kejuaraan', file_name: 'pembukaan.jpg' },
    { media_type: 'foto', url: 'https://picsum.photos/seed/pantura2/800/600', caption: 'Final 100m gaya bebas', file_name: 'final-100m.jpg' },
    { media_type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', caption: 'Highlight perlombaan', file_name: 'highlight.mp4' },
    { media_type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', caption: 'Buku acara resmi', file_name: 'buku-acara.pdf' },
  ];
  await admin.from('event_docs').insert(docs.map((d) => ({ event_id: eventId, ...d })));
  return docs.length;
}

async function main() {
  console.log('=== Seed Demo SEMP ===\n');

  // ---- 1. Reset Pantura ----
  console.log('[1/6] Reset data Pantura swimming...');
  await clearPantura();

  // ---- 2. Ambil atlet & club ----
  const { data: athletes } = await admin.from('athletes').select('id, club_id, name').not('club_id', 'is', null);
  const { data: clubs } = await admin.from('clubs').select('id, name');
  if (!athletes?.length) throw new Error('Tidak ada atlet. Jalankan seed-users.mjs dulu.');
  const clubNameById = new Map((clubs ?? []).map((c) => [c.id, c.name]));
  console.log(`      ${athletes.length} atlet, ${clubs?.length ?? 0} club tersedia.`);

  // ---- 3. Generate Pantura (running) ----
  console.log('[2/6] Generate Pantura (running): registrasi -> heat -> hasil -> medali...');
  const { data: panturaEvent } = await admin.from('events').select('lanes_count, entry_fee').eq('id', PANTURA).single();
  const lanes = panturaEvent?.lanes_count ?? 6;
  const panturaSchedule = [
    { ...PANTURA_SCHEDULE[0], count: 50 },
    { ...PANTURA_SCHEDULE[1], count: 12 },
    { ...PANTURA_SCHEDULE[2], count: 12 },
  ];
  const panturaAthletes = shuffle(athletes).slice(0, 74);
  const panturaResult = await generateEventData(PANTURA, lanes, panturaSchedule, panturaAthletes, clubNameById);
  const certCount = await seedCertificates(PANTURA, panturaResult.medals);
  const sponsorCount = await seedSponsors(PANTURA);
  const invoiceCount = await seedInvoices(PANTURA, (clubs ?? []).map((c) => c.id), panturaEvent?.entry_fee || 50000);
  const docCount = await seedDocs(PANTURA);
  console.log(`      registrasi=${panturaResult.registrations}, heat=${panturaResult.heats}, entry=${panturaResult.entries}`);
  console.log(`      medali=${panturaResult.medals.length}, sertifikat=${certCount}, sponsor=${sponsorCount}, invoice=${invoiceCount}, dokumen=${docCount}`);

  // ---- 4. Jakarta Open (registration_open) ----
  console.log('[3/6] Registrasi Jakarta Open 2026...');
  const { data: jakartaNumbers } = await admin.from('event_numbers').select('id').eq('event_id', JAKARTA);
  const jakartaAthletes = shuffle(athletes).slice(0, 30);
  let jakartaReg = 0;
  for (const [i, num] of (jakartaNumbers ?? []).entries()) {
    const slice = jakartaAthletes.slice(i * 10, (i + 1) * 10);
    const rows = slice.map((a) => ({
      event_id: JAKARTA,
      club_id: a.club_id,
      athlete_id: a.id,
      event_number_id: num.id,
      status: 'finalized',
    }));
    const { data: r } = await admin
      .from('registrations')
      .upsert(rows, { onConflict: 'event_id,athlete_id,event_number_id', ignoreDuplicates: false })
      .select('id');
    jakartaReg += r?.length ?? 0;
  }
  console.log(`      ${jakartaReg} registrasi Jakarta Open.`);

  // ---- 5. Event finished (untuk landing "Hasil") ----
  console.log('[4/6] Buat event finished "Kejuaraan Renang Bandung Raya 2025"...');
  const { data: existingFinished } = await admin
    .from('events')
    .select('id')
    .eq('name', 'Kejuaraan Renang Bandung Raya 2025')
    .maybeSingle();
  let finishedId = existingFinished?.id;
  if (!finishedId) {
    const { data: newEvent } = await admin
      .from('events')
      .insert({
        name: 'Kejuaraan Renang Bandung Raya 2025',
        description: 'Kejuaraan renang tingkat daerah Jawa Barat.',
        location: 'Kolam Renang KONI Bandung',
        organizer: 'PRSI Jabar',
        start_date: '2025-11-10',
        end_date: '2025-11-12',
        lanes_count: 8,
        status: 'finished',
        created_by: ADMIN_ID,
        entry_fee: 75000,
      })
      .select()
      .single();
    finishedId = newEvent.id;
  }
  const finishedNumbers = [
    { name: '100m Gaya Bebas Putra', gender: 'putra', distance_id: '7c2fc740-7f29-49ec-8c76-4eb8dee0184c', style_id: 'ec668319-38a4-4199-92c2-eeb4ef5f72f6', fee: 75000 },
    { name: '50m Gaya Dada Putri', gender: 'putri', distance_id: 'a7d8bff7-1566-4a93-9035-5352dba1c42c', style_id: 'de173d6c-b635-451a-a4b5-b588b5a1b3d0', fee: 75000 },
  ];
  const finishedSchedule = [];
  for (const [i, num] of finishedNumbers.entries()) {
    const { data: numRow } = await admin
      .from('event_numbers')
      .upsert({ event_id: finishedId, ...num }, { onConflict: 'event_id,name' })
      .select()
      .single();
    const { data: si } = await admin
      .from('schedule_items')
      .upsert({ event_id: finishedId, event_number_id: numRow.id, acara_number: i + 1 }, { onConflict: 'event_id,acara_number' })
      .select()
      .single();
    finishedSchedule.push({ scheduleItemId: si.id, eventNumberId: numRow.id, name: num.name, count: 10 });
  }
  const finishedAthletes = shuffle(athletes).slice(0, 20);
  const finishedResult = await generateEventData(finishedId, 8, finishedSchedule, finishedAthletes, clubNameById);
  await seedCertificates(finishedId, finishedResult.medals);
  await seedSponsors(finishedId);
  await seedInvoices(finishedId, (clubs ?? []).map((c) => c.id).slice(0, 4), 75000);
  console.log(`      ${finishedResult.registrations} registrasi, ${finishedResult.medals.length} medali, event id=${finishedId}`);

  // ---- 6. ringkasan ----
  console.log('\n[5/6] Ringkasan akhir:');
  const counts = {};
  for (const t of ['events', 'registrations', 'heats', 'heat_entries', 'certificates', 'invoices', 'sponsors', 'event_docs', 'medal_tallies']) {
    const { count } = await admin.from(t).select('id', { count: 'exact', head: true });
    counts[t] = count ?? 0;
  }
  console.log(' ', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', '));
  console.log('\nSelesai.');
}

main().catch((err) => {
  console.error('SEED GAGAL:', err);
  process.exit(1);
});
