import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * GET /api/dashboard/reports/activity-csv
 * Organization-wide activity / audit log as CSV (append-only events you own).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("activity_log")
    .select(
      "id, created_at, full_name, action_type, repo_owner, repo_name, details",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10_000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "id",
    "created_at",
    "full_name",
    "action_type",
    "repo_owner",
    "repo_name",
    "details_json",
  ].join(",");

  const lines = (rows ?? []).map((r) =>
    [
      csvEscape(r.id),
      csvEscape(r.created_at ?? ""),
      csvEscape(r.full_name ?? ""),
      csvEscape(r.action_type ?? ""),
      csvEscape(r.repo_owner ?? ""),
      csvEscape(r.repo_name ?? ""),
      csvEscape(JSON.stringify(r.details ?? {})),
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ownbase-activity-audit-${stamp}.csv"`,
    },
  });
}
