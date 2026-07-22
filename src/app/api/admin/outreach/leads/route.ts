import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { getOutreachStats, listEscalations, listLeads } from "@/lib/outreach/db";
import { isOutreachTableMissing } from "@/lib/outreach/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const track = searchParams.get("track") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const [leadsResult, stats, escalations] = await Promise.all([
      listLeads({ status, track, search, limit: 150 }),
      getOutreachStats(),
      listEscalations(40),
    ]);

    if (leadsResult.missingTable || stats.missingTable) {
      return NextResponse.json({
        leads: [],
        stats,
        escalations: [],
        missingTable: true,
        message:
          "Apply migration supabase/migrations/20260713180000_outreach_leads.sql then retry.",
      });
    }

    if (leadsResult.error) {
      return NextResponse.json({ error: leadsResult.error }, { status: 500 });
    }

    return NextResponse.json({
      leads: leadsResult.leads,
      stats,
      escalations: escalations.messages,
      missingTable: false,
    });
  } catch (err) {
    console.error("[admin/outreach/leads GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string | null;
      phone?: string | null;
      category?: string | null;
      address?: string | null;
      website_url?: string | null;
      track?: "website_build" | "ownbase";
      notes?: string | null;
      business_summary?: string | null;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const website = body.website_url?.trim() || null;
    const track =
      body.track ?? (website ? "ownbase" : "website_build");

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("outreach_leads")
      .insert({
        name,
        email: body.email?.trim().toLowerCase() || null,
        phone: body.phone?.trim() || null,
        category: body.category?.trim() || null,
        address: body.address?.trim() || null,
        website_url: website,
        track,
        notes: body.notes?.trim() || null,
        business_summary: body.business_summary?.trim() || null,
        source: "manual",
        status: body.email?.trim() ? "enriched" : "new",
      })
      .select("*")
      .single();

    if (error) {
      if (isOutreachTableMissing(error)) {
        return NextResponse.json(
          {
            error: "Outreach tables missing. Apply migration 20260713180000_outreach_leads.sql",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error("[admin/outreach/leads POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      id?: string;
      email?: string | null;
      status?: string;
      notes?: string | null;
      phone?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.email !== undefined) {
      updates.email = body.email?.trim().toLowerCase() || null;
      if (updates.email) updates.status = "enriched";
    }
    if (body.status) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("outreach_leads")
      .update(updates)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error("[admin/outreach/leads PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
