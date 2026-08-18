import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateInvoiceStatus, createPayment } from "./actions";

type Payment = {
  id: string;
  method: string;
  status: string;
  amount: number | string | null;
};

export default async function InvoicesPage({
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
    .select("role, club_id")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin_event";

  const { data: event } = await supabase.from("events").select("name").eq("id", id).single();
  if (!event) notFound();

  let query = supabase
    .from("invoices")
    .select("*, clubs(name), payments(*), invoice_items(id, amount, description)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  if (!isAdmin && profile?.club_id) {
    query = query.eq("club_id", profile.club_id);
  }
  const { data: invoices } = await query;

  const totals = {
    paid: (invoices ?? [])
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + Number(i.total), 0),
    awaiting: (invoices ?? [])
      .filter((i) => i.status === "awaiting_payment")
      .reduce((s, i) => s + Number(i.total), 0),
    paidCount: (invoices ?? []).filter((i) => i.status === "paid").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
          ← {event.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Pembayaran</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Total Tagihan</p>
          <p className="mt-1 text-xl font-semibold">
            Rp {(totals.paid + totals.awaiting).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">Uang Masuk</p>
          <p className="mt-1 text-xl font-semibold text-green-800">
            Rp {totals.paid.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Sisa Pembayaran</p>
          <p className="mt-1 text-xl font-semibold text-amber-800">
            Rp {totals.awaiting.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {(invoices ?? []).map((inv) => (
          <div key={inv.id} className="rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <p className="font-semibold">{inv.invoice_number}</p>
                <p className="text-sm text-zinc-500">
                  {inv.clubs?.name ?? "-"} · {inv.invoice_items?.length ?? 0} item
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">Rp {Number(inv.total).toLocaleString("id-ID")}</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    inv.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : inv.status === "awaiting_payment"
                        ? "bg-amber-100 text-amber-700"
                        : inv.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {inv.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3 px-6 py-3">
                <form action={updateInvoiceStatus} className="flex gap-2">
                  <input type="hidden" name="id" value={inv.id} />
                  <input type="hidden" name="event_id" value={id} />
                  <select
                    name="status"
                    defaultValue={inv.status}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm capitalize"
                  >
                    <option value="draft">Draft</option>
                    <option value="awaiting_payment">Menunggu Pembayaran</option>
                    <option value="paid">Lunas</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
                    Update
                  </button>
                </form>
              </div>
            )}

            {inv.payments && inv.payments.length > 0 && (
              <div className="border-t border-zinc-100 px-6 py-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Pembayaran
                </p>
                <div className="space-y-1 text-sm">
                  {((inv.payments ?? []) as unknown as Payment[]).map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="capitalize">
                        {p.method.replace("_", " ")} · {p.status}
                      </span>
                      <span>Rp {Number(p.amount).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isAdmin && inv.status === "awaiting_payment" && (
              <div className="border-t border-zinc-100 px-6 py-4">
                <p className="mb-2 text-sm font-medium">Catat Pembayaran</p>
                <form action={createPayment} className="flex flex-wrap gap-3">
                  <input type="hidden" name="invoice_id" value={inv.id} />
                  <input type="hidden" name="event_id" value={id} />
                  <select name="method" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                    <option value="manual">Manual</option>
                  </select>
                  <input
                    name="amount"
                    type="number"
                    defaultValue={inv.total}
                    className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="proof_url"
                    placeholder="Link bukti transfer (opsional)"
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                    Kirim
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}

        {(invoices ?? []).length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-400">
            Belum ada invoice. Finalisasi registrasi untuk generate tagihan.
          </div>
        )}
      </div>
    </div>
  );
}