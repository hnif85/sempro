import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSponsor, deleteSponsor } from "./actions";

export default async function SponsorsPage({
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

  const { data: accessProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (accessProfile?.role === "official") redirect(`/events/${id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .eq("event_id", id)
    .order("position");

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Sponsor & Branding</h1>
        <p className="text-zinc-500">Logo sponsor dan branding event</p>
      </div>

      {isAdmin && (
        <form action={createSponsor} className="rounded-xl border border-zinc-200 bg-white p-6">
          <input type="hidden" name="event_id" value={id} />
          <h2 className="mb-4 text-base font-semibold">Tambah Sponsor</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Sponsor *</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">URL Logo</label>
              <input
                name="logo_url"
                placeholder="https://…"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Posisi</label>
              <input
                name="position"
                type="number"
                min={1}
                defaultValue={1}
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
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(sponsors ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-zinc-400">Posisi {s.position}</p>
              {s.logo_url && (
                <p className="mt-1 truncate text-xs text-primary">{s.logo_url}</p>
              )}
            </div>
            {isAdmin && (
              <form action={deleteSponsor}>
                <input type="hidden" name="event_id" value={id} />
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs text-red-600 hover:underline">Hapus</button>
              </form>
            )}
          </div>
        ))}
        {(sponsors ?? []).length === 0 && (
          <p className="col-span-3 rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
            Belum ada sponsor.
          </p>
        )}
      </div>
    </div>
  );
}
