import type { AccessLevel, ExpiryState } from "@/lib/access/levels";

/**
 * Ownbase Continuity Score.
 *
 * The design spec fixes five factors and their weights:
 *
 *   SPOF 35% · access review 20% · summary freshness 15% ·
 *   2FA adoption 15% · expiring access 15%
 *
 * Four of the five are measurable from data Ownbase holds. **2FA adoption is
 * not**: GitHub does not expose two-factor status for collaborators on
 * user-owned repositories (the `2fa_disabled` filter is an org-admin listing
 * feature, and Ownbase is single-tenant over personal repos).
 *
 * Rather than score an unmeasurable factor as zero — which would cap a
 * perfectly-run organization at 85/100 forever — the score is **renormalized
 * over the weight that is actually measurable**. The 2FA factor is still
 * returned, flagged `measurable: false`, so the UI can show it as "Not
 * measurable" instead of silently dropping a spec requirement.
 *
 * The weights below are the spec's. The per-factor curves (day thresholds and
 * bus-factor breakpoints) are Ownbase's own calibration and are kept as named
 * constants so they can be tuned without touching the scoring logic.
 */

export type ContinuityFactorKey =
  | "spof"
  | "access_review"
  | "summary_freshness"
  | "two_factor"
  | "expiring_access";

/** Spec weights. These must sum to 1. */
export const CONTINUITY_WEIGHTS: Record<ContinuityFactorKey, number> = {
  spof: 0.35,
  access_review: 0.2,
  summary_freshness: 0.15,
  two_factor: 0.15,
  expiring_access: 0.15,
};

// ── Calibration constants (Ownbase's, not the spec's) ────────────────────────

/** Collaborator count at or below which a repo is a single point of failure. */
const SPOF_CRITICAL_COLLABORATORS = 1;
/** Score for a repo with exactly two collaborators — better, still thin. */
const SPOF_THIN_TEAM_SCORE = 60;
/** Access is "freshly reviewed" within this many days. */
const ACCESS_REVIEW_FRESH_DAYS = 30;
/** Access review scores 0 at or beyond this many days. */
const ACCESS_REVIEW_STALE_DAYS = 180;
/**
 * A summary is fresh within this many days. Exported so the AI Insights screen
 * labels a summary "fresh" using the same threshold the score rewards.
 */
export const SUMMARY_FRESH_DAYS = 90;
/** A summary scores 0 at or beyond this many days. */
export const SUMMARY_STALE_DAYS = 180;
/** Grants lapsing within this many days count as "expiring soon". */
const EXPIRY_SOON_DAYS = 7;
/** Each still-live expired grant costs this many points. */
const EXPIRED_GRANT_PENALTY = 34;
/** Each grant lapsing within EXPIRY_SOON_DAYS costs this many points. */
const EXPIRING_GRANT_PENALTY = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ContinuityFactor = {
  key: ContinuityFactorKey;
  label: string;
  /** Spec weight, 0–1. */
  weight: number;
  /** 0–100. For unmeasurable factors this is null. */
  score: number | null;
  /** False when Ownbase has no data source for this factor (2FA today). */
  measurable: boolean;
  /** Points this factor contributes to the final score, already renormalized. */
  contribution: number;
  /** One-line statement of what was measured. */
  detail: string;
  /** What the owner can do to improve it, or why it can't be measured. */
  hint: string;
};

export type ContinuityScore = {
  /** 0–100, renormalized over measurable weight. */
  score: number;
  /** Sum of the weights that could actually be measured (0.85 today). */
  measuredWeight: number;
  factors: ContinuityFactor[];
  /** Worst-performing measurable factors first. */
  recommendations: string[];
  headline: string;
  band: "strong" | "fair" | "at_risk";
};

export type ContinuityRepoInput = {
  fullName: string;
  /** Live collaborator count; null when it could not be determined. */
  collaboratorCount: number | null;
  /** True for repos where custody cannot be sized here (e.g. GitLab). */
  custodyAssessmentSkipped?: boolean;
  /** ISO timestamp of the newest AI summary for this repo, if any. */
  summaryUpdatedAt?: string | null;
};

export type ContinuityAccessInput = {
  fullName: string;
  login: string;
  accessLevel: AccessLevel;
  expiresAt: string | null;
};

export type ContinuityAccessEventInput = {
  actionType: string;
  createdAt: string;
};

