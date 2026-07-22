import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { generateOutreachDraft } from "@/lib/outreach/draft";
import { isOutreachTableMissing } from "@/lib/outreach/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { leadId?: string; senderName?: string };
    if (!body.leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: lead, error: leadError } = await admin
      .from("outreach_leads")
      .select("*")
      .eq("id", body.leadId)
      .single();

    if (leadError || !lead) {
      if (leadError && isOutreachTableMissing(leadError)) {
        return NextResponse.json(
          { error: "Outreach tables missing. Apply migration first." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.status === "unsubscribed" || lead.status === "bounced") {
      return NextResponse.json(
        { error: `Cannot draft for lead status: ${lead.status}` },
        { status: 400 },
      );
    }

    const draft = await generateOutreachDraft({
      track: lead.track,
      businessName: lead.name,
      category: lead.category,
      address: lead.address,
      websiteUrl: lead.website_url,
      businessSummary: lead.business_summary,
      senderName: body.senderName,
    });

    // Replace any existing draft for this lead
    await admin
      .from("outreach_messages")
      .delete()
      .eq("lead_id", lead.id)
      .eq("direction", "outbound")
      .eq("status", "draft");

    const { data: message, error: msgError } = await admin
      .from("outreach_messages")
      .insert({
        lead_id: lead.id,
        direction: "outbound",
        channel: "email",
        subject: draft.subject,
        body_text: draft.body_text,
        status: "draft",
      })
      .select("*")
      .single();

    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    await admin
      .from("outreach_leads")
      .update({ status: "drafted" })
      .eq("id", lead.id);

    return NextResponse.json({ message, leadId: lead.id });
  } catch (err) {
    console.error("[admin/outreach/draft]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  const leadId = new URL(request.url).searchParams.get("leadId");
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("outreach_messages")
    .select("*")
    .eq("lead_id", leadId)
    .eq("direction", "outbound")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      messageId?: string;
      subject?: string;
      body_text?: string;
    };
    if (!body.messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body_text !== undefined) updates.body_text = body.body_text;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("outreach_messages")
      .update(updates)
      .eq("id", body.messageId)
      .eq("status", "draft")
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: data });
  } catch (err) {
    console.error("[admin/outreach/draft PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
