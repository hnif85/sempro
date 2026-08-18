# PRD — Swimming Event Management Platform (SEMP)

## Version
v1.0

## Status
Draft

## Product Owner
TBD

## Last Updated
16 Agustus 2026

---

# 1. Executive Summary

Swimming Event Management Platform (SEMP) adalah platform berbasis web yang membantu penyelenggara kejuaraan renang mengelola seluruh proses event dari awal hingga akhir.

Platform ini dibangun berdasarkan kebutuhan operasional yang terdapat pada sistem kejuaraan renang eksisting serta ditingkatkan dengan pengalaman pengguna modern dan digitalisasi proses administrasi.

SEMP berfokus pada:

- Pembuatan event
- Registrasi peserta
- Pembayaran
- Manajemen perlombaan
- Pengolahan hasil
- Sertifikat digital
- Dokumentasi event
- Riwayat prestasi atlet

---

# 2. Product Vision

Menjadi platform manajemen event renang yang memudahkan penyelenggara, club, pelatih, dan atlet dalam menjalankan seluruh siklus kejuaraan renang secara digital.

---

# 3. Goals

## Goal Utama

Menghilangkan proses manual pada:

- Registrasi peserta
- Pengelolaan nomor lomba
- Penyusunan heat
- Pengolahan hasil
- Pembuatan sertifikat
- Rekap data perlombaan

---

## Success Metrics

### Operasional

- 90% proses event dilakukan melalui sistem
- Waktu penyusunan heat berkurang >80%
- Waktu pembuatan hasil berkurang >70%

### Bisnis

- Event aktif per bulan
- Total atlet terdaftar
- Total transaksi pembayaran
- Total sertifikat diterbitkan

---

# 4. User Roles

RBAC memakai 5 role dengan akses bertingkat.

## Super Admin

Hak akses:

- Mengelola seluruh sistem
- Mengelola pengguna (satu-satunya yang bisa CRUD user)
- Mengelola event
- Mengelola referensi
- Melihat seluruh laporan

---

## Admin Event

Hak akses:

- Mengelola event
- Mengelola peserta & registrasi
- Mengelola perlombaan, heat, seeding
- Mengelola hasil & ranking
- Mengelola panitia (penugasan official per event)
- Mengelola club & atlet
- Mengelola sertifikat, sponsor, dokumentasi

Tidak dapat:

- Mengelola pengguna (hanya Super Admin)

---

## Club Manager

Hak akses (scoped ke club sendiri):

- Mengelola club sendiri
- Mengelola atlet club sendiri
- Mendaftarkan atlet ke nomor lomba
- Melakukan pembayaran
- Melihat invoice club sendiri

---

## Official (Panitia)

Hak akses (scoped ke event yang ditugaskan):

- Input waktu lomba
- Mengelola hasil perlombaan

Penugasan dilakukan via tabel `event_officials` (event_id → user_id).
Official hanya bisa mengakses event yang ia ditugaskan; tidak punya akses ke event lain.

---

## Peserta

Hak akses (scoped ke data atlet miliknya):

- Melihat profil & personal best
- Melihat riwayat lomba & prestasi
- Mendaftarkan diri ke event/nomor lomba yang dibuka

Peserta terhubung ke data atlet via `profiles.athlete_id`.

---

# 5. User Journey

```text
Buat Event
    ↓
Buka Pendaftaran
    ↓
Registrasi Atlet
    ↓
Pembayaran
    ↓
Finalisasi Peserta
    ↓
Generate Heat
    ↓
DNS
    ↓
DNT
    ↓
Pelaksanaan Lomba
    ↓
Input Waktu
    ↓
Generate Ranking
    ↓
Publikasi Hasil
    ↓
Generate Sertifikat
    ↓
Dokumentasi Event
    ↓
Riwayat Atlet
```

---

# 6. Modul 1 — Authentication

## Tujuan

Mengelola akses pengguna.

---

## Fitur

### Login

- Email/Username
- Password

### Reset Password

- Email reset password
- Ubah password

### Session Management

- Logout
- Session timeout

---

# 6A. Modul 1A — Pendaftaran Publik

## Tujuan

Form pendaftaran yang bisa diakses publik (tanpa login) maupun dari dashboard admin untuk mendaftarkan club dan peserta baru.

---

## Akses

- Publik: halaman `/daftar` (ditautkan dari landing page & login page)
- Admin: menu "Pendaftaran" di dashboard (super_admin & admin_event)

---

## Fitur

### Pendaftaran Club

- Nama Club *
- Nama PIC / Pelatih
- WhatsApp
- Kota / Lokasi (autocomplete dari RajaOngkir Komerce API)
- Sekolah (opsional)
- Email akun pengelola *
- Password (min 6 karakter) *

Efek:

- Membuat akun dengan role `club_manager`
- Membuat data club (status `draft`) + token club otomatis
- Menautkan profile ke club (via `profiles.club_id`)
- Menyimpan data geografis terstruktur (destination_id, provinsi, kabupaten, kecamatan, kelurahan, kode pos)

### Pendaftaran Peserta

