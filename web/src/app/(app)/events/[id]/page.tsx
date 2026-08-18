import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignOfficial, removeOfficial } from "./officials-actions";

export default async function EventDetailPage({
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

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";
  const isOfficial = profile?.role === "official";

  if (isOfficial) {
    const { data: assigned } = await supabase
      .from("event_officials")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id);
    if (!assigned || assigned.length === 0) redirect("/events");
  }

  const { data: officials } = isAdmin
    ? await supabase
        .from("event_officials")
        .select("id, profiles(full_name)")
        .eq("event_id", id)
    : { data: null };

  const officialsList = (officials ?? []) as unknown as {
    id: string;
    profiles: { full_name: string | null }[] | null;
  }[];

  const { data: officialCandidates } = isAdmin
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "official")
        .order("full_name")
    : { data: null };

  const { count: numberCount } = await supabase
    .from("event_numbers")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const { count: regCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/events" className="text-sm text-primary hover:underline">
            ← Semua Event
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{event.name}</h1>
          <p className="text-zinc-500">
            {event.location ?? "-"} · {event.start_date ?? "-"}
            {event.end_date ? ` — ${event.end_date}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
            {event.category && <span className="rounded-full bg-zinc-100 px-2 py-0.5">{event.category}</span>}
            {event.class_name && <span className="rounded-full bg-zinc-100 px-2 py-0.5">{event.class_name}</span>}
            <span className="rounded-full bg-zinc-100 px-2 py-0.5">{event.lanes_count} lintasan</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5">{event.heats_per_number} seri/nomor</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium capitalize">
            {event.status}
          </span>
          {isAdmin && (
            <Link
              href={`/events/${id}/edit`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Edit Event
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Link
          href={`/events/${id}/numbers`}
          className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <p className="text-sm text-zinc-500">Nomor Lomba</p>
          <p className="mt-1 text-2xl font-semibold">{numberCount ?? 0}</p>
        </Link>
        <Link
          href={`/events/${id}/registrations`}
          className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <p className="text-sm text-zinc-500">Pendaftar</p>
          <p className="mt-1 text-2xl font-semibold">{regCount ?? 0}</p>
        </Link>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold">Panitia Event</h2>
          <p className="text-sm text-zinc-500">
            Panitia (official) hanya bisa mengelola heat & hasil di event ini.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {officialsList.map((o) => (
              <form key={o.id} action={removeOfficial} className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1">
                <input type="hidden" name="event_id" value={id} />
                <input type="hidden" name="id" value={o.id} />
                <span className="text-sm font-medium">{o.profiles?.[0]?.full_name ?? "Panitia"}</span>
                <button type="submit" className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-zinc-400 hover:bg-red-100 hover:text-red-600">
                  ✕
                </button>
              </form>
            ))}
            {officialsList.length === 0 && (
              <p className="text-sm text-zinc-400">Belum ada panitia ditugaskan.</p>
            )}
          </div>

          <form action={assignOfficial} className="mt-4 flex gap-3">
            <input type="hidden" name="event_id" value={id} />
            <select
              name="user_id"
              required
              defaultValue=""
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                Pilih panitia…
              </option>
              {(officialCandidates ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name ?? o.id}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Tugaskan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}