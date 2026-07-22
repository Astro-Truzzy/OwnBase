import { NextResponse } from "next/server";
import { suppressEmail } from "@/lib/outreach/db";
import { triageInboundReply } from "@/lib/outreach/draft";
import {
  extractEmailAddress,
  fetchReceivedEmail,
  htmlToPlainText,
  sendOutreachEmail,
} from "@/lib/outreach/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Resend inbound webhook: email.received
 * Configure in Resend → Webhooks → POST /api/webhooks/resend/inbound
 * Optional: RESEND_WEBHOOK_SECRET (svix) for signature verification.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    try {
      const { Webhook } = await import("svix");
      const wh = new Webhook(secret);
      wh.verify(rawBody, {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      });
    } catch (err) {
      console.error("[resend/inbound] webhook verify failed", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: {
    type?: string;
    data?: {
      email_id?: string;
      from?: string;
      to?: string[];
      subject?: string;
    };
  };

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type && payload.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  const emailId = payload.data?.email_id;
  if (!emailId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  try {
    const received = await fetchReceivedEmail(emailId);
    const fromEmail =
      extractEmailAddress(received.from) ||
      extractEmailAddress(payload.data?.from ?? "") ||
      null;

    if (!fromEmail) {
      return NextResponse.json({ ok: true, skipped: "no from email" });
    }

    const bodyText =
      received.text?.trim() ||
      (received.html ? htmlToPlainText(received.html) : "") ||
      "";

    const admin = createAdminClient();
    const { data: lead } = await admin
      .from("outreach_leads")
      .select("*")
      .ilike("email", fromEmail)
      .maybeSingle();

    if (!lead) {
      // Store unmatched inbound as orphan note via suppressions? Skip quietly.
      console.warn("[resend/inbound] no lead for", fromEmail);
      return NextResponse.json({ ok: true, matched: false });
    }

    const triage = await triageInboundReply({
      businessName: lead.name,
      track: lead.track,
      originalSubject: null,
      replySubject: received.subject ?? payload.data?.subject ?? null,
      replyBody: bodyText,
    });

    const { data: inbound } = await admin
      .from("outreach_messages")
      .insert({
        lead_id: lead.id,
        direction: "inbound",
        channel: "email",
        subject: received.subject ?? payload.data?.subject ?? null,
        body_text: bodyText || "(empty body)",
        body_html: received.html,
        status: "received",
        provider_message_id: emailId,
        intent: triage.intent,
        needs_human: triage.needs_human,
        triage_notes: triage.triage_notes,
        auto_reply_text: triage.auto_reply_text,
        raw: { webhook: payload.data, received },
      })
      .select("*")
      .single();

    let leadStatus = "replied";
    if (triage.intent === "unsubscribe" || triage.intent === "not_interested") {
      leadStatus = "unsubscribed";
      await suppressEmail(fromEmail, triage.intent);
    } else if (triage.needs_human) {
      leadStatus = "escalated";
    }

    await admin
      .from("outreach_leads")
      .update({ status: leadStatus })
      .eq("id", lead.id);

    // Safe auto-replies only (never for pricing/negotiate)
    if (
      triage.auto_reply_text &&
      !triage.needs_human &&
      triage.intent !== "pricing" &&
      triage.intent !== "negotiate" &&
      triage.intent !== "out_of_office"
    ) {
      try {
        const subject = received.subject?.startsWith("Re:")
          ? received.subject
          : `Re: ${received.subject || lead.name}`;
        const sent = await sendOutreachEmail({
          to: fromEmail,
          subject,
          text: triage.auto_reply_text,
        });
        await admin.from("outreach_messages").insert({
          lead_id: lead.id,
          direction: "outbound",
          channel: "email",
          subject,
          body_text: triage.auto_reply_text,
          status: "auto_replied",
          resend_email_id: sent.id,
        });
        if (inbound) {
          await admin
            .from("outreach_messages")
            .update({ status: "auto_replied" })
            .eq("id", inbound.id);
        }
      } catch (err) {
        console.error("[resend/inbound] auto-reply failed", err);
      }
    }

    return NextResponse.json({
      ok: true,
      matched: true,
      leadId: lead.id,
      intent: triage.intent,
      needsHuman: triage.needs_human,
    });
  } catch (err) {
    console.error("[resend/inbound]", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
