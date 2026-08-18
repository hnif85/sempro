"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateInvoiceStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const status = String(formData.get("status") ?? "");

  const update: Record<string, string | null> = { status };
  if (status === "paid") update.paid_at = new Date().toISOString();
  if (status === "draft" || status === "awaiting_payment") update.paid_at = null;

  await supabase.from("invoices").update(update).eq("id", id);

  revalidatePath(`/events/${eventId}/invoices`);
  redirect(`/events/${eventId}/invoices`);
}

export async function createPayment(formData: FormData) {
  const supabase = await createClient();
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const method = String(formData.get("method") ?? "manual");
  const amount = Number(formData.get("amount") ?? 0);
  const proofUrl = String(formData.get("proof_url") ?? "") || null;

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    method,
    amount,
    proof_url: proofUrl,
    status: method === "manual" ? "pending" : "pending",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/invoices`);
  redirect(`/events/${eventId}/invoices`);
}