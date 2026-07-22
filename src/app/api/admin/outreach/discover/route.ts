import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { classifyTrack, discoverPlaces } from "@/lib/outreach/discovery";
import { findEmailForDomain } from "@/lib/outreach/enrich";
import { isOutreachTableMissing } from "@/lib/outreach/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      query?: string;
      lat?: number;
      lng?: number;
      radiusMeters?: number;
      maxResults?: number;
      enrichEmails?: boolean;
    };

    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json(
        { error: "query is required (e.g. \"dentists in Ikeja Lagos\")" },
        { status: 400 },
      );
    }

    const places = await discoverPlaces({
      query,
      locationBias:
        typeof body.lat === "number" && typeof body.lng === "number"
          ? {
              lat: body.lat,
              lng: body.lng,
              radiusMeters: body.radiusMeters,
            }
          : undefined,
      maxResults: body.maxResults ?? 20,
    });

    const admin = createAdminClient();

    const placeIds = places.map((p) => p.google_place_id);
    const existing = new Set<string>();

    if (placeIds.length > 0) {
      const { data: existingRows, error: existingError } = await admin
        .from("outreach_leads")
        .select("google_place_id")
        .in("google_place_id", placeIds);

      if (existingError) {
        if (isOutreachTableMissing(existingError)) {
          return NextResponse.json(
            {
              error:
                "Outreach tables missing. Apply migration 20260713180000_outreach_leads.sql",
            },
            { status: 503 },
          );
        }
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      for (const r of existingRows ?? []) {
        if (r.google_place_id) existing.add(r.google_place_id as string);
      }
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const place of places) {
      if (existing.has(place.google_place_id)) {
        skipped += 1;
        continue;
      }

      const track = classifyTrack(place.website_url);
      let email: string | null = null;

      if (body.enrichEmails !== false && place.website_url && track === "ownbase") {
        try {
          const found = await findEmailForDomain(place.website_url);
          email = found.email;
        } catch {
          // enrichment is best-effort
        }
      }

      const { error } = await admin.from("outreach_leads").insert({
        google_place_id: place.google_place_id,
        name: place.name,
        category: place.category,
        address: place.address,
        phone: place.phone,
        website_url: place.website_url,
        google_maps_uri: place.google_maps_uri,
        lat: place.lat,
        lng: place.lng,
        track,
        email,
        source: "google_places",
        status: email ? "enriched" : "new",
        raw: place.raw,
      });

      if (error) {
        if (isOutreachTableMissing(error)) {
          return NextResponse.json(
            {
              error:
                "Outreach tables missing. Apply migration 20260713180000_outreach_leads.sql",
            },
            { status: 503 },
          );
        }
        if (error.code === "23505") {
          skipped += 1;
          continue;
        }
        errors.push(`${place.name}: ${error.message}`);
        continue;
      }
      created += 1;
    }

    return NextResponse.json({
      discovered: places.length,
      created,
      skipped,
      errors: errors.length ? errors : undefined,
      sample: places.slice(0, 5).map((p) => ({
        name: p.name,
        track: classifyTrack(p.website_url),
        website_url: p.website_url,
        address: p.address,
      })),
    });
  } catch (err) {
    console.error("[admin/outreach/discover]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("GOOGLE_PLACES_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
