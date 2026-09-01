import { createHash, createHmac } from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLogRow } from "@/lib/db/types";
import {
  buildUnifiedTimeline,
  filterUnifiedTimeline,
  UNIFIED_CATEGORY_LABELS,
  type UnifiedActivityFilters,
} from "@/lib/activity/unified-timeline";

export const dynamic = "force-dynamic";

const ROW_LIMIT = 10_000;

// PDF layout
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 44;
const LINE_HEIGHT = 12;
const BODY_SIZE = 8.5;

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * GET /api/dashboard/reports/audit-export?format=csv|pdf
 *
 * Exports the recorded access/audit trail with the same filters the Activity
 * page uses, plus a tamper-evident manifest: a SHA-256 digest of the payload
 * and, when AUDIT_EXPORT_SIGNING_SECRET is configured, an HMAC-SHA256 signature
 * over that digest. Verifying a file later means recomputing the digest of the
 * rows and comparing.
 *
 * Covers stored Ownbase events only — live Git commits are shown in the app but
 * are not part of the audit record, since the provider is their source of truth.
 * The existing activity-csv and compliance-pack routes are untouched.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const filters: UnifiedActivityFilters = {
    repo: url.searchParams.get("repo") ?? "",
    actor: url.searchParams.get("actor") ?? "",
    category: url.searchParams.get("category") ?? "",
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
    query: url.searchParams.get("q") ?? "",
  };

  const { data: rows, error } = await supabase
    .from("activity_log")
    .select(
      "id, user_id, repo_owner, repo_name, full_name, action_type, details, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reuse the view's own builder + filter so an export always matches what the
  // owner saw on screen.
  const items = filterUnifiedTimeline(
    buildUnifiedTimeline({
      auditRows: (rows ?? []) as ActivityLogRow[],
      commits: [],
    }),
    filters,
  );

  const generatedAt = new Date().toISOString();
  const appliedFilters = Object.entries(filters)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${value}`);
  const filterLabel =
    appliedFilters.length > 0 ? appliedFilters.join(" ") : "none";

  // ── Canonical payload: what the digest is computed over ─────────────────────
  const canonicalRows = items.map((item) =>
    [
      item.timestamp,
      item.categoryKey,
      UNIFIED_CATEGORY_LABELS[item.category],
      item.fullName ?? "",
      item.actor ?? "",
      item.label,
      item.description ?? "",
    ].join(""),
  );
  const canonical = canonicalRows.join("");

  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");

  const signingSecret = process.env.AUDIT_EXPORT_SIGNING_SECRET?.trim();
  const signature = signingSecret
    ? createHmac("sha256", signingSecret).update(digest, "utf8").digest("hex")
    : null;

  const stamp = generatedAt.slice(0, 10);
  const headers: Record<string, string> = {
    "X-Ownbase-Content-Digest": `sha-256=${digest}`,
    "X-Ownbase-Row-Count": String(items.length),
    "X-Ownbase-Generated-At": generatedAt,
    "Cache-Control": "no-store",
  };
  if (signature) headers["X-Ownbase-Signature"] = `hmac-sha256=${signature}`;

  if (format === "csv") {
    const header = [
      "timestamp",
      "action_type",
      "category",
      "repository",
      "developer",
      "event",
      "detail",
    ].join(",");

    const lines = items.map((item) =>
      [
        csvEscape(item.timestamp),
        csvEscape(item.categoryKey),
        csvEscape(UNIFIED_CATEGORY_LABELS[item.category]),
        csvEscape(item.fullName ?? ""),
        csvEscape(item.actor ?? ""),
        csvEscape(item.label),
        csvEscape(item.description ?? ""),
      ].join(","),
    );

    // Manifest as trailing comment rows so the CSV still parses cleanly.
    const manifest = [
      "",
      `# Ownbase audit export`,
      `# generated_at: ${generatedAt}`,
      `# rows: ${items.length}`,
      `# filters: ${filterLabel}`,
      `# content_digest_sha256: ${digest}`,
      signature
        ? `# signature_hmac_sha256: ${signature}`
        : `# signature: not configured (digest only)`,
      `# digest_canonical_form: fields joined by U+001F, rows by U+001E, UTF-8`,
      `# digest_field_order: timestamp,action_type,category,repository,developer,event,detail`,
      `# note: covers recorded access events only; live code activity is excluded`,
    ];

    const csv = [header, ...lines, ...manifest].join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ownbase-audit-${stamp}.csv"`,
      },
    });
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const write = (
    text: string,
    options?: { bold?: boolean; size?: number; gray?: number },
  ) => {
    const size = options?.size ?? BODY_SIZE;
    if (y - LINE_HEIGHT < MARGIN + 30) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    const gray = options?.gray ?? 0.15;
    page.drawText(text.slice(0, 130), {
      x: MARGIN,
      y,
      size,
      font: options?.bold ? helveticaBold : helvetica,
      color: rgb(gray, gray, gray),
    });
    y -= LINE_HEIGHT;
  };

  write("Ownbase — Access & Audit Export", { bold: true, size: 14 });
  y -= 6;
  write(`Generated: ${generatedAt}`, { gray: 0.4 });
  write(`Entries: ${items.length}`, { gray: 0.4 });
  write(`Filters: ${filterLabel}`, { gray: 0.4 });
  y -= 10;
  write("Recorded access events. Live code activity is excluded.", { gray: 0.4 });
  y -= 14;

  write("Timestamp (UTC)          Event / Repository / Developer", {
    bold: true,
  });
  y -= 4;

  if (items.length === 0) {
    write("No entries match the selected filters.", { gray: 0.45 });
  }

  for (const item of items) {
    const when = item.timestamp.replace("T", " ").slice(0, 19);
    write(`${when}   ${item.label}`);
    const sub = [
      item.fullName ? `repo: ${item.fullName}` : null,
      item.actor ? `developer: ${item.actor}` : null,
      item.description,
    ]
      .filter(Boolean)
      .join(" · ");
    if (sub) write(`                     ${sub}`, { gray: 0.42 });
  }

  // Manifest page — kept separate so it is unmistakable.
  page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  y = PAGE_HEIGHT - MARGIN;
  write("Integrity manifest", { bold: true, size: 12 });
  y -= 8;
  write(`Generated at: ${generatedAt}`);
  write(`Entry count: ${items.length}`);
  write(`Filters applied: ${filterLabel}`);
  y -= 8;
  write("SHA-256 digest of the exported entries:", { bold: true });
  write(digest.slice(0, 64));
  y -= 8;
  if (signature) {
    write("HMAC-SHA256 signature over that digest:", { bold: true });
    write(signature.slice(0, 64));
  } else {
    write("Signature: not configured on this deployment.", { gray: 0.42 });
    write(
      "Set AUDIT_EXPORT_SIGNING_SECRET to add an HMAC signature to exports.",
      { gray: 0.42 },
    );
  }
  y -= 10;
  write("Canonical form the digest covers:", { bold: true });
  write(
    "Fields joined by U+001F, rows joined by U+001E, in the order below, UTF-8.",
    { gray: 0.42 },
  );
  write(
    "timestamp, action_type, category, repository, developer, event, detail",
    { gray: 0.42 },
  );
  y -= 6;
  write(
    "To verify: rebuild that string from the entries and compare its SHA-256.",
    { gray: 0.42 },
  );

  const bytes = await doc.save();

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ownbase-audit-${stamp}.pdf"`,
      "Content-Length": String(bytes.length),
    },
  });
}
