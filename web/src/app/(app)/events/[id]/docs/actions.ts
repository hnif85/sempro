"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function uploadFile(file: File, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const admin = await createAdminClient();
  const { error } = await admin.storage
    .from("event-images")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Gagal upload file: ${error.message}`);
  const { data } = admin.storage.from("event-images").getPublicUrl(path);
  return data.publicUrl;
}

function extractStoragePath(publicUrl: string): string | null {
  const marker = "/object/public/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length).split("/").slice(1).join("/");
}

export async function createDoc(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");

  const { error } = await supabase.from("event_docs").insert({
    event_id: eventId,
    media_type: String(formData.get("media_type") ?? "foto"),
    url: String(formData.get("url") ?? ""),
    caption: String(formData.get("caption") ?? "") || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/docs`);
  redirect(`/events/${eventId}/docs`);
}

export async function createPdf(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Pilih file PDF terlebih dahulu");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("Hanya file PDF yang diperbolehkan");
  }

  const url = await uploadFile(file, "event-docs");
  if (!url) throw new Error("Upload file gagal");

  const { error } = await supabase.from("event_docs").insert({
    event_id: eventId,
    media_type: "pdf",
    url,
    caption: String(formData.get("caption") ?? "") || null,
    file_name: file.name,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/events/${eventId}/docs`);
  redirect(`/events/${eventId}/docs`);
}

export async function deleteDoc(formData: FormData) {
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") ?? "");
  const id = String(formData.get("id") ?? "");

  const { data: doc } = await supabase
    .from("event_docs")
    .select("url")
    .eq("id", id)
    .single();

  if (doc?.url) {
    const path = extractStoragePath(doc.url);
    if (path) {
      const admin = await createAdminClient();
      await admin.storage.from("event-images").remove([path]);
    }
  }

  await supabase.from("event_docs").delete().eq("id", id);
  revalidatePath(`/events/${eventId}/docs`);
  redirect(`/events/${eventId}/docs`);
}
