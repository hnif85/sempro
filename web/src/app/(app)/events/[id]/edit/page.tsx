import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventImageUpload from "@/components/EventImageUpload";
import EventPdfUpload from "@/components/EventPdfUpload";
import { updateEvent, deleteEvent } from "../../actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();

  const { count: numberCount } = await supabase
    .from("event_numbers")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  const statuses = [
    "draft",
    "published",
    "registration_open",
    "registration_closed",
    "running",
    "finished",
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Edit Event</h1>
        <p className="text-zinc-500">Ubah detail kejuaraan</p>
      </div>

      <form action={updateEvent} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <input type="hidden" name="id" value={id} />
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-400">Identitas Kejuaraan</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Nama Event *</label>
            <input
              name="name"
              required
              defaultValue={event.name}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Kategori</label>
            <select
              name="category"
              defaultValue={event.category ?? ""}
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
              defaultValue={event.class_name ?? ""}
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
              defaultValue={event.location ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Penyelenggara</label>
            <input
              name="organizer"
              defaultValue={event.organizer ?? ""}
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
              defaultValue={event.start_date ?? ""}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tanggal Selesai</label>
            <input
              name="end_date"
              type="date"
              defaultValue={event.end_date ?? ""}
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
              defaultValue={event.lanes_count}
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
              defaultValue={event.heats_per_number ?? 1}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Biaya per Nomor (Rp)</label>
            <input
              name="entry_fee"
              type="number"
              min={0}
              defaultValue={event.entry_fee ?? 0}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Jumlah Nomor</label>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700">
              {numberCount ?? 0}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={event.description ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <EventImageUpload currentUrl={event.banner_url} />
        <EventPdfUpload currentUrl={event.pdf_url} />

        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            name="status"
            defaultValue={event.status}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Simpan
          </button>
          <a
            href={`/events/${id}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Batal
          </a>
        </div>
      </form>

      <form action={deleteEvent} className="rounded-xl border border-red-200 bg-red-50 p-4">
        <input type="hidden" name="id" value={id} />
        <p className="mb-2 text-sm font-medium text-red-700">Hapus event ini</p>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Hapus Event
        </button>
      </form>
    </div>
  );
}
