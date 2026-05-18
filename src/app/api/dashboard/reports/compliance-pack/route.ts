import { createClient } from "@/lib/supabase/server";
import { normalizeSummary } from "@/lib/dashboard/org-risk-assessment";
import JSZip from "jszip";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * GET /api/dashboard/reports/compliance-pack
 * ZIP: activity CSV, tracked repos CSV, summary metadata JSON, readme.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [activityRes, trackedRes, summaryRes] = await Promise.all([
    supabase
      .from("activity_log")
      .select(
        "id, created_at, full_name, action_type, repo_owner, repo_name, details",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10_000),
    supabase
      .from("tracked_repos")
      .select("full_name, repo_owner, repo_name, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("repo_summaries")
      .select("full_name, summary_json, updated_at")
      .eq("user_id", user.id),
  ]);

  if (activityRes.error) {
    return NextResponse.json(
      { error: activityRes.error.message },
      { status: 500 },
    );
  }
  if (trackedRes.error) {
    return NextResponse.json(
      { error: trackedRes.error.message },
      { status: 500 },
    );
  }
  if (summaryRes.error) {
    return NextResponse.json(
      { error: summaryRes.error.message },
      { status: 500 },
    );
  }

  const activityRows = activityRes.data ?? [];
  const trackedRows = trackedRes.data ?? [];
  const summaryRows = summaryRes.data ?? [];

  const activityHeader = [
    "id",
    "created_at",
    "full_name",
    "action_type",
    "repo_owner",
    "repo_name",
    "details_json",
  ].join(",");
  const activityCsv = [
    activityHeader,
    ...activityRows.map((r) =>
      [
        csvEscape(r.id),
        csvEscape(r.created_at ?? ""),
        csvEscape(r.full_name ?? ""),
        csvEscape(r.action_type ?? ""),
        csvEscape(r.repo_owner ?? ""),
        csvEscape(r.repo_name ?? ""),
        csvEscape(JSON.stringify(r.details ?? {})),
      ].join(","),
    ),
  ].join("\r\n");

  const trackedHeader = [
    "full_name",
    "repo_owner",
    "repo_name",
    "added_at",
  ].join(",");
  const trackedCsv = [
    trackedHeader,
    ...trackedRows.map((r) =>
      [
        csvEscape(r.full_name ?? ""),
        csvEscape(r.repo_owner ?? ""),
        csvEscape(r.repo_name ?? ""),
        csvEscape(r.added_at ?? ""),
      ].join(","),
    ),
  ].join("\r\n");

  const summariesMeta = summaryRows.map((row) => {
    const parsed = normalizeSummary(row.summary_json);
    const summaryText = parsed?.summary?.trim() ?? "";
    return {
      full_name: row.full_name,
      updated_at: row.updated_at,
      has_summary: summaryText.length > 20,
      summary_char_count: summaryText.length,
      risk_indicator_count: parsed?.riskIndicators?.length ?? 0,
      external_service_count: parsed?.externalServices?.length ?? 0,
      payment_integration_count: parsed?.paymentIntegrations?.length ?? 0,
    };
  });

  const readme = [
    "Ownbase compliance export pack",
    "==============================",
    "",
    `Generated (UTC): ${new Date().toISOString()}`,
    "This archive contains:",
    "- activity_log.csv — append-only audit events for your account",
    "- tracked_repositories.csv — repositories in your organization",
    "- summaries_metadata.json — non-secret metadata about stored AI overviews (no full summary text)",
    "",
    "Regenerate executive summaries on each repository before relying on metadata for diligence.",
  ].join("\r\n");

  const zip = new JSZip();
  const folder = zip.folder("ownbase-compliance-export");
  folder?.file("README.txt", readme);
  folder?.file("activity_log.csv", activityCsv);
  folder?.file("tracked_repositories.csv", trackedCsv);
  folder?.file(
    "summaries_metadata.json",
    JSON.stringify(summariesMeta, null, 2),
  );

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ownbase-compliance-pack-${stamp}.zip"`,
    },
  });
}
