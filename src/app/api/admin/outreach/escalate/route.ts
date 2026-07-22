import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/admin/auth";
import { suppressEmail } from "@/lib/outreach/db";
import { sendOutreachEmail } from "@/lib/outreach/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Resolve an escalated inbound message: dismiss, mark closed, or send a human reply.
 */
export async function POST(request: Request) {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      messageId?: string;
      action?: "dismiss" | "close_lead" | "suppress" | "reply";
      replyText?: string;
      subject?: string;
    };

    if (!body.messageId || !body.action) {
      return NextResponse.json(
        { error: "messageId and action are required" },
        { status: 400 },
      );
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

    const { data: lead } = await admin
      .from("outreach_leads")
      .select("*")
      .eq("id", message.lead_id)
      .single();

    if (body.action === "dismiss") {
      await admin
        .from("outreach_messages")
        .update({ needs_human: false, status: "triaged" })
        .eq("id", message.id);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "close_lead") {
      await admin
        .from("outreach_messages")
        .update({ needs_human: false, status: "triaged" })
        .eq("id", message.id);
      if (lead) {
        await admin
          .from("outreach_leads")
          .update({ status: "closed" })
          .eq("id", lead.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "suppress") {
      if (lead?.email) {
        await suppressEmail(lead.email, "manual_suppress");
      }
      await admin
        .from("outreach_messages")
        .update({ needs_human: false, status: "triaged" })
        .eq("id", message.id);
      if (lead) {
        await admin
          .from("outreach_leads")
          .update({ status: "unsubscribed" })
          .eq("id", lead.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reply") {
      const to = lead?.email?.trim();
      const text = body.replyText?.trim();
      if (!to || !text) {
        return NextResponse.json(
          { error: "Lead email and replyText are required" },
          { status: 400 },
        );
      }
      const subject =
        body.subject?.trim() ||
        (message.subject?.startsWith("Re:")
          ? message.subject
          : `Re: ${message.subject || lead?.name || "your message"}`);

      const sent = await sendOutreachEmail({ to, subject, text });

      await admin.from("outreach_messages").insert({
        lead_id: message.lead_id,
        direction: "outbound",
        channel: "email",
        subject,
        body_text: text,
        status: "sent",
        resend_email_id: sent.id,
      });

      await admin
        .from("outreach_messages")
        .update({ needs_human: false, status: "triaged" })
        .eq("id", message.id);

      await admin
        .from("outreach_leads")
        .update({
          status: "replied",
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", message.lead_id);

      return NextResponse.json({ ok: true, resendEmailId: sent.id });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/outreach/escalate]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
