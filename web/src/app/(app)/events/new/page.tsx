import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventImageUpload from "@/components/EventImageUpload";
import EventPdfUpload from "@/components/EventPdfUpload";
import { createEvent } from "../actions";

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";
  if (!isAdmin) redirect("/events");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Buat Event</h1>
        <p className="text-zinc-500">Identitas Kejuaraan Renang</p>
      </div>

      <form action={createEvent} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Identitas Kejuaraan</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Nama Event *</label>
            <input
              name="name"
              required
              placeholder="Contoh: Jakarta Open 2026"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Kategori</label>
            <select
              name="category"
              defaultValue=""
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih kategori…</option>
              <option value="Umum">Umum</option>
              <option value="Pelajar">Pelajar</option>
              <option value="Klub">Klub</option>
              <option value="Internasional">Internasional</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Kelas</label>
            <select
              name="class_name"
              defaultValue=""
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Pilih kelas…</option>
              <option value="KU 5-7">KU 5-7</option>
              <option value="KU 8-10">KU 8-10</option>
              <option value="KU 11-12">KU 11-12</option>
              <option value="KU 13-14">KU 13-14</option>
              <option value="KU 15-17">KU 15-17</option>
              <option value="KU 18+">KU 18+</option>
              <option value="Open">Open</option>
              <option value="Semua Kelas">Semua Kelas</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Lokasi</label>
            <input
              name="location"
              placeholder="Nama kolam / venue"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Penyelenggara</label>
            <input
              name="organizer"
              placeholder="Nama penyelenggara / asosiasi"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tanggal Mulai</label>
            <input
              name="start_date"
              type="date"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tanggal Selesai</label>
            <input
              name="end_date"
              type="date"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-zinc-400">Pengaturan Lomba</h2>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Jumlah Lintasan</label>
            <select
              name="lanes_count"
              defaultValue={6}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {[4, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} lintasan
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Jumlah Seri Pernomor</label>
            <input
              name="heats_per_number"
              type="number"
              min={1}
              defaultValue={1}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Biaya per Nomor (Rp)</label>
            <input
              name="entry_fee"
              type="number"
              min={0}
              defaultValue={0}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-400">
              Jumlah Nomor: <span className="font-semibold text-zinc-600">0</span>
              <p className="mt-0.5 text-xs text-zinc-400">Diisi setelah nomor lomba ditambahkan</p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Deskripsi singkat kejuaraan"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <EventImageUpload />
        <EventPdfUpload />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Simpan
          </button>
          <Link
            href="/events"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
