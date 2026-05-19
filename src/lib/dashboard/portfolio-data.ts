export type RepoHealthStatus = "healthy" | "warning" | "critical";

export interface ActivityRowForTrend {
  full_name: string;
  created_at: string;
}

export interface RepoHealthInput {
  fullName: string;
  health: number;
}

/** Activity-based health score (0–100) from last push/update time. */
export function calcHealthScore(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0;
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return 0;
  const days = Math.max(0, (Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 95;
  if (days <= 7) return 90;
  if (days <= 14) return 86;
  if (days <= 30) return 81;
  if (days <= 60) return 76;
  return 68;
}

export function inferRepoUnit(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pay") || n.includes("bill")) return "Finance";
  if (n.includes("portal") || n.includes("customer")) return "Operations";
  if (n.includes("data") || n.includes("analytics")) return "Data";
  if (n.includes("auth") || n.includes("security")) return "Security";
  return "Platform";
}

export function repoStatus(
  health: number,
  busFactor: number,
): RepoHealthStatus {
  if (busFactor <= 1) return "critical";
  if (health < 85 || busFactor <= 2) return "warning";
  return "healthy";
}

export function lastActivityIsoForRepo(
  fullName: string,
  activityRows: { full_name: string; created_at: string }[],
): string | null {
  const match = activityRows.find((r) => r.full_name === fullName);
  return match?.created_at ?? null;
}

const MONTHS_BACK = 6;

/** Monthly average health for repos with activity that month (portfolio avg if none). */
export function buildPortfolioHealthTrend(
  repositories: RepoHealthInput[],
  activityRows: ActivityRowForTrend[],
): { monthLabels: string[]; values: number[] } {
  const now = new Date();
  const buckets: { label: string; startMs: number; endMs: number }[] = [];

  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    buckets.push({
      label: start.toLocaleString("en-US", { month: "short" }),
      startMs: start.getTime(),
      endMs: end.getTime(),
    });
  }

  const values = buckets.map((bucket) => {
    if (repositories.length === 0) return 0;

    const activeFullNames = new Set(
      activityRows
        .filter((row) => {
          const t = new Date(row.created_at).getTime();
          return t >= bucket.startMs && t <= bucket.endMs;
        })
        .map((row) => row.full_name),
    );

    if (activeFullNames.size === 0) return 0;

    const activeRepos = repositories.filter((r) =>
      activeFullNames.has(r.fullName),
    );
    return Math.round(
      activeRepos.reduce((sum, r) => sum + r.health, 0) / activeRepos.length,
    );
  });

  return { monthLabels: buckets.map((b) => b.label), values };
}

export function countSummariesForTracked(
  trackedFullNames: Set<string>,
  summaryFullNames: string[],
): number {
  return summaryFullNames.filter((name) => trackedFullNames.has(name)).length;
}
