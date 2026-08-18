import { NextResponse, type NextRequest } from "next/server";

const BASE_URL = "https://rajaongkir.komerce.id/api/v1/destination/domestic-destination";
const MAX_LIMIT = 20;

type KomerceDestination = {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
};

export async function GET(request: NextRequest) {
  const search = (request.nextUrl.searchParams.get("search") ?? "").trim();
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 10);

  if (!search) {
    return NextResponse.json({ data: [] });
  }

  const limit = Math.min(Math.max(limitRaw, 1), MAX_LIMIT);
  const apiKey = process.env.RAJAONGKIR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RAJAONGKIR_API_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}?search=${encodeURIComponent(search)}&limit=${limit}&offset=0`,
      { headers: { key: apiKey }, cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: res.status });
    }

    const json = (await res.json()) as { data?: KomerceDestination[] };
    const data = (json.data ?? []).map((d) => ({
      id: d.id,
      label: d.label,
      province_name: d.province_name,
      city_name: d.city_name,
      district_name: d.district_name,
      subdistrict_name: d.subdistrict_name,
      zip_code: d.zip_code,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 502 });
  }
}