/** Access-related action types that count as evidence of an access review. */
export const ACCESS_REVIEW_EVENT_TYPES = new Set([
  "collaborator_added",
  "collaborator_removed",
  "collaborator_access_changed",
  "member_role_changed",
  "access_review_completed",
  "member_offboarded",
  "access_expiry_extended",
]);

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear 100 → 0 taper between `freshDays` and `staleDays`. */
function freshnessScore(
  ageDays: number,
  freshDays: number,
  staleDays: number,
): number {
  if (ageDays <= freshDays) return 100;
  if (ageDays >= staleDays) return 0;
  return clamp(
    Math.round(100 * (1 - (ageDays - freshDays) / (staleDays - freshDays))),
  );
}

function ageInDays(iso: string, now: number): number | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, (now - t) / DAY_MS);
}

/** Expiry bucket for one grant, computed against a stable `now`. */
export function expiryStateFor(
  expiresAt: string | null,
  now: number,
  soonDays = EXPIRY_SOON_DAYS,
): ExpiryState | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return null;
  if (t <= now) return "expired";
  if (t - now <= soonDays * DAY_MS) return "expiring";
  return "active";
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Build the portfolio continuity score. Pure: pass a stable `now` from the
 * server so the result is deterministic and hydration-safe.
 */
export function buildContinuityScore({
  repos,
  accessRows,
  accessEvents,
  now,
}: {
  repos: ContinuityRepoInput[];
  accessRows: ContinuityAccessInput[];
  accessEvents: ContinuityAccessEventInput[];
  now: number;
}): ContinuityScore {
  // ── SPOF (35%) ─────────────────────────────────────────────────────────────
  const custodyRepos = repos.filter(
    (r) => !r.custodyAssessmentSkipped && typeof r.collaboratorCount === "number",
  );
  const soleMaintainerRepos = custodyRepos.filter(
    (r) => (r.collaboratorCount ?? 0) <= SPOF_CRITICAL_COLLABORATORS,
  );
  const thinTeamRepos = custodyRepos.filter((r) => r.collaboratorCount === 2);

  let spofScore: number | null = null;
  if (custodyRepos.length > 0) {
    const perRepo = custodyRepos.map((r): number => {
      const count = r.collaboratorCount ?? 0;
      if (count <= SPOF_CRITICAL_COLLABORATORS) return 0;
      if (count === 2) return SPOF_THIN_TEAM_SCORE;
      return 100;
    });
    spofScore = Math.round(
      perRepo.reduce((sum, v) => sum + v, 0) / perRepo.length,
    );
  }

  const spofDetail =
    custodyRepos.length === 0
      ? "No repositories with measurable collaborator counts."
      : soleMaintainerRepos.length > 0
        ? `${plural(soleMaintainerRepos.length, "repo depends", "repos depend")} on a single maintainer.`
        : thinTeamRepos.length > 0
          ? `${plural(thinTeamRepos.length, "repo has", "repos have")} only two collaborators.`
          : "Every measured repository has three or more collaborators.";

  // ── Access review (20%) ────────────────────────────────────────────────────
  const reviewEvents = accessEvents
    .filter((e) => ACCESS_REVIEW_EVENT_TYPES.has(e.actionType))
    .map((e) => ageInDays(e.createdAt, now))
    .filter((d): d is number => d !== null);
  const lastReviewAgeDays =
    reviewEvents.length > 0 ? Math.min(...reviewEvents) : null;

  const accessReviewScore =
    lastReviewAgeDays === null
      ? 0
      : freshnessScore(
          lastReviewAgeDays,
          ACCESS_REVIEW_FRESH_DAYS,
          ACCESS_REVIEW_STALE_DAYS,
        );

  const accessReviewDetail =
    lastReviewAgeDays === null
      ? "No access change or review recorded yet."
      : `Last access change ${Math.round(lastReviewAgeDays)} day${Math.round(lastReviewAgeDays) === 1 ? "" : "s"} ago.`;

  // ── Summary freshness (15%) ────────────────────────────────────────────────
  let summaryScore: number | null = null;
  let staleSummaryCount = 0;
  let missingSummaryCount = 0;
  if (repos.length > 0) {
    const perRepo = repos.map((r) => {
      if (!r.summaryUpdatedAt) {
        missingSummaryCount += 1;
        return 0;
      }
      const age = ageInDays(r.summaryUpdatedAt, now);
      if (age === null) {
        missingSummaryCount += 1;
        return 0;
      }
      const value = freshnessScore(age, SUMMARY_FRESH_DAYS, SUMMARY_STALE_DAYS);
      if (value < 100) staleSummaryCount += 1;
      return value;
    });
    summaryScore = Math.round(
      perRepo.reduce((sum, v) => sum + v, 0) / perRepo.length,
    );
  }

  const summaryDetail =
    repos.length === 0
      ? "No repositories tracked yet."
      : missingSummaryCount > 0
        ? `${plural(missingSummaryCount, "repo has", "repos have")} no AI summary on file.`
        : staleSummaryCount > 0
          ? `${plural(staleSummaryCount, "summary is", "summaries are")} older than ${SUMMARY_FRESH_DAYS} days.`
          : "Every repository has a recent AI summary.";

  // ── Expiring access (15%) ──────────────────────────────────────────────────
  const liveGrants = accessRows.filter((r) => r.accessLevel !== "none");
  const expiredGrants = liveGrants.filter(
    (r) => expiryStateFor(r.expiresAt, now) === "expired",
  );
  const expiringGrants = liveGrants.filter(
    (r) => expiryStateFor(r.expiresAt, now) === "expiring",
  );

  const expiringScore = clamp(
    100 -
      expiredGrants.length * EXPIRED_GRANT_PENALTY -
      expiringGrants.length * EXPIRING_GRANT_PENALTY,
  );

  const expiringDetail =
    expiredGrants.length > 0
      ? `${plural(expiredGrants.length, "grant has", "grants have")} passed its expiry date but is still active.`
      : expiringGrants.length > 0
        ? `${plural(expiringGrants.length, "grant lapses", "grants lapse")} within ${EXPIRY_SOON_DAYS} days.`
        : liveGrants.length === 0
          ? "No recorded access grants yet."
          : "No access grants are expired or lapsing soon.";

  // ── Assemble ───────────────────────────────────────────────────────────────
  const raw: Array<
    Omit<ContinuityFactor, "contribution" | "weight"> & {
      key: ContinuityFactorKey;
    }
  > = [
    {
      key: "spof",
      label: "Single point of failure",
      score: spofScore,
      measurable: spofScore !== null,
      detail: spofDetail,
      hint:
        soleMaintainerRepos.length > 0
          ? "Add a second collaborator with write access to each single-maintainer repo."
          : "Keep at least three people able to work in every repository.",
    },
    {
      key: "access_review",
      label: "Access review recency",
      score: accessReviewScore,
      measurable: true,
      detail: accessReviewDetail,
      hint: "Review the access matrix and mark the review complete to reset this clock.",
    },
    {
      key: "summary_freshness",
      label: "Documentation freshness",
      score: summaryScore,
      measurable: summaryScore !== null,
      detail: summaryDetail,
      hint: "Regenerate AI summaries after major changes so handover notes stay current.",
    },
    {
      key: "two_factor",
      label: "Two-factor adoption",
      score: null,
      measurable: false,
      detail: "GitHub does not report two-factor status for these collaborators.",
      hint: "Not measurable from the GitHub API for personal repositories, so it is excluded from the score rather than counted as a failure.",
    },
    {
      key: "expiring_access",
      label: "Expiring access",
      score: expiringScore,
      measurable: true,
      detail: expiringDetail,
      hint: "Revoke or extend grants past their expiry date from the queue below.",
    },
  ];

  const measuredWeight = raw
    .filter((f) => f.measurable && f.score !== null)
    .reduce((sum, f) => sum + CONTINUITY_WEIGHTS[f.key], 0);

  const weightedSum = raw
    .filter((f) => f.measurable && f.score !== null)
    .reduce((sum, f) => sum + (f.score as number) * CONTINUITY_WEIGHTS[f.key], 0);

  const score =
    measuredWeight === 0 ? 0 : clamp(Math.round(weightedSum / measuredWeight));

  const factors: ContinuityFactor[] = raw.map((f) => ({
    ...f,
    weight: CONTINUITY_WEIGHTS[f.key],
    contribution:
      f.measurable && f.score !== null && measuredWeight > 0
        ? Math.round(((f.score * CONTINUITY_WEIGHTS[f.key]) / measuredWeight) * 10) /
          10
        : 0,
  }));

  const recommendations = factors
    .filter((f) => f.measurable && f.score !== null && f.score < 100)
    .sort((a, b) => (a.score as number) - (b.score as number))
    .slice(0, 3)
    .map((f) => f.hint);

  const band: ContinuityScore["band"] =
    score >= 80 ? "strong" : score >= 55 ? "fair" : "at_risk";

  const headline =
    band === "strong"
      ? "Your organization would survive a key person leaving."
      : band === "fair"
        ? "Continuity is workable but has gaps worth closing."
        : "Losing one person could stall active work.";

  return { score, measuredWeight, factors, recommendations, headline, band };
}
