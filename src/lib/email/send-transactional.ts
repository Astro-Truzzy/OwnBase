/**
 * Minimal transactional email sender for operational notices (access expiry,
 * continuity alerts).
 *
 * Non-throwing by design: when `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are unset
 * it reports `skipped` instead of failing, so a cron that calls it degrades to a
 * no-op rather than erroring — the same posture as the existing report-digest
 * route. Deliberately separate from `sendOutreachEmail`, which is
 * marketing-scoped, throws on missing config, and carries outreach-specific
 * from/reply-to fallbacks.
 */

export type SendTransactionalResult = {
  sent: boolean;
  /** True when email is not configured — not an error condition. */
  skipped: boolean;
  error?: string;
  id?: string;
};

export function isTransactionalEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendTransactionalResult> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!resendKey || !from) {
    return { sent: false, skipped: true };
  }
  if (!opts.to?.trim()) {
    return { sent: false, skipped: false, error: "No recipient address." };
  }

  try {
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
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return {
        sent: false,
        skipped: false,
        error: `Resend ${res.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return { sent: true, skipped: false, id: data.id };
  } catch (error) {
    return {
      sent: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}
