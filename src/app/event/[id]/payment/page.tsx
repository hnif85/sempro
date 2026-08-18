import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { simulatePayment } from "../actions";

export default async function PublicPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invoice?: string; success?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/event/${id}/payment?invoice=${sp.invoice ?? ""}`)}`);

  const admin = await createAdminClient();
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, event_id, club_id, payer_user_id, total, status, paid_at, events(name), invoice_items(amount, description, registrations(athletes(name), event_numbers(name)))")
    .eq("id", sp.invoice ?? "")
    .eq("event_id", id)
    .single();
  if (!invoice) notFound();

  const { data: profile } = await admin.from("profiles").select("club_id").eq("id", user.id).single();
  if (invoice.payer_user_id !== user.id && (!profile?.club_id || profile.club_id !== invoice.club_id)) notFound();

  const event = Array.isArray(invoice.events) ? invoice.events[0] : invoice.events;
  const paid = invoice.status === "paid";

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-10">
        <Link href={`/event/${id}`} className="text-sm text-primary hover:underline">← {event?.name ?? "Event"}</Link>
        <div><h1 className="text-2xl font-bold">Pembayaran Pendaftaran</h1><p className="mt-1 text-sm text-zinc-500">Simulasi payment gateway untuk MVP</p></div>
        {sp.success && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">Pembayaran berhasil disimulasikan. Pendaftaran kamu sudah lunas.</div>}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wide text-zinc-500">Invoice</p><p className="mt-1 font-semibold">{invoice.invoice_number}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{paid ? "paid" : "awaiting payment"}</span></div><div className="mt-6 border-t border-zinc-100 pt-5"><p className="text-sm text-zinc-500">Total pembayaran</p><p className="mt-1 text-3xl font-bold text-primary">Rp {Number(invoice.total).toLocaleString("id-ID")}</p></div><div className="mt-6 space-y-2 text-sm">{(invoice.invoice_items ?? []).map((item, index) => { const registration = Array.isArray(item.registrations) ? item.registrations[0] : item.registrations; const athlete = Array.isArray(registration?.athletes) ? registration.athletes[0] : registration?.athletes; const number = Array.isArray(registration?.event_numbers) ? registration.event_numbers[0] : registration?.event_numbers; return <div key={`${item.description}-${index}`} className="flex justify-between border-b border-zinc-50 pb-2"><span>{athlete?.name ?? "Atlet"} · {number?.name ?? item.description}</span><span className="font-medium">Rp {Number(item.amount).toLocaleString("id-ID")}</span></div>; })}</div>{!paid && <form action={simulatePayment} className="mt-6"><input type="hidden" name="event_id" value={id} /><input type="hidden" name="invoice_id" value={invoice.id} /><button className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark">Bayar Sekarang (Simulasi)</button><p className="mt-2 text-center text-xs text-zinc-400">Belum terhubung ke payment gateway nyata.</p></form>}</section>
      </div>
    </main>
  );
}
