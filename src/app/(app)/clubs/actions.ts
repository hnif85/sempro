"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

function geoFromForm(formData: FormData) {
  const cityName = String(formData.get("loc_city_name") ?? "").trim();
  return {
    destination_id: Number(formData.get("loc_destination_id") ?? 0) || null,
    province_name: String(formData.get("loc_province_name") ?? "").trim() || null,
    city_name: cityName || null,
    district_name: String(formData.get("loc_district_name") ?? "").trim() || null,
    subdistrict_name: String(formData.get("loc_subdistrict_name") ?? "").trim() || null,
    zip_code: String(formData.get("loc_zip_code") ?? "").trim() || null,
  };
}

export async function createClub(formData: FormData) {
  const supabase = await createClient();

  const geo = geoFromForm(formData);

  const { error } = await supabase.from("clubs").insert({
    name: String(formData.get("name") ?? ""),
    pic_name: String(formData.get("pic_name") ?? "") || null,
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    city: geo.city_name || String(formData.get("city") ?? "") || null,
    school: String(formData.get("school") ?? "") || null,
    token: randomBytes(16).toString("hex"),
    ...geo,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/clubs");
  redirect("/clubs");
}

export async function updateClub(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const geo = geoFromForm(formData);

  const { error } = await supabase
    .from("clubs")
    .update({
      name: String(formData.get("name") ?? ""),
      pic_name: String(formData.get("pic_name") ?? "") || null,
      whatsapp: String(formData.get("whatsapp") ?? "") || null,
      city: geo.city_name || String(formData.get("city") ?? "") || null,
      school: String(formData.get("school") ?? "") || null,
      status: String(formData.get("status") ?? "draft"),
      ...geo,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/clubs");
  redirect("/clubs");
}

export async function deleteClub(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("clubs").delete().eq("id", id);
  revalidatePath("/clubs");
  redirect("/clubs");
}