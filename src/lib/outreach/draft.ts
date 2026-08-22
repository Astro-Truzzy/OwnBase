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
      ? `You write short, friendly outreach emails offering to help a local business get a much better website.
Rules:
- Plain text only (no markdown, no HTML).
- 120-180 words max.
- Write with a warm, conversational tone. Sound like a helpful person reaching out, not a generic marketing bot.
- Use the business name, category, address, website URL, and any summary notes to make the message feel specific.
- If a website URL is available, mention it naturally as a starting point and explain how a cleaner website can help customers understand their services.
- If no website URL is available, say you can help them build a clearer online presence so more local customers can find them.
- If business summary notes are present, mention the business offering or product in a simple, useful way.
- Avoid vague phrases like "leverage", "synergy", or "cutting-edge".
- Do NOT invent prices, case studies, or fake personal connections.
- End with a gentle invitation to reply if they'd like a quick conversation.
- Sign off as ${sender}.
- Include a one-line unsubscribe note: "If this isn't relevant, reply STOP and I won't email again."
Return valid JSON only: {"subject":"...","body_text":"..."}`
      : `You write short, friendly outreach emails for business owners who already have a website.
OwnBase helps business owners keep ownership and visibility over their website or app after a contractor builds it — so they avoid access problems, handoff confusion, and one-person dependency.
Rules:
- Plain text only (no markdown, no HTML).
- 120-180 words max.
- Write with a warm, conversational tone. Sound like a real person offering a practical next step.
- Use the business name, category, address, website URL, and any summary notes to make the message feel specific and grounded.
- If the website URL is available, reference it naturally and point out why keeping control of the site matters.
- If the website URL is not available, explain the value of having code and access under the business's control.
- If business notes are present, mention the business product, audience, or service in a simple way.
- Avoid vague, generic phrases like "synergy" or "disruptive." Keep it honest and human.
- Do NOT invent prices, case studies, or fake personal connections.
- End with a gentle invitation to reply if they'd like to learn more.
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
