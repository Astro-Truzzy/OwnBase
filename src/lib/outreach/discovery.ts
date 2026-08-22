import type { DiscoveredPlace } from "./types";

/**
 * Discover local businesses via Google Places API (Text Search / New).
 * Requires GOOGLE_PLACES_API_KEY with Places API (New) enabled.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 */
export async function discoverPlaces(opts: {
  query: string;
  locationBias?: { lat: number; lng: number; radiusMeters?: number };
  maxResults?: number;
}): Promise<DiscoveredPlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not set. Add it to .env or create leads manually.",
    );
  }

  const maxResults = Math.min(Math.max(opts.maxResults ?? 20, 1), 40);
  const body: Record<string, unknown> = {
    textQuery: opts.query,
    pageSize: Math.min(maxResults, 20),
  };

  if (opts.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: opts.locationBias.lat,
          longitude: opts.locationBias.lng,
        },
        radius: opts.locationBias.radiusMeters ?? 15000,
      },
    };
  }

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.googleMapsUri",
    "places.types",
    "places.businessStatus",
  ].join(",");

  const results: DiscoveredPlace[] = [];
  let pageToken: string | undefined;

  while (results.length < maxResults) {
    const pageBody = pageToken ? { ...body, pageToken } : body;
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(pageBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (
        res.status === 403 &&
        (errText.includes("API_KEY_HTTP_REFERRER_BLOCKED") ||
          errText.includes("referer <empty>"))
      ) {
        throw new Error(
          "Google Places API key is restricted to HTTP referrers, but discovery runs on the server (no referrer). In Google Cloud Console → Credentials, edit this key and set Application restrictions to None or IP addresses — not Websites.",
        );
      }
      throw new Error(`Google Places error (${res.status}): ${errText.slice(0, 400)}`);
    }

    const data = (await res.json()) as {
      places?: Array<Record<string, unknown>>;
      nextPageToken?: string;
    };

    for (const place of data.places ?? []) {
      const id = typeof place.id === "string" ? place.id.replace(/^places\//, "") : null;
      if (!id) continue;

      const displayName = place.displayName as { text?: string } | undefined;
      const location = place.location as { latitude?: number; longitude?: number } | undefined;
      const types = Array.isArray(place.types)
        ? (place.types as string[]).filter((t) => t !== "point_of_interest" && t !== "establishment")
        : [];

      results.push({
        google_place_id: id,
        name: displayName?.text?.trim() || "Unknown business",
        category: types[0]?.replace(/_/g, " ") ?? null,
        address: typeof place.formattedAddress === "string" ? place.formattedAddress : null,
        phone:
          (typeof place.nationalPhoneNumber === "string" && place.nationalPhoneNumber) ||
          (typeof place.internationalPhoneNumber === "string" && place.internationalPhoneNumber) ||
          null,
        website_url: typeof place.websiteUri === "string" ? place.websiteUri : null,
        google_maps_uri: typeof place.googleMapsUri === "string" ? place.googleMapsUri : null,
        lat: typeof location?.latitude === "number" ? location.latitude : null,
        lng: typeof location?.longitude === "number" ? location.longitude : null,
        raw: place,
      });

      if (results.length >= maxResults) break;
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return results;
}

export function classifyTrack(websiteUrl: string | null | undefined): "website_build" | "ownbase" {
  const url = websiteUrl?.trim();
  if (!url) return "website_build";
  // Social-only profiles still count as "no real website" for our offer
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const socialHosts = [
      "facebook.com",
      "fb.com",
      "instagram.com",
      "twitter.com",
      "x.com",
      "linkedin.com",
      "tiktok.com",
      "youtube.com",
      "wa.me",
      "api.whatsapp.com",
    ];
    if (socialHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return "website_build";
    }
  } catch {
    return "website_build";
  }
  return "ownbase";
}
