import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, clubs(id, name)")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: profile });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, birth_date, gender, phone, address, city, province, postal_code } = body;

  if (!full_name) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi" }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name,
      birth_date: birth_date || null,
      gender: gender || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      province: province || null,
      postal_code: postal_code || null,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}