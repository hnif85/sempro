"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function uploadBanner(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `events/${crypto.randomUUID()}.${ext}`;
  const admin = await createAdminClient();
  const { error } = await admin.storage
    .from("event-images")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Gagal upload gambar: ${error.message}`);
  const { data } = admin.storage.from("event-images").getPublicUrl(path);
  return data.publicUrl;
}

async function uploadPdf(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const path = `event-docs/${crypto.randomUUID()}.pdf`;
  const admin = await createAdminClient();
  const { error } = await admin.storage
    .from("event-images")
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(`Gagal upload PDF: ${error.message}`);
  const { data } = admin.storage.from("event-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "") || null;
  const className = String(formData.get("class_name") ?? "") || null;
  const location = String(formData.get("location") ?? "");
  const organizer = String(formData.get("organizer") ?? "");
  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;
  const lanesCount = Number(formData.get("lanes_count") ?? 6) || 6;
  const heatsPerNumber = Number(formData.get("heats_per_number") ?? 1) || 1;
  const entryFee = Number(formData.get("entry_fee") ?? 0) || 0;
  const bannerFile = formData.get("banner_image");
  const bannerUrl = bannerFile instanceof File ? await uploadBanner(bannerFile) : null;

  const pdfFile = formData.get("pdf_file");
  const pdfUrl = pdfFile instanceof File ? await uploadPdf(pdfFile) : null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("events").insert({
    name,
    description: description || null,
    category,
    class_name: className,
    location: location || null,
    organizer: organizer || null,
    start_date: startDate,
    end_date: endDate,
    lanes_count: lanesCount,
    heats_per_number: heatsPerNumber,
    entry_fee: entryFee,
    banner_url: bannerUrl,
    pdf_url: pdfUrl,
    created_by: user?.id,
    status: "draft",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/events");
  redirect("/events");
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const bannerFile = formData.get("banner_image");
  const removeBanner = String(formData.get("remove_banner") ?? "") === "1";
  const hasBannerFile = bannerFile instanceof File && bannerFile.size > 0;

  let bannerUrl: string | null = null;
  if (hasBannerFile) {
    bannerUrl = await uploadBanner(bannerFile);
  }
  if (!hasBannerFile && !removeBanner) {
    const { data: existing } = await supabase
      .from("events")
      .select("banner_url, pdf_url")
      .eq("id", id)
      .single();
    bannerUrl = existing?.banner_url ?? null;
  }

  const pdfFile = formData.get("pdf_file");
  const removePdf = String(formData.get("remove_pdf") ?? "") === "1";
  const hasPdfFile = pdfFile instanceof File && pdfFile.size > 0;

  let pdfUrl: string | null = null;
  if (hasPdfFile) {
    pdfUrl = await uploadPdf(pdfFile);
  }
  if (!hasPdfFile && !removePdf) {
    const { data: existing } = await supabase
      .from("events")
      .select("pdf_url")
      .eq("id", id)
      .single();
    pdfUrl = existing?.pdf_url ?? null;
  }

  const { error } = await supabase
    .from("events")
    .update({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      category: String(formData.get("category") ?? "") || null,
      class_name: String(formData.get("class_name") ?? "") || null,
      location: String(formData.get("location") ?? ""),
      organizer: String(formData.get("organizer") ?? ""),
      start_date: String(formData.get("start_date") ?? "") || null,
      end_date: String(formData.get("end_date") ?? "") || null,
      lanes_count: Number(formData.get("lanes_count") ?? 6) || 6,
      heats_per_number: Number(formData.get("heats_per_number") ?? 1) || 1,
      entry_fee: Number(formData.get("entry_fee") ?? 0) || 0,
      banner_url: bannerUrl,
      pdf_url: pdfUrl,
      status: String(formData.get("status") ?? "draft"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/events/${id}`);
  revalidatePath(`/event/${id}`);
  redirect(`/events/${id}`);
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/events");
  redirect("/events");
}
