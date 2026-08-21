import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageBilling } from "@/lib/rbac";

const ACTIVE_EVENT_STATUSES = ["published", "registration_open", "registration_closed", "running"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    registration_open: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Pendaftaran Dibuka" },
    registration_closed: { bg: "bg-amber-100", text: "text-amber-700", label: "Pendaftaran Ditutup" },
    running: { bg: "bg-blue-100", text: "text-blue-700", label: "Sedang Berlangsung" },
    finished: { bg: "bg-zinc-100", text: "text-zinc-500", label: "Selesai" },
    draft: { bg: "bg-zinc-100", text: "text-zinc-400", label: "Draft" },
    published: { bg: "bg-sky-100", text: "text-sky-700", label: "Published" },
  };
  const s = map[status] ?? { bg: "bg-zinc-100", text: "text-zinc-500", label: status };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

function RupiahBadge({ amount, color }: { amount: number; color: "blue" | "green" | "red" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };
  return <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${colors[color]}`}>Rp {amount.toLocaleString("id-ID")}</span>;
}

function KpiIcon({ icon, color }: { icon: "swim" | "users" | "number" | "heat"; color: string }) {
  const paths: Record<string, string> = {
    swim: "M16.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14.8 8l-4.5 3 2.7 2.4 3.5-2.1M10.3 11l-4.1 1.4M4 16c2.2 1.6 4.2 1.6 6.3 0 2.2 1.6 4.2 1.6 6.4 0 1.4 1 2.4 1.2 3.3 1.1",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    number: "M4 7V4h16v3M9 20h6M12 4v16",
    heat: "M8 2h8M12 2v4M8 18c0-3 2-4 4-4s4 1 4 4M4 18h16M7 22h10",
  };
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[icon]} />
      </svg>
    </div>
  );
}

function MedalIcon({ type }: { type: "gold" | "silver" | "bronze" }) {
  const colors = { gold: "text-yellow-500", silver: "text-zinc-400", bronze: "text-orange-400" };
  return (
    <svg className={`h-10 w-10 ${colors[type]}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 12v4M8 20h8M9 16h6" />
    </svg>
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

  let eventsQuery = supabase
    .from("events")
    .select("id, name, status, start_date, end_date, location")
    .order("start_date", { ascending: true });
  if (profile?.role === "admin_event") {
    eventsQuery = eventsQuery.eq("created_by", user.id);
  }
  const { data: events } = await eventsQuery;

  if (!isAdmin) {
    const [{ count: athleteCount }, { count: registrationCount }, { count: numberCount }] = await Promise.all([
      supabase.from("athletes").select("*", { count: "exact", head: true }).eq("club_id", clubId),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("club_id", clubId),
      supabase.from("registrations").select("event_number_id", { count: "exact", head: true }).eq("club_id", clubId),
    ]);

    let paid: { status: string; total: number }[] = [];
    let outstanding: { status: string; total: number }[] = [];
    let totalPaid = 0;
    let totalOutstanding = 0;
    if (canSeeBilling) {
      const { data: invoices } = await supabase.from("invoices").select("status, total").eq("club_id", clubId);
      paid = (invoices ?? []).filter((i) => i.status === "paid");
      outstanding = (invoices ?? []).filter((i) => i.status === "awaiting_payment" || i.status === "draft");
      totalPaid = paid.reduce((s, i) => s + Number(i.total), 0);
      totalOutstanding = outstanding.reduce((s, i) => s + Number(i.total), 0);
    }

    const clubName = profile?.clubs?.name ?? "-";
    const activeEvents = (events ?? []).filter((e) => ACTIVE_EVENT_STATUSES.includes(e.status)).slice(0, 3);

    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#082d5a] to-[#0b5ca8] p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="16.5" cy="5.5" r="2" />
                <path d="m14.8 8-4.5 3 2.7 2.4 3.5-2.1" />
                <path d="m10.3 11-4.1 1.4M4 16c2.2 1.6 4.2 1.6 6.3 0 2.2 1.6 4.2 1.6 6.4 0 1.4 1 2.4 1.2 3.3 1.1" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">SEMP Championship 2026</h1>
              <p className="mt-1 text-sm text-white/70">{clubName} • {athleteCount ?? 0} Atlet • {registrationCount ?? 0} Registrasi • {numberCount ?? 0} Nomor</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
            <KpiIcon icon="users" color="bg-blue-100 text-blue-600" />
            <div>
              <p className="text-xs text-zinc-500">TOTAL ATLET</p>
              <p className="text-2xl font-bold">{athleteCount ?? 0}</p>
              <p className="text-[11px] text-zinc-400">Semua atlet terdaftar</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
            <KpiIcon icon="users" color="bg-emerald-100 text-emerald-600" />
            <div>
              <p className="text-xs text-zinc-500">TOTAL REGISTRASI</p>
              <p className="text-2xl font-bold">{registrationCount ?? 0}</p>
              <p className="text-[11px] text-zinc-400">Club / Sekolah</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
            <KpiIcon icon="number" color="bg-amber-100 text-amber-600" />
            <div>
              <p className="text-xs text-zinc-500">TOTAL NOMOR</p>
              <p className="text-2xl font-bold">{numberCount ?? 0}</p>
              <p className="text-[11px] text-zinc-400">Nomor pertandingan</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
            <KpiIcon icon="heat" color="bg-violet-100 text-violet-600" />
            <div>
              <p className="text-xs text-zinc-500">TOTAL HEAT</p>
              <p className="text-2xl font-bold">—</p>
              <p className="text-[11px] text-zinc-400">Heat telah dibuat</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Event Aktif</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {activeEvents.length > 0 ? activeEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#082d5a] to-[#0b5ca8] text-center text-[10px] font-bold leading-tight text-white">SEMP<br/>OPEN</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">{e.location ?? "Lokasi menyusul"}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              )) : (
                <div className="px-5 py-8 text-center text-sm text-zinc-400">Belum ada event aktif.</div>
              )}
            </div>
            {activeEvents.length > 0 && (
              <div className="border-t border-zinc-100 px-5 py-3">
                <Link href="/events" className="text-sm font-medium text-primary hover:underline">Lihat semua event →</Link>
              </div>
            )}
          </section>

          {canSeeBilling && (
            <section className="rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Keuangan</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5">
                <div className="text-center">
                  <p className="text-[11px] text-zinc-500">TOTAL TAGIHAN</p>
                  <p className="mt-1 text-lg font-bold">{rupiah(totalPaid + totalOutstanding)}</p>
                  <RupiahBadge amount={totalPaid + totalOutstanding} color="blue" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-zinc-500">TOTAL PEMBAYARAN</p>
                  <p className="mt-1 text-lg font-bold">{rupiah(totalPaid)}</p>
                  <RupiahBadge amount={totalPaid} color="green" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-zinc-500">OUTSTANDING</p>
                  <p className="mt-1 text-lg font-bold">{rupiah(totalOutstanding)}</p>
                  <RupiahBadge amount={totalOutstanding} color="red" />
                </div>
              </div>
              <div className="border-t border-zinc-100 px-5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Progress Pembayaran</span>
                  <span className="font-medium">{totalPaid + totalOutstanding > 0 ? Math.round((totalPaid / (totalPaid + totalOutstanding)) * 100) : 0}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${totalPaid + totalOutstanding > 0 ? (totalPaid / (totalPaid + totalOutstanding)) * 100 : 0}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-400">Pembayaran terkonfirmasi: {rupiah(totalPaid)} dari {rupiah(totalPaid + totalOutstanding)}</p>
              </div>
            </section>
          )}
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Jadwal Event</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama Event</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Lokasi</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(events ?? []).map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3">
                      <Link href={`/events/${e.id}`} className="font-medium text-primary hover:underline">{e.name}</Link>
                    </td>
                    <td className="px-5 py-3">{e.start_date ?? "-"}{e.end_date ? ` — ${e.end_date}` : ""}</td>
                    <td className="px-5 py-3">{e.location ?? "-"}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
                {(events ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                      Belum ada event. <Link href="/events" className="text-primary hover:underline">Buat event pertama</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  const eventList = events ?? [];
  let clubCount = 0;
  let athleteCount = 0;
  let numberCount = 0;
  let heatCount = 0;
  let goldCount = 0;
  let silverCount = 0;
  let bronzeCount = 0;
  let userCount = 0;
  let invoices: { status: string; total: number }[] = [];

  if (profile?.role === "admin_event") {
    const eventIds = eventList.map((event) => event.id);
    const [{ data: registrations }, { count: scopedNumberCount }, { count: scopedHeatCount }, { data: scopedInvoices }, { count: scopedUsers }] = await Promise.all([
      eventIds.length
        ? supabase.from("registrations").select("id, club_id, athlete_id").in("event_id", eventIds)
        : Promise.resolve({ data: [] as { id: string; club_id: string | null; athlete_id: string }[] }),
      eventIds.length
        ? supabase.from("event_numbers").select("*", { count: "exact", head: true }).in("event_id", eventIds)
        : Promise.resolve({ count: 0 }),
      eventIds.length
        ? supabase.from("schedule_items").select("id", { count: "exact", head: true }).in("event_id", eventIds)
        : Promise.resolve({ count: 0 }),
      eventIds.length
        ? supabase.from("invoices").select("status, total").in("event_id", eventIds)
        : Promise.resolve({ data: [] as { status: string; total: number }[] }),
      eventIds.length
        ? supabase.from("registrations").select("athlete_id", { count: "exact", head: true }).in("event_id", eventIds)
        : Promise.resolve({ count: 0 }),
    ]);
    const registrationRows = registrations ?? [];
    const registrationIds = registrationRows.map((registration) => registration.id);
    const { data: medalEntries } = registrationIds.length
      ? await supabase.from("heat_entries").select("place, status").in("registration_id", registrationIds)
      : { data: [] as { place: number | null; status: string | null }[] };
    clubCount = new Set(registrationRows.map((registration) => registration.club_id).filter(Boolean)).size;
    athleteCount = new Set(registrationRows.map((registration) => registration.athlete_id)).size;
    numberCount = scopedNumberCount ?? 0;
    heatCount = scopedHeatCount ?? 0;
    goldCount = (medalEntries ?? []).filter((entry) => entry.place === 1 && entry.status !== "dns").length;
    silverCount = (medalEntries ?? []).filter((entry) => entry.place === 2 && entry.status !== "dns").length;
    bronzeCount = (medalEntries ?? []).filter((entry) => entry.place === 3 && entry.status !== "dns").length;
    userCount = scopedUsers ?? 0;
    invoices = scopedInvoices ?? [];
  } else {
    const [{ count: allClubCount }, { count: allAthleteCount }, { count: allNumberCount }, { count: allHeatCount }, { count: allGoldCount }, { count: allSilverCount }, { count: allBronzeCount }, { count: allUserCount }, { data: allInvoices }] = await Promise.all([
      supabase.from("clubs").select("*", { count: "exact", head: true }),
      supabase.from("athletes").select("*", { count: "exact", head: true }),
      supabase.from("event_numbers").select("*", { count: "exact", head: true }),
      supabase.from("heats").select("*", { count: "exact", head: true }),
      supabase.from("heat_entries").select("*", { count: "exact", head: true }).eq("place", 1).neq("status", "dns"),
      supabase.from("heat_entries").select("*", { count: "exact", head: true }).eq("place", 2).neq("status", "dns"),
      supabase.from("heat_entries").select("*", { count: "exact", head: true }).eq("place", 3).neq("status", "dns"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("status, total"),
    ]);
    clubCount = allClubCount ?? 0;
    athleteCount = allAthleteCount ?? 0;
    numberCount = allNumberCount ?? 0;
    heatCount = allHeatCount ?? 0;
    goldCount = allGoldCount ?? 0;
    silverCount = allSilverCount ?? 0;
    bronzeCount = allBronzeCount ?? 0;
    userCount = allUserCount ?? 0;
    invoices = allInvoices ?? [];
  }

  const paid = (invoices ?? []).filter((i) => i.status === "paid");
  const outstanding = (invoices ?? []).filter((i) => i.status === "awaiting_payment" || i.status === "draft");
  const totalTagihan = (invoices ?? []).filter((i) => i.status !== "cancelled").reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = paid.reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = outstanding.reduce((s, i) => s + Number(i.total), 0);

  const activeEvents = eventList.filter((e) => ACTIVE_EVENT_STATUSES.includes(e.status)).slice(0, 3);
  const activeEventCount = eventList.filter((e) => ACTIVE_EVENT_STATUSES.includes(e.status)).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#082d5a] to-[#0b5ca8] p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="16.5" cy="5.5" r="2" />
              <path d="m14.8 8-4.5 3 2.7 2.4 3.5-2.1" />
              <path d="m10.3 11-4.1 1.4M4 16c2.2 1.6 4.2 1.6 6.3 0 2.2 1.6 4.2 1.6 6.4 0 1.4 1 2.4 1.2 3.3 1.1" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">SEMP Championship 2026</h1>
            <p className="mt-1 text-sm text-white/70">{athleteCount ?? 0} Atlet • {clubCount ?? 0} Club • {numberCount ?? 0} Nomor • {activeEventCount} Event Aktif</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <KpiIcon icon="swim" color="bg-blue-100 text-blue-600" />
          <div>
            <p className="text-xs text-zinc-500">TOTAL ATLET</p>
            <p className="text-2xl font-bold">{athleteCount ?? 0}</p>
            <p className="text-[11px] text-zinc-400">Semua atlet terdaftar</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <KpiIcon icon="users" color="bg-emerald-100 text-emerald-600" />
          <div>
            <p className="text-xs text-zinc-500">TOTAL CLUB</p>
            <p className="text-2xl font-bold">{clubCount ?? 0}</p>
            <p className="text-[11px] text-zinc-400">Club / Sekolah</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <KpiIcon icon="number" color="bg-amber-100 text-amber-600" />
          <div>
            <p className="text-xs text-zinc-500">TOTAL NOMOR</p>
            <p className="text-2xl font-bold">{numberCount ?? 0}</p>
            <p className="text-[11px] text-zinc-400">Nomor pertandingan</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <KpiIcon icon="heat" color="bg-violet-100 text-violet-600" />
          <div>
            <p className="text-xs text-zinc-500">TOTAL HEAT</p>
            <p className="text-2xl font-bold">{heatCount ?? 0}</p>
            <p className="text-[11px] text-zinc-400">Heat telah dibuat</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Event Aktif</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {activeEvents.length > 0 ? activeEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#082d5a] to-[#0b5ca8] text-center text-[10px] font-bold leading-tight text-white">SEMP<br/>OPEN</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">{e.location ?? "Lokasi menyusul"}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">Belum ada event aktif.</div>
            )}
          </div>
          {activeEvents.length > 0 && (
            <div className="border-t border-zinc-100 px-5 py-3">
              <Link href="/events" className="text-sm font-medium text-primary hover:underline">Lihat semua event →</Link>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Keuangan</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 p-5">
            <div className="text-center">
              <p className="text-[11px] text-zinc-500">TOTAL TAGIHAN</p>
              <p className="mt-1 text-lg font-bold">{rupiah(totalTagihan)}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-zinc-500">TOTAL PEMBAYARAN</p>
              <p className="mt-1 text-lg font-bold">{rupiah(totalPaid)}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-zinc-500">OUTSTANDING</p>
              <p className="mt-1 text-lg font-bold">{rupiah(totalOutstanding)}</p>
            </div>
          </div>
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Progress Pembayaran</span>
              <span className="font-medium">{totalTagihan > 0 ? Math.round((totalPaid / totalTagihan) * 100) : 0}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${totalTagihan > 0 ? (totalPaid / totalTagihan) * 100 : 0}%` }} />
            </div>
            <p className="mt-1 text-xs text-zinc-400">Pembayaran terkonfirmasi: {rupiah(totalPaid)} dari {rupiah(totalTagihan)}</p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Perolehan Medali</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 p-5">
            <div className="text-center">
              <MedalIcon type="gold" />
              <p className="mt-2 text-xs font-medium text-zinc-500">EMAS</p>
              <p className="text-2xl font-bold text-yellow-600">{goldCount ?? 0}</p>
            </div>
            <div className="text-center">
              <MedalIcon type="silver" />
              <p className="mt-2 text-xs font-medium text-zinc-500">PERAK</p>
              <p className="text-2xl font-bold text-zinc-600">{silverCount ?? 0}</p>
            </div>
            <div className="text-center">
              <MedalIcon type="bronze" />
              <p className="mt-2 text-xs font-medium text-zinc-500">PERUNGGU</p>
              <p className="text-2xl font-bold text-orange-500">{bronzeCount ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Ringkasan</h2>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">{profile?.role === "admin_event" ? "Total Registrasi" : "Total Pengguna"}</span>
              <span className="text-lg font-bold">{userCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Total Event</span>
              <span className="text-lg font-bold">{eventList.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Event Aktif</span>
              <span className="text-lg font-bold">{activeEventCount}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
