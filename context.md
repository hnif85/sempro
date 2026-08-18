# context.md — Aplikasi renang (SEMP)

> Ringkasan progres, keputusan, dan arahan dari sesi. Terakhir diupdate: 17 Agustus 2026.

## Status

- **DB**: Supabase cloud `ubexozykvrqcjqkcztar.supabase.co`. DB di-build **manual oleh user** di SQL Editor — agent tidak menjalankan migrasi; user yang menjalankan.
- **Framework**: Next.js 16 (Turbopack, middleware→proxy warning non-blocking), Supabase SSR.
- **Verifikasi kode**: `npx tsc --noEmit`, `npx eslint <file> --no-cache`, `npx next build` — selalu dipastikan pass.
- **PENTING — Visual**: user memeriksa visual sendiri. **Jangan** cek visual pakai browser/screenshot tanpa diminta. Browser-harness terkendala izin remote debugging Chrome.

## Keputusan penting

- Auth = **Supabase Auth** (batal pakai table auth — "balik lagi ke awal").
- RBAC 5 role: `super_admin`, `admin_event`, `club_manager`, `official` (per-event), `peserta`.
  - super_admin → semua + kelola pengguna
  - admin_event → semua kecuali kelola pengguna
  - club_manager → scoped club sendiri + daftarkan atlet club-nya
  - official → hanya event yang ditugaskan (tabel `event_officials`)
  - peserta → daftar event + lihat personal record & history
- Semua kebutuhan **data geografis** memakai **RajaOngkir Komerce API** (key `RAJAONGKIR_API_KEY` di env, proxy server-side `/api/locations`). Data tersimpan terstruktur di kolom club.
- Landing page: event di landing masih **data dummy statis** (belum dari DB) — user sudah tahu.
- Pendaftaran club/peserta: publik + dari dashboard, otomatis buat akun (club→club_manager, peserta→peserta).

## Konfigurasi penting

- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (dari user), `RAJAONGKIR_API_KEY` (dari user).
- Admin client service role di `src/lib/supabase/admin.ts` (`createAdminClient`) — dipakai untuk `auth.admin.*` & insert publik (bypass RLS).
- Middleware route publik: `/`, `/login`, `/daftar`, `/client`, `/verify`, + path mengandung `.` (static asset).
- Supabase CLI tidak di PATH: `& "C:\Users\MWI\AppData\Roaming\npm\supabase.cmd"`.
- PowerShell butuh `-LiteralPath` untuk folder `[id]`.
- Tidak ada `database.types.ts` — relasi nested di-infer array; pakai cast `as unknown as`.

## Migrasi (urut dijalankan user di SQL Editor)

1. `20260816130456_001_base_schema.sql` ✅ (sudah dijalankan)
2. `20260816132924_002_seed_demo.sql` ✅ (sudah dijalankan)
3. `20260817120000_003_rbac_roles.sql` — RBAC 5 role (perlu dipastikan sudah jalan)
4. `20260817130000_004_public_registration.sql` — `athletes.club_id` nullable + policy anon
5. `20260817140000_005_club_geo.sql` — kolom geografis club

> Akun superadmin: `admin@renang.com` (satu-satunya). Saat itu `profiles` masih kosong & role belum di-set — sudah disarankan SQL update `raw_app_meta_data` + insert `profiles`. Perlu diverifikasi user.

## Fitur yang sudah dibangun

- Landing page `/` (hero, statistik, event dummy, cara kerja, fitur, hasil, verifikasi sertifikat, sponsor, CTA daftar).
- Dashboard KPI sesuai PRD section 7 (Event/Peserta/Perlombaan/Hasil/Keuangan), role-aware.
- Route group `(app)` — sidebar konsisten di semua halaman.
- RBAC 5 role: layout nav per role, users page super_admin only, events official filter, official management per event, peserta portal `/peserta`.
- Portal client `/client` (token), `/client/login`, `/client/register`.
- Pendaftaran publik `/daftar` (tab club & peserta, buat akun otomatis).
- Data geografis: `/api/locations` proxy + komponen `LocationPicker` di form club (daftar, new, edit).

## Isu / catatan teknis

- Dev server dijalankan via `Start-Process npm.cmd run dev` (hidden). Kadang `.next/dev/types/validator.ts` terkunci (EBUSY) saat ada dev server lama — matikan proses node & hapus file itu.
- Next.js 16 warning middleware deprecated → proxy (opsional `npx @next/codemod@canary middleware-to-proxy .`).
- Turbopack warning multiple lockfiles (workspace root inference) non-blocking.

## Selanjutnya (belum dikerjakan / bisa dilanjut)

- Verifikasi visual oleh user untuk landing, daftar, dan form.
- Sambungkan event di landing page ke data asli `events` dari Supabase (masih dummy).
- Kemungkinan: hitung ongkir RajaOngkir pakai `destination_id` yang sudah tersimpan.
