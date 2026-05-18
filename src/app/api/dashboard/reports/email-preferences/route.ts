import { isReportDeliveryPreferencesTableMissing } from "@/lib/report-delivery-preferences-schema";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Cadence = "weekly" | "monthly";

function isCadence(v: unknown): v is Cadence {
  return v === "weekly" || v === "monthly";
}

/**
 * GET /api/dashboard/reports/email-preferences
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("report_delivery_preferences")
    .select("enabled, cadence, destination_email, last_sent_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isReportDeliveryPreferencesTableMissing(error)) {
      return NextResponse.json({
        enabled: false,
        cadence: "weekly" as const,
        destination_email: user.email ?? "",
        last_sent_at: null,
        updated_at: null,
        schemaNote:
          "Report delivery table is not deployed yet. Apply migration 20260516140000_report_delivery_preferences.sql to Supabase.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      enabled: false,
      cadence: "weekly" as const,
      destination_email: user.email ?? "",
      last_sent_at: null,
      updated_at: null,
    });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/dashboard/reports/email-preferences
 * Body: { enabled: boolean, cadence?: "weekly"|"monthly", destination_email: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const enabled = Boolean(o.enabled);
  const cadence = isCadence(o.cadence) ? o.cadence : "weekly";
  const destination_email = String(o.destination_email ?? "").trim();

  if (!destination_email || !destination_email.includes("@")) {
    return NextResponse.json(
      { error: "A valid destination email is required." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("report_delivery_preferences").upsert(
    {
      user_id: user.id,
      enabled,
      cadence,
      destination_email,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    if (isReportDeliveryPreferencesTableMissing(error)) {
      return NextResponse.json(
        {
          error:
            "Report scheduling is unavailable until the report_delivery_preferences migration is applied to your database.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
