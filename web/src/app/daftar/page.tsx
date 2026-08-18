import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { registerClub, registerPeserta } from "./actions";
import LocationPicker from "@/components/LocationPicker";

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string; token?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "peserta" ? "peserta" : "club";

  const admin = await createAdminClient();
  const { data: clubs } = await admin
    .from("clubs")
    .select("id, name, city")
    .order("name");

  return (
    <div className="flex flex-1 flex-col px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            SEMP
          </div>
          <h1 className="text-2xl font-semibold">Pendaftaran</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Daftarkan club atau dirimu sebagai peserta kejuaraan renang
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1">
          <Link
            href="/daftar?tab=club"
            className={`rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
              tab === "club" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Daftar Club
          </Link>
          <Link
            href="/daftar?tab=peserta"
            className={`rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
              tab === "peserta" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Daftar Peserta
          </Link>
        </div>

        {sp.success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
            {tab === "club" ? (
              <>
                <p className="font-medium text-green-800">Club berhasil didaftarkan!</p>
                <p className="mt-1 text-sm text-green-700">
                  Simpan token club berikut untuk login ke portal club (juga bisa dilihat oleh admin di Data Club):
                </p>
                <p className="mt-3 rounded-lg bg-white px-3 py-2 font-mono text-sm text-green-900">
                  {sp.token}
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Login sebagai Pengelola Club
                </Link>
              </>
            ) : (
              <>
                <p className="font-medium text-green-800">Pendaftaran berhasil!</p>
                <p className="mt-1 text-sm text-green-700">
                  Akun peserta sudah dibuat. Silakan login untuk melihat personal record dan mendaftar event.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  Login Sekarang
                </Link>
              </>
            )}
          </div>
        )}

        {sp.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{sp.error}</p>
          </div>
        )}

        {tab === "club" ? (
          <form action={registerClub} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold">Data Club</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Club *</label>
              <input
                name="name"
                required
                placeholder="Contoh: Tirta Sport Club"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nama PIC / Pelatih</label>
                <input
                  name="pic_name"
                  placeholder="Nama penanggung jawab"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">WhatsApp</label>
                <input
                  name="whatsapp"
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Kota / Lokasi</label>
                <LocationPicker fieldPrefix="loc" placeholder="Cari kota / kecamatan (mis. Pondok Aren)…" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Sekolah (Opsional)</label>
                <input
                  name="school"
                  placeholder="Nama sekolah bila dari sekolah"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-5">
              <h2 className="mb-4 text-base font-semibold">Akun Pengelola</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Password *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              DAFTARKAN CLUB
            </button>
          </form>
        ) : (
          <form action={registerPeserta} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold">Data Peserta</h2>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Lengkap *</label>
              <input
                name="name"
                required
                placeholder="Nama lengkap atlet"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Jenis Kelamin</label>
                <select
                  name="gender"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Pilih…</option>
                  <option value="putra">Putra</option>
                  <option value="putri">Putri</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tanggal Lahir</label>
                <input
                  name="birth_date"
                  type="date"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Club (Opsional)</label>
              <select
                name="club_id"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Tanpa Club (Individu)</option>
                {(clubs ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.city ? ` — ${c.city}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-400">
                Pilih club jika sudah terdaftar, atau biarkan kosong untuk daftar secara individu.
              </p>
            </div>

            <div className="border-t border-zinc-100 pt-5">
              <h2 className="mb-4 text-base font-semibold">Akun Login</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Password *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              DAFTAR SEBAGAI PESERTA
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
