export async function sendOutreachEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ id: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !from) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are required to send outreach email");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      reply_to: opts.replyTo || process.env.RESEND_OUTREACH_REPLY_TO || undefined,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Resend did not return an email id");
  }
  return { id: data.id };
}

export async function fetchReceivedEmail(emailId: string): Promise<{
  from: string;
  to: string[];
  subject: string | null;
  text: string | null;
  html: string | null;
}> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error("RESEND_API_KEY is required to fetch received email");
  }

  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${resendKey}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend receiving fetch failed (${res.status}): ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    from?: string;
    to?: string[];
    subject?: string;
    text?: string | null;
    html?: string | null;
  };

  return {
    from: data.from ?? "",
    to: data.to ?? [],
    subject: data.subject ?? null,
    text: data.text ?? null,
    html: data.html ?? null,
  };
}

/** Strip HTML to rough plain text when only html body is available. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function extractEmailAddress(fromHeader: string): string | null {
  const match = fromHeader.match(/<([^>]+)>/);
  const raw = (match?.[1] ?? fromHeader).trim().toLowerCase();
  if (!raw.includes("@")) return null;
  return raw;
}
