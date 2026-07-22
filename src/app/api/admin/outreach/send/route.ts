import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { isEmailSuppressed } from "@/lib/outreach/db";
import { sendOutreachEmail } from "@/lib/outreach/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Approve and send a draft outreach email. Human-in-the-loop by design.
 */
export async function POST(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { messageId?: string };
    if (!body.messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: message, error: msgError } = await admin
      .from("outreach_messages")
      .select("*")
      .eq("id", body.messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (message.direction !== "outbound" || message.status !== "draft") {
      return NextResponse.json(
        { error: "Only outbound drafts can be sent" },
        { status: 400 },
      );
    }

    const { data: lead, error: leadError } = await admin
      .from("outreach_leads")
      .select("*")
      .eq("id", message.lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const to = lead.email?.trim().toLowerCase();
    if (!to) {
      return NextResponse.json(
        { error: "Lead has no email. Add one before sending." },
        { status: 400 },
      );
    }

    if (await isEmailSuppressed(to)) {
      await admin
        .from("outreach_leads")
        .update({ status: "unsubscribed" })
        .eq("id", lead.id);
      return NextResponse.json(
        { error: "This email is on the suppression list" },
        { status: 400 },
      );
    }

    if (["unsubscribed", "bounced", "closed"].includes(lead.status)) {
      return NextResponse.json(
        { error: `Cannot send to lead with status: ${lead.status}` },
        { status: 400 },
      );
    }

    const subject = message.subject?.trim();
    const text = message.body_text?.trim();
    if (!subject || !text) {
      return NextResponse.json({ error: "Draft subject/body required" }, { status: 400 });
    }

    let resendId: string;
    try {
      const sent = await sendOutreachEmail({ to, subject, text });
      resendId = sent.id;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Send failed";
      await admin
        .from("outreach_messages")
        .update({ status: "failed", raw: { error: errMsg } })
        .eq("id", message.id);
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    await admin
      .from("outreach_messages")
      .update({
        status: "sent",
        resend_email_id: resendId,
      })
      .eq("id", message.id);

    await admin
      .from("outreach_leads")
      .update({
        status: "sent",
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    return NextResponse.json({
      ok: true,
      resendEmailId: resendId,
      to,
      subject,
    });
  } catch (err) {
    console.error("[admin/outreach/send]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
