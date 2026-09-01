import {
  SUMMARY_FRESH_DAYS,
  SUMMARY_STALE_DAYS,
} from "@/lib/continuity/continuity-score";
import type { ExecutiveSummary } from "@/lib/db/types";

/**
 * AI Codebase Insights overview.
 *
 * Turns "tracked repos" + "stored executive summaries" into one portfolio view:
 * which repositories have an AI summary, how old each one is, and how much of
 * the plan's monthly summary allowance is left.
 *
 * Two deliberate choices:
 *
 * 1. **Freshness thresholds are borrowed from the Continuity Score** rather than
 *    re-invented, so a summary this screen labels "fresh" is exactly the one the
 *    continuity score stops penalising. `aging` is the taper band between the
 *    two thresholds — visible here, partially penalised there.
 *
 * 2. **GitLab repos are `unsupported`, not `missing`.** Summary generation reads
 *    repository content through the GitHub API only, so counting GitLab repos as
 *    gaps would show a coverage number the owner has no way to fix. They are
 *    excluded from the coverage denominator and labelled instead.
 *
 * Known limitation: summaries are matched to repos by `full_name`, the same way
 * the continuity screen does it. A repository renamed on GitHub keeps its stored
 * summary (keyed by GitHub repo id) but reads as `missing` here until it is
 * regenerated.
 *
 * Pure — pass a stable `now` from the server so output is deterministic and
 * hydration-safe.
 */

export type SummaryFreshness =
  | "fresh"
  | "aging"
  | "stale"
  | "missing"
  | "unsupported";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Sort order for the insight list: what needs action comes first. */
const FRESHNESS_PRIORITY: Record<SummaryFreshness, number> = {
  missing: 0,
  stale: 1,
  aging: 2,
  fresh: 3,
  unsupported: 4,
};

export type RepoProvider = "github" | "gitlab";

export type AiInsightsRepoInput = {
  fullName: string;
  owner: string;
  name: string;
  provider: RepoProvider;
};

export type AiInsightsSummaryInput = {
  fullName: string;
  /** GitHub repo id the summary is stored under. */
  repoId: number | null;
  summary: ExecutiveSummary | null;
  updatedAt: string | null;
};

export type AiInsightRepo = {
  fullName: string;
  /** Display label — the `gitlab/` routing prefix is not shown to owners. */
  label: string;
  owner: string;
  name: string;
  provider: RepoProvider;
  /** GitHub repo id, known only once a summary exists for this repo. */
  repoId: number | null;
  summary: ExecutiveSummary | null;
  updatedAt: string | null;
  /** Whole days since the summary was generated; null when there is none. */
  ageDays: number | null;
  freshness: SummaryFreshness;
  /** True when a summary can be generated or refreshed for this repo. */
  generatable: boolean;
  /** Set when `generatable` is false — shown in place of the action button. */
  unavailableReason?: string;
};

export type AiInsightsOverview = {
  /** Repos needing attention first, then alphabetical within each band. */
  repos: AiInsightRepo[];
  totalRepos: number;
  /** Repos that can carry an AI summary — the coverage denominator. */
  summarizableCount: number;
  summarizedCount: number;
  missingCount: number;
  /** `aging` + `stale` — summarized, but worth regenerating. */
  needsRefreshCount: number;
  /** 0–100 over summarizable repos; null when there are none. */
  coveragePct: number | null;
  usedThisMonth: number;
  monthlyLimit: number;
  remainingThisMonth: number;
  atMonthlyLimit: boolean;
  headline: string;
};

function ageInDays(iso: string, now: number): number | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / DAY_MS));
}

function freshnessFor(ageDays: number | null): SummaryFreshness {
  if (ageDays === null) return "missing";
  if (ageDays < SUMMARY_FRESH_DAYS) return "fresh";
  if (ageDays < SUMMARY_STALE_DAYS) return "aging";
  return "stale";
}

/**
 * Band a single stored summary. Exported so the repository detail page labels
 * freshness with the same thresholds as the insights hub. Pass a server-side
 * `now` — callers render this in client components, so a browser-side clock
 * would desync from SSR output.
 */