- Nama Lengkap *
- Jenis Kelamin (putra/putri)
- Tanggal Lahir
- Club (opsional — boleh pilih club terdaftar atau **tanpa club / individu**)
- Email akun login *
- Password (min 6 karakter) *

Efek:

- Membuat akun dengan role `peserta`
- Membuat data atlet (club_id boleh NULL untuk peserta individu)
- Menautkan profile ke atlet (via `profiles.athlete_id`)

---

## Catatan Implementasi

- Insert akun & data memakai admin client (service role) di server action — aman dari sisi RLS.
- Migration 004 membuat `athletes.club_id` nullable untuk mendukung peserta tanpa club.
- Setelah sukses, club ditampilkan token-nya; peserta diarahkan login ke portal `/peserta`.
- Semua kebutuhan data geografis memakai **RajaOngkir Komerce API** (`/api/locations` proxy server-side, key di `RAJAONGKIR_API_KEY`). Data tersimpan terstruktur di kolom club (migration 005): `destination_id`, `province_name`, `city_name`, `district_name`, `subdistrict_name`, `zip_code` — siap dipakai untuk hitung ongkir.

---

# 7. Modul 2 — Dashboard

## Tujuan

Menampilkan ringkasan event.

---

## KPI

### Event

- Total Event
- Event Aktif
- Event Selesai

### Peserta

- Total Club
- Total Atlet
- Total Nomor

### Perlombaan

- Total Acara
- Total Heat

### Hasil

- Total Emas
- Total Perak
- Total Perunggu

### Keuangan

- Total Tagihan
- Total Pembayaran
- Outstanding Payment

---

# 8. Modul 3 — Event Management

## Tujuan

Mengelola informasi kejuaraan.

---

## Data Event

### Informasi Dasar

- Nama Event
- Deskripsi
- Banner
- Logo Event
- Lokasi
- Penyelenggara

### Jadwal

- Tanggal Mulai
- Tanggal Selesai

### Pengaturan

- Jumlah Lintasan
- Status Event

Status:

- Draft
- Published
- Registration Open
- Registration Closed
- Running
- Finished

---

# 9. Modul 4 — Master Referensi

## Tujuan

Menyediakan data master sistem.

---

## Data Referensi

### Gender

- Putra
- Putri

### Gaya Renang

- Gaya Bebas
- Gaya Dada
- Gaya Punggung
- Gaya Kupu
- Gaya Ganti

### Kategori Umur

Contoh:

- KU 5-7
- KU 8-10
- KU 11-12
- KU 13-14
- Open

### Jarak

- 25m
- 50m
- 100m
- 200m
- 400m

---

# 10. Modul 5 — Nomor Lomba

## Tujuan

Mengelola seluruh nomor perlombaan.

---

## Data Nomor

- Nama Nomor
- Gaya
- Jarak
- Gender
- Kategori Umur
- Maksimum Peserta
- Biaya Pendaftaran

---

## Contoh

50m Gaya Bebas Putra KU10

100m Gaya Dada Putri KU12

---

# 11. Modul 6 — Club Management

## Data Club

- Nama Club
- Nama PIC
- Nomor WhatsApp
- Kota
- Sekolah (Opsional)

---

## Status Club

- Draft
- Lengkap
- Finalisasi

Setelah finalisasi, data tidak dapat diubah tanpa persetujuan admin.

---

# 12. Modul 7 — Atlet Management

## Data Atlet

- Nama Atlet
- Tanggal Lahir
- Jenis Kelamin
- Foto
- Club

---

## Import Atlet

### Manual

Input satu per satu.

### Excel Import

Upload template Excel.

---

# 13. Modul 8 — Registrasi

## Tujuan

Mendaftarkan atlet ke nomor perlombaan.

---

## Flow

Club

↓

Pilih Atlet

↓

Pilih Nomor Lomba

↓

Generate Tagihan

↓

Pembayaran

↓

Finalisasi

---

## Fitur

### Registrasi Individu

Per atlet.

### Registrasi Massal

Beberapa atlet sekaligus.

### Validasi

- Kategori umur
- Gender
- Kuota nomor

---

# 14. Modul 9 — Pembayaran

## Invoice

Field:

- Nomor Invoice
- Tanggal
- Club
- Total Tagihan
- Status

---

## Metode Pembayaran

### Transfer Bank

Upload bukti transfer.

### QRIS

Pembayaran otomatis.

### Manual

Verifikasi admin.

---

## Status

- Draft
- Menunggu Pembayaran
- Lunas
- Dibatalkan

---

# 15. Modul 10 — User Management

## Pengguna

### Super Admin

### Admin Event

### Club Manager

### Official

### Peserta

---

## Fitur

- Tambah Pengguna
- Edit Pengguna
- Reset Password
- Nonaktifkan Pengguna
- Hubungkan akun Peserta ke data Atlet
- Penugasan Official ke Event (`event_officials`)

---

# 16. Modul 11 — Susunan Acara

## Tujuan

Menyusun urutan perlombaan.

---

## Data Acara

- Nomor Acara
- Nomor Lomba
- Gender
- Kategori

---

## Contoh

Acara 1

50m Bebas Putra KU10

Acara 2

100m Dada Putri KU12

