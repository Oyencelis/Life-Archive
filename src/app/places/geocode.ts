"use server";

import { requireSession } from "@/lib/require-session";

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

// Proxied server-side (rather than called from the browser) so we can send
// a proper identifying User-Agent, per Nominatim's usage policy —
// https://operations.osmfoundation.org/policies/nominatim/ — which browsers
// don't let client-side fetch/XHR override.
export async function searchPlaceLocation(query: string): Promise<GeocodeResult[]> {
  await requireSession();

  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "life-archive-personal-app (self-hosted, single-user)",
        "Accept-Language": "en",
      },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}