export function summaryFreshness(
  updatedAt: string | null,
  now: number,
): { freshness: SummaryFreshness; ageDays: number | null } {
  const ageDays = updatedAt ? ageInDays(updatedAt, now) : null;
  return { freshness: freshnessFor(ageDays), ageDays };
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function displayRepoLabel(fullName: string, provider: RepoProvider): string {
  return provider === "gitlab" ? fullName.replace(/^gitlab\//, "") : fullName;
}

/** Human label + tone for a freshness band, so every surface agrees. */
export function freshnessLabel(
  freshness: SummaryFreshness,
  ageDays: number | null,
): string {
  switch (freshness) {
    case "fresh":
      return ageDays === 0
        ? "Generated today"
        : `Fresh · ${plural(ageDays ?? 0, "day", "days")} old`;
    case "aging":
      return `Aging · ${plural(ageDays ?? 0, "day", "days")} old`;
    case "stale":
      return `Stale · ${plural(ageDays ?? 0, "day", "days")} old`;
    case "missing":
      return "No summary yet";
    case "unsupported":
      return "Not available";
  }
}

export function buildAiInsightsOverview({
  repos,
  summaries,
  usedThisMonth,
  monthlyLimit,
  now,
}: {
  repos: AiInsightsRepoInput[];
  summaries: AiInsightsSummaryInput[];
  usedThisMonth: number;
  monthlyLimit: number;
  now: number;
}): AiInsightsOverview {
  const summaryByFullName = new Map<string, AiInsightsSummaryInput>();
  for (const row of summaries) {
    if (row.fullName) summaryByFullName.set(row.fullName, row);
  }

  const entries: AiInsightRepo[] = repos.map((repo) => {
    const stored = summaryByFullName.get(repo.fullName);
    const updatedAt = stored?.updatedAt ?? null;
    const ageDays = updatedAt ? ageInDays(updatedAt, now) : null;
    const summary = stored?.summary ?? null;

    // A stored row with unreadable JSON is treated as no summary, so the owner
    // is prompted to regenerate rather than shown an empty card.
    const hasSummary = summary !== null && updatedAt !== null && ageDays !== null;

    if (repo.provider === "gitlab") {
      return {
        fullName: repo.fullName,
        label: displayRepoLabel(repo.fullName, repo.provider),
        owner: repo.owner,
        name: repo.name,
        provider: repo.provider,
        repoId: stored?.repoId ?? null,
        summary: hasSummary ? summary : null,
        updatedAt: hasSummary ? updatedAt : null,
        ageDays: hasSummary ? ageDays : null,
        freshness: "unsupported",
        generatable: false,
        unavailableReason:
          "AI summaries read repository content through GitHub, so GitLab repos are not covered yet.",
      };
    }

    return {
      fullName: repo.fullName,
      label: displayRepoLabel(repo.fullName, repo.provider),
      owner: repo.owner,
      name: repo.name,
      provider: repo.provider,
      repoId: stored?.repoId ?? null,
      summary: hasSummary ? summary : null,
      updatedAt: hasSummary ? updatedAt : null,
      ageDays: hasSummary ? ageDays : null,
      freshness: freshnessFor(hasSummary ? ageDays : null),
      generatable: true,
    };
  });

  entries.sort((a, b) => {
    const byBand =
      FRESHNESS_PRIORITY[a.freshness] - FRESHNESS_PRIORITY[b.freshness];
    if (byBand !== 0) return byBand;
    return a.label.localeCompare(b.label);
  });

  const summarizable = entries.filter((e) => e.generatable);
  const summarizedCount = summarizable.filter((e) => e.summary !== null).length;
  const missingCount = summarizable.filter((e) => e.freshness === "missing").length;
  const needsRefreshCount = summarizable.filter(
    (e) => e.freshness === "aging" || e.freshness === "stale",
  ).length;

  const coveragePct =
    summarizable.length === 0
      ? null
      : Math.round((summarizedCount / summarizable.length) * 100);

  const remainingThisMonth = Math.max(0, monthlyLimit - usedThisMonth);

  const headline =
    summarizable.length === 0
      ? "Track a GitHub repository to start building codebase insights."
      : missingCount > 0
        ? `${plural(missingCount, "repository has", "repositories have")} no AI summary yet.`
        : needsRefreshCount > 0
          ? `${plural(needsRefreshCount, "summary is", "summaries are")} older than ${SUMMARY_FRESH_DAYS} days.`
          : "Every tracked repository has a recent AI summary.";

  return {
    repos: entries,
    totalRepos: entries.length,
    summarizableCount: summarizable.length,
    summarizedCount,
    missingCount,
    needsRefreshCount,
    coveragePct,
    usedThisMonth,
    monthlyLimit,
    remainingThisMonth,
    atMonthlyLimit: usedThisMonth >= monthlyLimit,
    headline,
  };
}
