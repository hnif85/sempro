import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppShell } from "@/components/AppShell";

type PdfDocument = { id: string; url: string; caption: string | null; file_name: string | null; viewUrl: string };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function storagePath(url: string) {
  const marker = "/storage/v1/object/public/event-images/";
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function viewableUrl(admin: Awaited<ReturnType<typeof createAdminClient>>, url: string | null) {
  if (!url) return null;
  const path = storagePath(url);
  if (!path) return url;
  const { data, error } = await admin.storage.from("event-images").createSignedUrl(path, 3600);
  return error ? url : data.signedUrl;
}

function SiteHeader({ user }: { user: { email?: string } | null }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-sm font-bold text-primary">SWIM EVENT</Link>
        {user ? (
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-primary">Dashboard</Link>
        ) : (
          <Link href="/login" className="text-sm text-zinc-600 hover:text-primary">Login</Link>
        )}
      </div>
    </header>
  );
}

function GuidePanel({ documents, eventName }: { documents: PdfDocument[]; eventName: string }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Dokumen Event</p><h2 className="mt-1 text-xl font-bold">Buku Panduan / PDF</h2></div>{documents[0] && <a href={documents[0].viewUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary hover:bg-blue-50">Buka PDF</a>}</div>
      {documents[0] ? <><p className="mt-2 truncate text-xs text-zinc-500">{documents[0].file_name ?? documents[0].caption ?? eventName}</p><iframe src={documents[0].viewUrl} title={`Buku panduan ${eventName}`} className="mt-4 h-[760px] w-full rounded-lg border border-zinc-200" />{documents.length > 1 && <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">{documents.slice(1).map((document) => <a key={document.id} href={document.viewUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">{document.file_name ?? document.caption ?? "Dokumen PDF"}</a>)}</div>}</> : <div className="mt-4 flex h-40 items-center justify-center rounded-lg bg-zinc-50 text-center text-sm text-zinc-400">PDF belum diupload panitia.</div>}
    </section>
  );
}

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };
  const { data: event } = await admin.from("events").select("id, name, description, banner_url, logo_url, pdf_url, location, organizer, start_date, end_date, status, category, class_name, lanes_count, heats_per_number, event_numbers(id, name, fee, gender, age_categories(name), swimming_styles(name), distances(meters))").eq("id", id).single();
  if (!event) notFound();

  const { data: eventDocs } = await admin.from("event_docs").select("id, url, caption, file_name, created_at").eq("event_id", id).eq("media_type", "pdf").order("created_at", { ascending: false });
  const numbers = Array.isArray(event.event_numbers) ? event.event_numbers : [];
  const canRegister = event.status === "registration_open";
  const bannerUrl = await viewableUrl(admin, event.banner_url ?? event.logo_url);
  const pdfDocuments = await Promise.all([
    ...(event.pdf_url ? [{ id: "main", url: event.pdf_url, caption: "Dokumen utama", file_name: null }] : []),
    ...(eventDocs ?? []),
  ].map(async (document) => ({ ...document, viewUrl: (await viewableUrl(admin, document.url)) ?? document.url })));

  const backLink = user ? `/dashboard` : "/#events";

  const content = (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {!user && <SiteHeader user={null} />}
      <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6">
        <Link href={backLink} className="text-sm text-primary hover:underline">← Kembali ke daftar event</Link>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_560px]">
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="relative h-72 bg-[#082d5a] md:h-[320px]">
              {bannerUrl ? <Image src={bannerUrl} alt={event.name} fill priority sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" /> : <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#082d5a,#0b5ca8)] text-sm font-medium text-white/80">Banner event belum diupload</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white md:p-8"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize backdrop-blur">{event.status.replaceAll("_", " ")}</span><h1 className="mt-3 text-3xl font-bold md:text-4xl">{event.name}</h1>{bannerUrl && <a href={bannerUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-white/25">Buka gambar asli</a>}</div>
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div><div className="flex flex-wrap gap-2 text-xs text-zinc-600">{event.category && <span className="rounded-full bg-zinc-100 px-3 py-1">{event.category}</span>}{event.class_name && <span className="rounded-full bg-zinc-100 px-3 py-1">{event.class_name}</span>}<span className="rounded-full bg-zinc-100 px-3 py-1">{event.lanes_count} lintasan</span><span className="rounded-full bg-zinc-100 px-3 py-1">{event.heats_per_number} seri/nomor</span></div><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-zinc-500">Tanggal</dt><dd className="mt-1 font-medium">{formatDate(event.start_date)}{event.end_date ? ` — ${formatDate(event.end_date)}` : ""}</dd></div><div><dt className="text-zinc-500">Lokasi</dt><dd className="mt-1 font-medium">{event.location ?? "-"}</dd></div><div><dt className="text-zinc-500">Penyelenggara</dt><dd className="mt-1 font-medium">{event.organizer ?? "-"}</dd></div><div><dt className="text-zinc-500">Jumlah Nomor</dt><dd className="mt-1 font-medium">{numbers.length} nomor lomba</dd></div></dl>{event.description && <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{event.description}</p>}</div>

              <section className="rounded-xl border border-zinc-200 p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Nomor Perlombaan</p><h2 className="mt-1 text-xl font-bold">Daftar Nomor ({numbers.length})</h2></div><p className="text-right text-xs text-zinc-500">Pilih nomor saat pendaftaran</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{numbers.map((number) => { const style = Array.isArray(number.swimming_styles) ? number.swimming_styles[0] : number.swimming_styles; const distance = Array.isArray(number.distances) ? number.distances[0] : number.distances; const age = Array.isArray(number.age_categories) ? number.age_categories[0] : number.age_categories; return <div key={number.id} className="rounded-xl border border-zinc-100 p-4"><p className="font-semibold">{number.name}</p><p className="mt-1 text-xs text-zinc-500">{style?.name ?? "-"} · {distance?.meters ? `${distance.meters}m` : "-"} · {number.gender} · {age?.name ?? "-"}</p><p className="mt-3 text-sm font-semibold text-primary">{Number(number.fee) > 0 ? `Rp ${Number(number.fee).toLocaleString("id-ID")}` : "Gratis"}</p></div>; })}{numbers.length === 0 && <p className="col-span-full py-8 text-center text-sm text-zinc-400">Nomor lomba belum tersedia.</p>}</div></section>

              <section className="rounded-xl bg-blue-50 p-5"><p className="text-sm font-medium text-zinc-600">Form Pendaftaran</p><p className="mt-2 text-2xl font-bold text-primary">{canRegister ? "Dibuka" : "Belum tersedia"}</p><p className="mt-2 text-xs leading-5 text-zinc-500">Daftar sebagai club atau atlet. Data akun akan tersimpan untuk pendaftaran berikutnya.</p>{canRegister ? <Link href={`/event/${id}/register`} className="mt-5 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary-dark">Buka Form Pendaftaran</Link> : <p className="mt-5 rounded-lg bg-white px-3 py-2 text-center text-xs text-zinc-500">Pendaftaran belum dibuka oleh panitia.</p>}</section>
            </div>
          </section>

          <GuidePanel documents={pdfDocuments} eventName={event.name} />
        </div>
      </div>
    </main>
  );

  if (user) {
    return (
      <AppShell fullName={profile?.full_name ?? "User"} role={profile?.role ?? null}>
        {content}
      </AppShell>
    );
  }
  return content;
}
