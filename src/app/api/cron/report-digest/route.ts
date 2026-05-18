import { isReportDeliveryPreferencesTableMissing } from "@/lib/report-delivery-preferences-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/report-digest
 * Secured with Authorization: Bearer CRON_SECRET.
 * When RESEND_API_KEY and RESEND_FROM_EMAIL are set, sends digest emails to users
 * who enabled scheduled reports. Otherwise records a no-op response.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Service role not configured", sent: 0 },
      { status: 503 },
    );
  }

  const { data: prefs, error } = await admin
    .from("report_delivery_preferences")
    .select("user_id, destination_email, cadence, last_sent_at")
    .eq("enabled", true);

  if (error) {
    if (isReportDeliveryPreferencesTableMissing(error)) {
      return NextResponse.json({
        sent: 0,
        attempted: 0,
        message:
          "report_delivery_preferences table missing; apply Supabase migration 20260516140000_report_delivery_preferences.sql.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resendKey || !from) {
    return NextResponse.json({
      sent: 0,
      recipients: prefs?.length ?? 0,
      message:
        "RESEND_API_KEY and RESEND_FROM_EMAIL are not set; preferences are stored but no email was sent.",
    });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const row of prefs ?? []) {
    const uid = row.user_id as string;
    const to = row.destination_email as string;

    const [{ count: tracked }, { count: summaries }] = await Promise.all([
      admin
        .from("tracked_repos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid),
      admin
        .from("repo_summaries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid),
    ]);

    const text = [
      "Ownbase — scheduled portfolio digest",
      "",
      `Tracked repositories: ${tracked ?? 0}`,
      `Repositories with an AI overview on file: ${summaries ?? 0}`,
      "",
      "Open your dashboard to generate summaries, export handoff PDFs, and download compliance packs.",
      "",
      `Cadence: ${row.cadence as string}`,
    ].join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Ownbase portfolio digest",
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      errors.push(`${to}: ${errText}`);
      continue;
    }

    sent += 1;
    await admin
      .from("report_delivery_preferences")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("user_id", uid);
  }

  return NextResponse.json({
    sent,
    attempted: prefs?.length ?? 0,
    errors: errors.length ? errors : undefined,
  });
}
