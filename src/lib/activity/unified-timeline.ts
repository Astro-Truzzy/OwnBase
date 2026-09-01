import type { ActivityLogRow } from "@/lib/db/types";
import { auditActivityLabel } from "@/lib/repo-activity";
import type { RecentCommit } from "@/lib/github/fetch-recent-commits";

/**
 * Cross-repo unified activity timeline.
 *
 * Merges Ownbase's stored audit events (access grants, revocations, role
 * changes, offboarding) with live Git commit activity into one time-ordered
 * list. Kept separate from the per-repo `repo-activity.ts` builder, which groups
 * per-file touch events for a single repository's detail page.
 *
 * Not included: pull requests, branch events, and force-pushes. GitHub only
 * reports those reliably through webhooks, which are out of scope — the UI says
 * so rather than implying the timeline is complete.
 */

export type UnifiedActivityCategory = "access" | "code" | "repo" | "ai";

export type UnifiedActivityItem = {
  id: string;
  kind: "audit" | "commit";
  category: UnifiedActivityCategory;
  /** Action type for audit rows; "commit" for commits. Drives the row icon. */
  categoryKey: string;
  timestamp: string;
  /** Repo full name, or null for org-level events with no repo. */
  fullName: string | null;
  /** Login/name of whoever the event is about, when known. */
  actor: string | null;
  actorAvatar: string | null;
  /** Human-readable summary line. */
  label: string;
  /** Secondary line (commit message, level change, etc.). */
  description: string | null;
  /** External or in-app link for the row, when one applies. */
  href: string | null;
  /** Raw payload for the detail drawer. */
  details: Record<string, unknown>;
};

const AUDIT_CATEGORY: Record<string, UnifiedActivityCategory> = {
  collaborator_added: "access",
  collaborator_removed: "access",
  collaborator_access_changed: "access",
  member_role_changed: "access",
  access_review_completed: "access",
  member_offboarded: "access",
  access_expiry_extended: "access",
  access_expiry_notified: "access",
  repo_tracked: "repo",
  repo_untracked: "repo",
  summary_generated: "ai",
};

export const UNIFIED_CATEGORY_LABELS: Record<UnifiedActivityCategory, string> = {
  access: "Access",
  code: "Code",
  repo: "Repositories",
  ai: "AI summaries",
};

/** Pull the subject login out of an audit row's free-form details JSON. */
export function actorFromDetails(
  details: Record<string, unknown> | null,
): string | null {
  if (!details) return null;
  for (const key of ["username", "login", "actor", "member"]) {
    const value = details[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function describeAudit(row: ActivityLogRow): string | null {
  const details = (row.details ?? {}) as Record<string, unknown>;
  const level = typeof details.level === "string" ? details.level : null;
  const role = typeof details.role === "string" ? details.role : null;
  const permission =
    typeof details.permission === "string" ? details.permission : null;

  if (level) return `New level: ${level}`;
  if (role) return `New team role: ${role}`;
  if (permission) return `GitHub permission: ${permission}`;
  return null;
}

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function commitHref(fullName: string, sha: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commit/${encodeURIComponent(sha)}`;
}

export function buildUnifiedTimeline({
  auditRows,
  commits,
}: {
  auditRows: ActivityLogRow[];
  commits: RecentCommit[];
}): UnifiedActivityItem[] {
  const auditItems: UnifiedActivityItem[] = auditRows.map((row) => {
    const details = (row.details ?? {}) as Record<string, unknown>;
    const hasRepo = Boolean(row.full_name && row.full_name.includes("/"));
    return {
      id: `audit-${row.id}`,
      kind: "audit",
      category: AUDIT_CATEGORY[row.action_type] ?? "repo",
      categoryKey: row.action_type,
      timestamp: row.created_at,
      fullName: hasRepo ? row.full_name : null,
      actor: actorFromDetails(details),
      actorAvatar: null,
      label: auditActivityLabel(row.action_type),
      description: describeAudit(row),
      href: hasRepo ? `${repoDetailHref(row.full_name)}#activity` : null,
      details,
    };
  });

  const commitItems: UnifiedActivityItem[] = commits.map((commit) => ({
    id: `commit-${commit.fullName}-${commit.sha}`,
    kind: "commit",
    category: "code",
    categoryKey: "commit",
    timestamp: commit.timestamp,
    fullName: commit.fullName,
    actor: commit.developer,
    actorAvatar: commit.developerAvatar,
    label: "Commit pushed",
    description: commit.message,
    href: commitHref(commit.fullName, commit.sha),
    details: {
      sha: commit.sha,
      short_sha: commit.shaShort,
      message: commit.message,
      author: commit.developer,
      github_url: commit.url,
    },
  }));

  return [...auditItems, ...commitItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export type UnifiedActivityFilters = {
  repo: string;
  actor: string;
  category: string;
  from: string;
  to: string;
  query: string;
};

export const EMPTY_ACTIVITY_FILTERS: UnifiedActivityFilters = {
  repo: "",
  actor: "",
  category: "",
  from: "",
  to: "",
  query: "",
};

/**
 * Apply the timeline filters. Date bounds are inclusive and interpreted as UTC
 * day boundaries so a filter behaves the same on server and client.
 */
export function filterUnifiedTimeline(
  items: UnifiedActivityItem[],
  filters: UnifiedActivityFilters,
): UnifiedActivityItem[] {
  const actor = filters.actor.trim().toLowerCase();
  const query = filters.query.trim().toLowerCase();
  const fromMs = filters.from ? Date.parse(`${filters.from}T00:00:00Z`) : null;
  const toMs = filters.to ? Date.parse(`${filters.to}T23:59:59.999Z`) : null;

  return items.filter((item) => {
    if (filters.repo && item.fullName !== filters.repo) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (actor && !(item.actor ?? "").toLowerCase().includes(actor)) return false;

    if (fromMs !== null || toMs !== null) {
      const t = new Date(item.timestamp).getTime();
      if (Number.isNaN(t)) return false;
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
    }

    if (query) {
      const haystack = [
        item.label,
        item.description ?? "",
        item.fullName ?? "",
        item.actor ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

/** Distinct actors present in a timeline, for the actor filter options. */
export function distinctActors(items: UnifiedActivityItem[]): string[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (!item.actor) continue;
    const key = item.actor.toLowerCase();
    if (!seen.has(key)) seen.set(key, item.actor);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
