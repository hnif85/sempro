import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAthleteRegistration, createAuthenticatedRegistration, createClubRegistration } from "../actions";

type EventNumberOption = {
  id: string;
  name: string;
  fee: number | string | null;
  gender: string | null;
  age_categories: { name: string } | { name: string }[] | null;
  swimming_styles: { name: string } | { name: string }[] | null;
  distances: { meters: number } | { meters: number }[] | null;
};

function numberLabel(number: EventNumberOption) {
  return `${number.name}${Number(number.fee) > 0 ? ` — Rp ${Number(number.fee).toLocaleString("id-ID")}` : " — Gratis"}`;
}

function NumberChoices({ numbers }: { numbers: EventNumberOption[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {numbers.map((number) => (
        <label key={number.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm hover:border-primary hover:bg-blue-50">
          <input type="checkbox" name="event_number_id" value={number.id} className="mt-0.5 h-4 w-4 accent-primary" />
          <span><span className="block font-medium">{numberLabel(number)}</span><span className="mt-1 block text-xs text-zinc-500">{number.gender} · pilih lebih dari satu bila diperlukan</span></span>
        </label>
      ))}
    </div>
  );
}

export default async function PublicRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const type = sp.type === "club" ? "club" : "athlete";
  const admin = await createAdminClient();
  const { data: event } = await admin.from("events").select("id, name, status, start_date, location").eq("id", id).single();
  if (!event) redirect(`/event/${id}`);

  const { data: rawNumbers } = await admin
    .from("event_numbers")
    .select("id, name, fee, gender, age_categories(name), swimming_styles(name), distances(meters)")
    .eq("event_id", id)
    .order("name");
  const numbers = (rawNumbers ?? []) as unknown as EventNumberOption[];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await admin.from("profiles").select("role, full_name, club_id, athlete_id").eq("id", user.id).single()
    : { data: null };

  let club: { name: string; pic_name: string | null } | null = null;
  let athletes: { id: string; name: string; gender: string | null; birth_date: string | null }[] = [];
  let ownAthlete: { id: string; name: string; gender: string | null; birth_date: string | null } | null = null;

  if ((profile?.role === "club_manager" || profile?.role === "club_coach") && profile.club_id) {
    const [{ data: clubData }, { data: athleteData }] = await Promise.all([
      admin.from("clubs").select("name, pic_name").eq("id", profile.club_id).single(),
      admin.from("athletes").select("id, name, gender, birth_date").eq("club_id", profile.club_id).order("name"),
    ]);
    club = clubData;
    athletes = athleteData ?? [];
  }
  if (profile?.role === "peserta" && profile.athlete_id) {
    const { data } = await admin.from("athletes").select("id, name, gender, birth_date").eq("id", profile.athlete_id).single();
    ownAthlete = data;
  }

  const authenticatedRole = profile?.role === "club_manager" || profile?.role === "club_coach" || profile?.role === "peserta" ? profile.role : null;
  const isClubAccount = authenticatedRole === "club_manager" || authenticatedRole === "club_coach";
  const open = event.status === "registration_open";

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <Link href={`/event/${id}`} className="text-sm text-primary hover:underline">← {event.name}</Link>
        <div><h1 className="text-2xl font-bold">Pendaftaran Event</h1><p className="mt-1 text-sm text-zinc-500">{event.start_date ?? "-"} · {event.location ?? "-"}</p></div>

        {!open && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Pendaftaran event belum dibuka atau sudah ditutup.</div>}
        {sp.error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{sp.error}</div>}

        {open && (
          <div className="space-y-6">
              {!authenticatedRole && (
                <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={`/event/${id}/register?type=club`} className={`rounded-xl border p-5 ${type === "club" ? "border-primary bg-blue-50" : "border-zinc-200 bg-white"}`}><p className="font-semibold">Daftar sebagai Club</p><p className="mt-1 text-sm text-zinc-500">Kelola atlet dan pendaftaran atas nama club.</p></Link>
              <Link href={`/event/${id}/register?type=athlete`} className={`rounded-xl border p-5 ${type === "athlete" ? "border-primary bg-blue-50" : "border-zinc-200 bg-white"}`}><p className="font-semibold">Daftar sebagai Atlet</p><p className="mt-1 text-sm text-zinc-500">Daftar individu dengan akun atlet.</p></Link>
            </div>
            <p className="text-sm text-zinc-600">Sudah punya akun? <Link className="font-medium text-primary hover:underline" href={`/login?next=${encodeURIComponent(`/event/${id}/register`)}`}>Login untuk mengisi otomatis</Link>.</p>

            {type === "club" ? (
              <form action={createClubRegistration} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
                <input type="hidden" name="event_id" value={id} />
                <h2 className="text-lg font-semibold">Data Club dan Atlet</h2>
                <div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Nama Club *</label><input name="club_name" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Nama PIC</label><input name="pic_name" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">WhatsApp</label><input name="whatsapp" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Kota</label><input name="city" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div></div>
                <div className="border-t border-zinc-100 pt-5"><h3 className="font-semibold">Akun Pengelola Club</h3><p className="mt-1 text-sm text-zinc-500">Email dan password ini digunakan untuk login mengelola club dan pendaftaran atlet.</p><div className="mt-3 grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Email Akun Club *</label><input name="email" type="email" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Password Akun Club *</label><input name="password" type="password" minLength={6} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div></div></div>
                <div className="border-t border-zinc-100 pt-5"><h3 className="font-semibold">Atlet pertama</h3><div className="mt-3 grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-sm font-medium">Nama Atlet *</label><input name="athlete_name" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Jenis Kelamin *</label><select name="athlete_gender" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">Pilih...</option><option value="putra">Putra</option><option value="putri">Putri</option></select></div><div><label className="mb-1 block text-sm font-medium">Tanggal Lahir</label><input name="athlete_birth_date" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div></div></div>
                <div className="border-t border-zinc-100 pt-5"><h3 className="font-semibold">Pilih Nomor Lomba</h3><p className="mt-1 text-sm text-zinc-500">Bisa memilih beberapa nomor untuk atlet ini.</p><div className="mt-3"><NumberChoices numbers={numbers} /></div></div>
                <button className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">Buat Akun & Daftar</button>
              </form>
            ) : (
              <form action={createAthleteRegistration} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8"><input type="hidden" name="event_id" value={id} /><h2 className="text-lg font-semibold">Data Atlet dan Akun</h2><div className="grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-sm font-medium">Nama Lengkap *</label><input name="name" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Jenis Kelamin *</label><select name="gender" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">Pilih...</option><option value="putra">Putra</option><option value="putri">Putri</option></select></div><div><label className="mb-1 block text-sm font-medium">Tanggal Lahir *</label><input name="birth_date" type="date" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div></div><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Email Login *</label><input name="email" type="email" required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Password *</label><input name="password" type="password" minLength={6} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div></div><div className="border-t border-zinc-100 pt-5"><h3 className="font-semibold">Pilih Nomor Lomba</h3><p className="mt-1 text-sm text-zinc-500">Bisa memilih beberapa nomor untuk atlet ini.</p><div className="mt-3"><NumberChoices numbers={numbers} /></div></div><button className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">Buat Akun & Daftar</button></form>
            )}
                </>
              )}

              {authenticatedRole && (
                <form action={createAuthenticatedRegistration} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 md:p-8">
            <input type="hidden" name="event_id" value={id} />
            {isClubAccount ? (
              <>
                <div><h2 className="text-lg font-semibold">Data otomatis terisi</h2><p className="mt-1 text-sm text-zinc-500">Akun {user?.email} akan digunakan untuk pendaftaran dan pembayaran.</p></div>
                <div className="rounded-lg bg-zinc-50 p-4 text-sm"><p className="font-medium">Club: {club?.name ?? "-"}</p><p className="mt-1 text-zinc-500">Pilih atlet lama atau isi bagian atlet baru.</p></div>
                <div><label className="mb-1 block text-sm font-medium">Atlet yang sudah ada</label><select name="athlete_id" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">Pilih atlet lama...</option>{athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name} ({athlete.gender ?? "-"})</option>)}</select></div>
                <div className="border-t border-zinc-100 pt-5"><h3 className="font-semibold">Tambah Atlet Baru</h3><p className="mt-1 text-sm text-zinc-500">Isi bagian ini jika atlet belum ada di daftar club. Jika diisi, atlet baru akan langsung disimpan.</p><div className="mt-3 grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-sm font-medium">Nama Atlet Baru</label><input name="new_athlete_name" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-sm font-medium">Jenis Kelamin</label><select name="new_athlete_gender" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">Pilih...</option><option value="putra">Putra</option><option value="putri">Putri</option></select></div><div><label className="mb-1 block text-sm font-medium">Tanggal Lahir</label><input name="new_athlete_birth_date" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" /></div></div></div>
              </>
            ) : (
              <input type="hidden" name="athlete_id" value={ownAthlete?.id ?? ""} />
            )}
            <div className="border-t border-zinc-100 pt-5"><h3 className="font-semibold">Pilih Nomor Lomba</h3><p className="mt-1 text-sm text-zinc-500">Bisa memilih beberapa nomor untuk atlet ini.</p><div className="mt-3"><NumberChoices numbers={numbers} /></div></div>
            <button className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white">Lanjut ke Pembayaran</button>
                </form>
              )}
          </div>
        )}
      </div>
    </main>
  );
}
