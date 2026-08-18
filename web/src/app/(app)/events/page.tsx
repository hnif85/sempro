import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
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
  const isOfficial = profile?.role === "official";

  let eventsQuery = supabase
    .from("events")
    .select("*, event_numbers(count), registrations(count)")
    .order("created_at", { ascending: false });

  if (isOfficial) {
    const { data: assigned } = await supabase
      .from("event_officials")
      .select("event_id")
      .eq("user_id", user.id);
    const eventIds = (assigned ?? []).map((o) => o.event_id);
    if (eventIds.length > 0) {
      eventsQuery = eventsQuery.in("id", eventIds);
    } else {
      eventsQuery = eventsQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: events } = await eventsQuery;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Event</h1>
          <p className="text-zinc-500">Kelola kejuaraan renang</p>
        </div>
        {isAdmin && (
          <Link
            href="/events/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Buat Event
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(events ?? []).map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold leading-snug">{e.name}</h2>
              <span className="inline-flex shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize">
                {e.status}
              </span>
            </div>
            <p className="mb-4 line-clamp-2 text-sm text-zinc-500">
              {e.description || "Tidak ada deskripsi"}
            </p>
            <div className="space-y-1 text-sm text-zinc-600">
              <p>
                📅 {e.start_date ?? "-"} {e.end_date ? `— ${e.end_date}` : ""}
              </p>
              <p>📍 {e.location ?? "-"}</p>
            </div>
            <div className="mt-4 flex gap-4 border-t border-zinc-100 pt-3 text-sm text-zinc-500">
              <span>{e.event_numbers?.length ?? 0} nomor</span>
              <span>{e.registrations?.length ?? 0} pendaftar</span>
            </div>
          </Link>
        ))}
      </div>

      {(events ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
          Belum ada event. {isAdmin && "Klik \"Buat Event\" untuk memulai."}
        </div>
      )}
    </div>
  );
}