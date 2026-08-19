import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageBilling } from "@/lib/rbac";

const ACTIVE_EVENT_STATUSES = [
  "published",
  "registration_open",
  "registration_closed",
  "running",
];

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </h2>
  );
}

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, clubs(*)")
    .eq("id", user.id)
    .single();

  if (profile?.role === "peserta") redirect("/peserta");
  if (profile?.role === "official") redirect("/events");

  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";
  const canSeeBilling = canManageBilling(profile?.role);
  const clubId = profile?.club_id ?? "00000000-0000-0000-0000-000000000000";

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, start_date, end_date, location")
    .order("start_date", { ascending: true });

  if (!isAdmin) {
    // Club Manager: scoped to own club
    const [
      { count: athleteCount },
      { count: registrationCount },
      { count: numberCount },
    ] = await Promise.all([
      supabase
        .from("athletes")
        .select("*", { count: "exact", head: true })
        .eq("club_id", clubId),
      supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("club_id", clubId),
      supabase
        .from("registrations")
        .select("event_number_id", { count: "exact", head: true })
        .eq("club_id", clubId),
    ]);

    let paid: { status: string; total: number }[] = [];
    let outstanding: { status: string; total: number }[] = [];
    let totalPaid = 0;
    let totalOutstanding = 0;
    if (canSeeBilling) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, total")
        .eq("club_id", clubId);

      paid = (invoices ?? []).filter((i) => i.status === "paid");
      outstanding = (invoices ?? []).filter(
        (i) => i.status === "awaiting_payment" || i.status === "draft"
      );
      totalPaid = paid.reduce((s, i) => s + Number(i.total), 0);
      totalOutstanding = outstanding.reduce((s, i) => s + Number(i.total), 0);
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-zinc-500">
            Selamat datang, {profile?.full_name ?? "User"} — {profile?.clubs?.name ?? "-"}
          </p>
        </div>

        <section>
          <SectionTitle>Data Club Anda</SectionTitle>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Atlet" value={athleteCount ?? 0} />
            <StatCard label="Total Registrasi" value={registrationCount ?? 0} />
            <StatCard label="Total Nomor Diikuti" value={numberCount ?? 0} />
            {canSeeBilling && (
              <StatCard
                label="Tagihan Club"
                value={rupiah(totalPaid + totalOutstanding)}
              />
            )}
          </div>
        </section>

        {canSeeBilling && (
          <section>
            <SectionTitle>Pembayaran</SectionTitle>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Uang Masuk" value={rupiah(totalPaid)} />
              <StatCard label="Outstanding Payment" value={rupiah(totalOutstanding)} />
              <StatCard label="Invoice Lunas" value={paid.length} />
              <StatCard label="Invoice Menunggu" value={outstanding.length} />
            </div>
          </section>
        )}

        <section>
          <SectionTitle>Jadwal Event</SectionTitle>
          <EventTable events={events ?? []} />
        </section>
      </div>
    );
  }

  // Admin: full KPI from PRD
  const [
    { count: clubCount },
    { count: athleteCount },
    { count: numberCount },
    { count: acaraCount },
    { count: heatCount },
    { count: goldCount },
    { count: silverCount },
    { count: bronzeCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("clubs").select("*", { count: "exact", head: true }),
    supabase.from("athletes").select("*", { count: "exact", head: true }),
    supabase.from("event_numbers").select("*", { count: "exact", head: true }),
    supabase.from("schedule_items").select("*", { count: "exact", head: true }),
    supabase.from("heats").select("*", { count: "exact", head: true }),
    supabase
      .from("heat_entries")
      .select("*", { count: "exact", head: true })
      .eq("place", 1)
      .neq("status", "dns"),
    supabase
      .from("heat_entries")
      .select("*", { count: "exact", head: true })
      .eq("place", 2)
      .neq("status", "dns"),
    supabase
      .from("heat_entries")
      .select("*", { count: "exact", head: true })
      .eq("place", 3)
      .neq("status", "dns"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const { data: invoices } = await supabase.from("invoices").select("status, total");

  const paid = (invoices ?? []).filter((i) => i.status === "paid");
  const outstanding = (invoices ?? []).filter(
    (i) => i.status === "awaiting_payment" || i.status === "draft"
  );
  const totalTagihan = (invoices ?? [])
    .filter((i) => i.status !== "cancelled")
    .reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = paid.reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.total), 0);

  const eventList = events ?? [];
  const activeEvents = eventList.filter((e) =>
    ACTIVE_EVENT_STATUSES.includes(e.status)
  ).length;
  const finishedEvents = eventList.filter((e) => e.status === "finished").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-zinc-500">
          Selamat datang, {profile?.full_name ?? "User"} — Ringkasan seluruh event
        </p>
      </div>

      <section>
        <SectionTitle>Event</SectionTitle>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Total Event" value={eventList.length} />
          <StatCard label="Event Aktif" value={activeEvents} />
          <StatCard label="Event Selesai" value={finishedEvents} />
        </div>
      </section>

      <section>
        <SectionTitle>Peserta</SectionTitle>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Total Club" value={clubCount ?? 0} />
          <StatCard label="Total Atlet" value={athleteCount ?? 0} />
          <StatCard label="Total Nomor" value={numberCount ?? 0} />
        </div>
      </section>

      <section>
        <SectionTitle>Perlombaan</SectionTitle>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Acara" value={acaraCount ?? 0} />
          <StatCard label="Total Heat" value={heatCount ?? 0} />
          <StatCard label="Total Pengguna" value={userCount ?? 0} />
          <StatCard label="Club Lunas" value={paid.length} />
        </div>
      </section>

      <section>
        <SectionTitle>Hasil</SectionTitle>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Total Emas" value={goldCount ?? 0} />
          <StatCard label="Total Perak" value={silverCount ?? 0} />
          <StatCard label="Total Perunggu" value={bronzeCount ?? 0} />
        </div>
      </section>

      <section>
        <SectionTitle>Keuangan</SectionTitle>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Total Tagihan" value={rupiah(totalTagihan)} />
          <StatCard label="Total Pembayaran" value={rupiah(totalPaid)} />
          <StatCard label="Outstanding Payment" value={rupiah(totalOutstanding)} />
        </div>
      </section>

      <section>
        <SectionTitle>Jadwal Event</SectionTitle>
        <EventTable events={eventList} />
      </section>
    </div>
  );
}

function EventTable({
  events,
}: {
  events: {
    id: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Nama Event</th>
            <th className="px-4 py-3 font-medium">Tanggal</th>
            <th className="px-4 py-3 font-medium">Lokasi</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {events.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/events/${e.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {e.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                {e.start_date ?? "-"} {e.end_date ? `— ${e.end_date}` : ""}
              </td>
              <td className="px-4 py-3">{e.location ?? "-"}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize">
                  {e.status}
                </span>
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                Belum ada event.{" "}
                <Link href="/events" className="text-primary hover:underline">
                  Buat event pertama
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
