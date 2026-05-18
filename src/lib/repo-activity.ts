import type { ActivityLogRow } from "@/lib/db/types";

export type FileTouchAction = "added" | "modified" | "removed" | "renamed";

export type RepoFileActivityEvent = {
  kind: "file";
  id: string;
  developer: string;
  developerAvatar: string | null;
  file: string;
  previousFile?: string;
  action: FileTouchAction;
  timestamp: string;
  /** Short display SHA (7 chars). */
  commitSha: string;
  /** Full SHA for API routes and commit detail pages. */
  commitShaFull: string;
  commitMessage: string;
  commitUrl: string | null;
  additions?: number;
  deletions?: number;
};

export type RepoCommitGroup = {
  kind: "commit";
  id: string;
  commitSha: string;
  commitShaFull: string;
  commitMessage: string;
  commitUrl: string | null;
  developer: string;
  developerAvatar: string | null;
  timestamp: string;
  files: RepoFileActivityEvent[];
  totalAdditions: number;
  totalDeletions: number;
};

export type RepoAuditActivityEvent = {
  kind: "audit";
  id: string;
  actionType: ActivityLogRow["action_type"];
  timestamp: string;
  details: Record<string, unknown>;
};

export type RepoActivityItem = RepoFileActivityEvent | RepoAuditActivityEvent;

export type RepoActivityTimelineItem = RepoCommitGroup | RepoAuditActivityEvent;

const AUDIT_LABELS: Record<string, string> = {
  collaborator_added: "Access granted",
  collaborator_removed: "Access revoked",
  repo_tracked: "Added to organization",
  repo_untracked: "Removed from organization",
  summary_generated: "AI summary generated",
};

export function auditActivityLabel(actionType: string): string {
  return AUDIT_LABELS[actionType] ?? actionType.replace(/_/g, " ");
}

export function mergeRepoActivityTimeline(
  fileEvents: RepoFileActivityEvent[],
  auditEntries: ActivityLogRow[],
): RepoActivityItem[] {
  const auditItems: RepoAuditActivityEvent[] = auditEntries.map((entry) => ({
    kind: "audit",
    id: entry.id,
    actionType: entry.action_type,
    timestamp: entry.created_at,
    details: (entry.details as Record<string, unknown>) ?? {},
  }));

  return [...fileEvents, ...auditItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function groupFileEventsByCommit(
  events: RepoFileActivityEvent[],
): RepoCommitGroup[] {
  const bySha = new Map<string, RepoFileActivityEvent[]>();

  for (const event of events) {
    const key = event.commitShaFull || event.commitSha;
    const list = bySha.get(key) ?? [];
    list.push(event);
    bySha.set(key, list);
  }

  return Array.from(bySha.entries())
    .map(([shaFull, files]) => {
      const first = files[0]!;
      let totalAdditions = 0;
      let totalDeletions = 0;
      for (const f of files) {
        totalAdditions += f.additions ?? 0;
        totalDeletions += f.deletions ?? 0;
      }
      return {
        kind: "commit" as const,
        id: shaFull,
        commitSha: first.commitSha,
        commitShaFull: shaFull,
        commitMessage: first.commitMessage,
        commitUrl: first.commitUrl,
        developer: first.developer,
        developerAvatar: first.developerAvatar,
        timestamp: first.timestamp,
        files: files.sort((a, b) => a.file.localeCompare(b.file)),
        totalAdditions,
        totalDeletions,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export function buildGroupedActivityTimeline(
  fileEvents: RepoFileActivityEvent[],
  auditEntries: ActivityLogRow[],
): RepoActivityTimelineItem[] {
  const commits = groupFileEventsByCommit(fileEvents);
  const auditItems: RepoAuditActivityEvent[] = auditEntries.map((entry) => ({
    kind: "audit",
    id: entry.id,
    actionType: entry.action_type,
    timestamp: entry.created_at,
    details: (entry.details as Record<string, unknown>) ?? {},
  }));

  return [...commits, ...auditItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function commitDetailHref(
  owner: string,
  name: string,
  commitShaFull: string,
): string {
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commit/${encodeURIComponent(commitShaFull)}`;
}

export function formatActivityTimestamp(iso: string): {
  relative: string;
  absolute: string;
} {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let relative = "Just now";
    if (diffMins >= 1 && diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffHours >= 1 && diffHours < 24) relative = `${diffHours}h ago`;
    else if (diffDays >= 1 && diffDays < 7) relative = `${diffDays}d ago`;
    else if (diffDays >= 7)
      relative = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

    const absolute = d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return { relative, absolute };
  } catch {
    return { relative: "", absolute: iso };
  }
}

export function fileTouchActionLabel(action: FileTouchAction): string {
  switch (action) {
    case "added":
      return "added";
    case "removed":
      return "removed";
    case "renamed":
      return "renamed";
    default:
      return "modified";
  }
}

export function normalizeGithubFileStatus(
  status: string,
): FileTouchAction {
  if (status === "added") return "added";
  if (status === "removed") return "removed";
  if (status === "renamed") return "renamed";
  return "modified";
}
