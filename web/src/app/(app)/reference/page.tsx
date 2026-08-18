import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ReferencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: styles }, { data: distances }, { data: categories }] = await Promise.all([
    supabase.from("swimming_styles").select("*").order("name"),
    supabase.from("distances").select("*").order("meters"),
    supabase.from("age_categories").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Data Referensi</h1>
        <p className="text-zinc-500">Master data sistem</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Gaya Renang</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {(styles ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Jarak</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {(distances ?? []).map((d) => (
              <div key={d.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="font-medium">{d.meters} meter</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-6 py-4">
            <h2 className="text-base font-semibold">Kategori Umur</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {(categories ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-zinc-400">
                  {c.min_age != null ? `${c.min_age}–${c.max_age ?? "∞"} th` : "Semua umur"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}