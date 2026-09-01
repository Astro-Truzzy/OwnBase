import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/email/send-transactional";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Grants lapsing within this many days are included in the notice. */
const SOON_DAYS = 7;
/** Suppress a repeat notice for the same grant within this many days. */
const DEDUPE_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

type AccessRow = {
  id: string;
  user_id: string;
  full_name: string;
  login: string;
  access_level: string;
  expires_at: string;
};

function isRepoAccessTableMissing(error: { message?: string; code?: string }) {
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return text.includes("42p01") || text.includes("does not exist");
}

/**
 * GET /api/cron/expiring-access
 * Secured with Authorization: Bearer CRON_SECRET.
 *
 * Notifies owners about repository access that has expired or lapses within a
 * week, and records the notice in the audit log. It deliberately **does not
 * revoke anything**: revocation stays a deliberate owner action in the
 * Continuity Center, using the owner's own session token. Nothing here touches
 * stored OAuth tokens or mutates GitHub.
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
      { error: "Service role not configured", notified: 0 },
      { status: 503 },
    );
  }

  const now = Date.now();
  const soonIso = new Date(now + SOON_DAYS * DAY_MS).toISOString();

  const { data: rows, error } = await admin
    .from("repo_access")
    .select("id, user_id, full_name, login, access_level, expires_at")
    .not("expires_at", "is", null)
    .neq("access_level", "none")
    .lte("expires_at", soonIso)
    .order("expires_at", { ascending: true })
    .limit(2000);

  if (error) {
    if (isRepoAccessTableMissing(error)) {
      return NextResponse.json({
        notified: 0,
        candidates: 0,
        message:
          "repo_access table missing; apply Supabase migration 20260822120000_repo_access_model.sql.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates = (rows ?? []) as AccessRow[];
  if (candidates.length === 0) {
    return NextResponse.json({ notified: 0, candidates: 0 });
  }

  // Dedupe against the append-only audit log rather than a dedicated column:
  // an `access_expiry_notified` event for the same repo + login inside the
  // window means this grant was already reported.
  const sinceIso = new Date(now - DEDUPE_WINDOW_DAYS * DAY_MS).toISOString();
  const { data: priorNotices } = await admin
    .from("activity_log")
    .select("user_id, details, created_at")
    .eq("action_type", "access_expiry_notified")
    .gte("created_at", sinceIso)
    .limit(5000);

  const alreadyNotified = new Set<string>();
  for (const notice of priorNotices ?? []) {
    const details = (notice.details ?? {}) as Record<string, unknown>;
    const fullName =
      typeof details.full_name === "string" ? details.full_name : null;
    const login = typeof details.login === "string" ? details.login : null;
    if (fullName && login) {
      alreadyNotified.add(
        `${notice.user_id}|${fullName}|${login.toLowerCase()}`,
      );
    }
  }

  const pending = candidates.filter(
    (row) =>
      !alreadyNotified.has(
        `${row.user_id}|${row.full_name}|${row.login.toLowerCase()}`,
      ),
  );

  if (pending.length === 0) {
    return NextResponse.json({
      notified: 0,
      candidates: candidates.length,
      message: "All expiring grants were already reported in this window.",
    });
  }

  const byUser = new Map<string, AccessRow[]>();
  for (const row of pending) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  const emailConfigured = isTransactionalEmailConfigured();
  let notified = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const [userId, grants] of byUser) {
    const expired = grants.filter(
      (g) => new Date(g.expires_at).getTime() <= now,
    );
    const expiring = grants.filter(
      (g) => new Date(g.expires_at).getTime() > now,
    );

    if (emailConfigured) {
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      const to = userData?.user?.email ?? null;

      if (to) {
        const lines = [
          "Ownbase — repository access needs your attention",
          "",
          ...(expired.length > 0
            ? [
                `Expired but still active (${expired.length}):`,
                ...expired.map(
                  (g) =>
                    `  • ${g.login} on ${g.full_name} — expired ${g.expires_at.slice(0, 10)}`,
                ),
                "",
              ]
            : []),
          ...(expiring.length > 0
            ? [
                `Lapsing within ${SOON_DAYS} days (${expiring.length}):`,
                ...expiring.map(
                  (g) =>
                    `  • ${g.login} on ${g.full_name} — expires ${g.expires_at.slice(0, 10)}`,
                ),
                "",
              ]
            : []),
          "Ownbase does not revoke access automatically. Open the Continuity Center to revoke or extend each grant:",
          "  /dashboard/continuity",
        ];

        const result = await sendTransactionalEmail({
          to,
          subject:
            expired.length > 0
              ? `Action needed: ${expired.length} expired repository grant${expired.length === 1 ? "" : "s"}`
              : `${expiring.length} repository grant${expiring.length === 1 ? "" : "s"} lapsing soon`,
          text: lines.join("\n"),
        });

        if (result.sent) emailsSent += 1;
        else if (result.error) errors.push(`${userId}: ${result.error}`);
      }
    }

    // Record the notice regardless of email delivery, so the Continuity Center
    // and the audit trail both reflect that these grants were flagged.
    for (const grant of grants) {
      const [owner, ...rest] = grant.full_name.split("/");
      const { error: logError } = await logActivity({
        userId,
        repoOwner: owner ?? "",
        repoName: rest.join("/") || grant.full_name,
        fullName: grant.full_name,
        actionType: "access_expiry_notified",
        details: {
          full_name: grant.full_name,
          login: grant.login,
          expires_at: grant.expires_at,
          state: new Date(grant.expires_at).getTime() <= now
            ? "expired"
            : "expiring",
          emailed: emailConfigured,
        },
      });
      if (logError) errors.push(`${grant.full_name}: ${logError.message}`);
      else notified += 1;
    }
  }

  return NextResponse.json({
    notified,
    candidates: candidates.length,
    owners: byUser.size,
    emailsSent,
    emailConfigured,
    message: emailConfigured
      ? undefined
      : "RESEND_API_KEY and RESEND_FROM_EMAIL are not set; grants were flagged in the audit log but no email was sent.",
    errors: errors.length ? errors.slice(0, 20) : undefined,
  });
}
