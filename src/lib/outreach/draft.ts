import OpenAI from "openai";
import type { OutreachTrack } from "./types";

const MODEL = "gpt-4o-mini";

export async function generateOutreachDraft(input: {
  track: OutreachTrack;
  businessName: string;
  category?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  businessSummary?: string | null;
  senderName?: string;
}): Promise<{ subject: string; body_text: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const sender = input.senderName?.trim() || "the OwnBase team";
  const client = new OpenAI({ apiKey });

  const system =
    input.track === "website_build"
      ? `You write short, professional cold emails offering to build a custom website for a local business that appears to lack a proper website.
Rules:
- Plain text only (no markdown, no HTML).
- 120-180 words max.
- Warm, specific, not pushy. No fake urgency.
- Reference their business type/location when known.
- Offer to build a fully functional website to improve reach and credibility.
- Do NOT invent prices, case studies, or fake personal connections.
- End with a soft CTA (reply if interested / quick call).
- Sign off as ${sender}.
- Include a one-line unsubscribe note: "If this isn't relevant, reply STOP and I won't email again."
Return valid JSON only: {"subject":"...","body_text":"..."}`
      : `You write short, professional cold emails recommending OwnBase to business owners who already have a website.
OwnBase helps business owners keep ownership and visibility of their software/code when contractors build sites/apps — "Your Code. Your Business. Your Control."
Rules:
- Plain text only (no markdown, no HTML).
- 120-180 words max.
- Warm, specific, not pushy.
- Reference their existing site when known.
- Explain OwnBase briefly in business language (ownership, visibility, handoffs) — not engineering jargon.
- Soft CTA to reply or learn more.
- Sign off as ${sender}.
- Include: "If this isn't relevant, reply STOP and I won't email again."
Return valid JSON only: {"subject":"...","body_text":"..."}`;

  const user = JSON.stringify({
    businessName: input.businessName,
    category: input.category ?? null,
    address: input.address ?? null,
    websiteUrl: input.websiteUrl ?? null,
    notes: input.businessSummary ?? null,
  });

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: 600,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { subject?: string; body_text?: string };
  try {
    parsed = JSON.parse(raw) as { subject?: string; body_text?: string };
  } catch {
    throw new Error("Failed to parse outreach draft JSON from model");
  }

  const subject = parsed.subject?.trim();
  const body_text = parsed.body_text?.trim();
  if (!subject || !body_text) {
    throw new Error("Model returned incomplete draft");
  }

  return { subject, body_text };
}

export async function triageInboundReply(input: {
  businessName: string;
  track: OutreachTrack;
  originalSubject?: string | null;
  replySubject?: string | null;
  replyBody: string;
}): Promise<{
  intent:
    | "interested"
    | "not_interested"
    | "question"
    | "pricing"
    | "negotiate"
    | "unsubscribe"
    | "out_of_office"
    | "other";
  needs_human: boolean;
  triage_notes: string;
  auto_reply_text: string | null;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      intent: "other",
      needs_human: true,
      triage_notes: "OPENAI_API_KEY missing — escalate to human",
      auto_reply_text: null,
    };
  }

  const client = new OpenAI({ apiKey });
  const system = `You triage inbound replies to cold outreach emails.
Classify intent as one of: interested, not_interested, question, pricing, negotiate, unsubscribe, out_of_office, other.

Escalation rules (needs_human = true):
- pricing, negotiate, or any bargaining about cost/scope/timeline
- interested with complex asks
- anything unclear or potentially legal/complaint
- question you cannot safely answer with a short canned reply

Auto-reply rules (auto_reply_text):
- not_interested or unsubscribe: brief polite acknowledgment that you'll stop contacting them. Plain text. No markdown.
- out_of_office: null (do not reply)
- simple interested ("yes tell me more"): short acknowledgment that a human will follow up soon. Plain text.
- pricing/negotiate: null (human will reply)
- question: only if trivial (e.g. "who is this?") — otherwise null and needs_human true

Return JSON only:
{"intent":"...","needs_human":true|false,"triage_notes":"one sentence","auto_reply_text":"string or null"}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          businessName: input.businessName,
          track: input.track,
          originalSubject: input.originalSubject ?? null,
          replySubject: input.replySubject ?? null,
          replyBody: input.replyBody.slice(0, 4000),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as {
      intent?: string;
      needs_human?: boolean;
      triage_notes?: string;
      auto_reply_text?: string | null;
    };

    const allowed = new Set([
      "interested",
      "not_interested",
      "question",
      "pricing",
      "negotiate",
      "unsubscribe",
      "out_of_office",
      "other",
    ]);
    const intent = allowed.has(parsed.intent ?? "")
      ? (parsed.intent as
          | "interested"
          | "not_interested"
          | "question"
          | "pricing"
          | "negotiate"
          | "unsubscribe"
          | "out_of_office"
          | "other")
      : "other";

    const forceHuman =
      intent === "pricing" || intent === "negotiate" || intent === "other";

    return {
      intent,
      needs_human: forceHuman || Boolean(parsed.needs_human),
      triage_notes: parsed.triage_notes?.trim() || "Triaged",
      auto_reply_text: parsed.auto_reply_text?.trim() || null,
    };
  } catch {
    return {
      intent: "other",
      needs_human: true,
      triage_notes: "Failed to parse triage JSON — escalate",
      auto_reply_text: null,
    };
  }
}
