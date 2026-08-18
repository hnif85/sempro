import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDoc, createPdf, deleteDoc } from "./actions";

export default async function DocsPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  const { data: docs } = await supabase
    .from("event_docs")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Dokumentasi Event</h1>
        <p className="text-zinc-500">Foto, video, dan dokumen PDF acara</p>
      </div>

      {isAdmin && (
        <>
          <form action={createPdf} className="rounded-xl border border-zinc-200 bg-white p-6">
            <input type="hidden" name="event_id" value={id} />
            <h2 className="mb-4 text-base font-semibold">Upload PDF</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">File PDF *</label>
                <input
                  type="file"
                  name="file"
                  accept="application/pdf"
                  required
                  className="block w-full text-sm text-zinc-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Keterangan</label>
                <input
                  name="caption"
                  placeholder="Contoh: Buku acara / Technical Bulletin"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                Upload PDF
              </button>
            </div>
          </form>

          <form action={createDoc} className="rounded-xl border border-zinc-200 bg-white p-6">
            <input type="hidden" name="event_id" value={id} />
            <h2 className="mb-4 text-base font-semibold">Tambah Dokumentasi</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tipe</label>
                <select
                  name="media_type"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="foto">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">URL</label>
                <input
                  name="url"
                  required
                  placeholder="https://… (foto, YouTube, Google Drive)"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Keterangan</label>
                <input
                  name="caption"
                  placeholder="Contoh: Foto podium 50m Bebas"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                Tambah
              </button>
            </div>
          </form>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(docs ?? []).map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0"
              >
                <p className="text-sm font-medium">
                  {d.media_type === "foto" ? "📷" : d.media_type === "video" ? "🎬" : "📄"}{" "}
                  {d.caption || d.file_name || d.url}
                </p>
                <p className="mt-1 truncate text-xs text-primary">
                  {d.media_type === "pdf" ? d.file_name : d.url}
                </p>
              </a>
              {isAdmin && (
                <form action={deleteDoc}>
                  <input type="hidden" name="event_id" value={id} />
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    title="Hapus"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-zinc-400 hover:bg-red-100 hover:text-red-600"
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {(docs ?? []).length === 0 && (
          <p className="col-span-3 rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
            Belum ada dokumentasi.
          </p>
        )}
      </div>
    </div>
  );
}