---

# 17. Modul 12 — Heat & Seeding

## Tujuan

Membagi peserta ke heat dan lane.

---

## Generate Heat

Berdasarkan:

- Nomor
- Gender
- Kategori
- Jumlah Lintasan

---

## Generate Lane

Otomatis.

---

## Seeding

### Otomatis

Berdasarkan seed time.

### Manual

Oleh panitia.

---

# 18. Modul 13 — DNS & DNT

## DNS

Daftar Nominasi Sementara.

Output:

- Heat Sheet Sementara

---

## DNT

Daftar Nominasi Tetap.

Output:

- Heat Sheet Final

---

# 19. Modul 14 — Estimasi Waktu

## Tujuan

Menghitung estimasi jadwal lomba.

---

## Perhitungan

Berdasarkan:

- Jumlah Heat
- Jumlah Peserta
- Durasi per Heat

---

## Output

```text
Acara 1 - 08:00
Acara 2 - 08:15
Acara 3 - 08:28
```

---

# 20. Modul 15 — Pelaksanaan Lomba

## Status Peserta

- Hadir
- DNS
- Selesai

---

## Input Waktu

Input waktu per lane.

Contoh:

```text
Lane 1 = 34.21
Lane 2 = 35.88
Lane 3 = 33.90
```

---

## Koreksi Hasil

Hanya dapat dilakukan oleh admin event.

---

# 21. Modul 16 — Hasil & Ranking

## Ranking Otomatis

Mengurutkan peserta berdasarkan waktu terbaik.

---

## Medali

- Emas
- Perak
- Perunggu

---

## Rekap Medali

Per:

- Atlet
- Club
- Event

---

## Output

- Hasil Acara
- Rekap Hasil

---

# 22. Modul 17 — Sertifikat Digital

## Jenis

### Sertifikat Peserta

### Sertifikat Juara

---

## Format

PDF

---

## QR Verification

Setiap sertifikat memiliki QR Code verifikasi.

---

# 23. Modul 18 — Buku Acara

## Isi Buku Acara

### Cover

### Sambutan

### Sponsor

### Jadwal

### Susunan Acara

### Heat Sheet

---

## Export

PDF

---

# 24. Modul 19 — Sponsor & Branding

## Logo Sponsor

- Sponsor 1
- Sponsor 2
- Sponsor 3

---

## Branding Event

- Cover Buku Acara
- Cover Hasil Acara
- Logo Event

---

# 25. Modul 20 — Dokumentasi Event

## Tujuan

Menyimpan seluruh dokumentasi event.

---

## Foto

- Foto Acara
- Foto Podium
- Foto Penyerahan Medali

---

## Video

- Link YouTube
- Link Google Drive

---

## Gallery Event

Galeri terpusat untuk seluruh dokumentasi.

---

# 26. Modul 21 — Riwayat Atlet

## Tujuan

Membangun histori prestasi atlet lintas event.

---

## Profil Atlet

### Informasi Dasar

- Nama
- Club
- Kategori

### Statistik

- Total Event
- Total Nomor
- Total Medali

---

## Riwayat Event

Contoh:

```text
Jakarta Open 2026
50m Bebas
33.51
Juara 1

Bandung Cup 2026
50m Bebas
34.02
Juara 2
```

---

## Personal Best

Menampilkan catatan waktu terbaik per nomor.

---

# 27. Reporting

## Export PDF

- Buku Acara
- Hasil Acara
- Sertifikat

---

## Export Excel

- Data Atlet
- Data Club
- Data Hasil

---

# 28. Non Functional Requirements

## Security

- Role Based Access Control
- Encrypted Password
- Audit Log

---

## Performance

- Support minimum 5.000 atlet per event
- Support minimum 500 concurrent users

---

## Availability

- Cloud Hosted
- Daily Backup

---

# 29. Future Scope (Phase 2)

Belum masuk MVP.

## Integrasi Eksternal

- API Registration
- API Federation

## Timing Device Integration

- Omega
- Seiko
- Colorado

## Live Result

- Live Scoreboard
- Live Ranking

## Mobile App

- Atlet
- Pelatih
- Official

---

# 30. MVP Release Scope

## Included

✅ Event Management

✅ Club Management

✅ Atlet Management

✅ Registrasi

✅ Pembayaran

✅ User Management

✅ Susunan Acara

✅ Heat & Seeding

✅ DNS & DNT

✅ Input Waktu

✅ Ranking

✅ Hasil

✅ Sertifikat Digital

✅ Buku Acara

✅ Sponsor Management

✅ Dokumentasi Event

✅ Riwayat Atlet

---

## Excluded

❌ Cashback

❌ Web Service Client

❌ Live Result

❌ Mobile App

❌ Integrasi Timing Device

❌ AI Features

---

# Penutup

SEMP dirancang sebagai platform manajemen event renang modern yang mengakomodasi seluruh kebutuhan inti penyelenggaraan kejuaraan renang, mulai dari registrasi hingga dokumentasi dan histori atlet, dengan tetap menjaga kompleksitas sistem agar sesuai untuk penyelenggara event tingkat lokal, regional, maupun nasional.