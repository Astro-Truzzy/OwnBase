"use client";

import type { ActivityLogRow } from "../../../../../lib/db/types";

interface ActivitySectionProps {
  owner: string;
  name: string;
  entries: ActivityLogRow[];
  error?: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  collaborator_added: "Access granted",
  collaborator_removed: "Access revoked",
  repo_tracked: "Added to organization",
  repo_untracked: "Removed from organization",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function detailText(entry: ActivityLogRow): string | null {
  const d = entry.details as Record<string, unknown> | undefined;
  if (!d) return null;
  if (entry.action_type === "collaborator_added" && typeof d.username === "string") {
    const perm = d.permission as string | undefined;
    return perm ? `to ${d.username} (${perm})` : `to ${d.username}`;
  }
  if (entry.action_type === "collaborator_removed" && typeof d.username === "string") {
    return `for ${d.username}`;
  }
  return null;
}

export function ActivitySection({ owner, name, entries, error }: ActivitySectionProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-medium text-foreground">
        Activity
      </h2>
      <p className="mt-1 text-sm text-muted">
        Who touched what on this repository. Full audit trail for access and organization changes.
      </p>
      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {!error && entries.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No activity recorded yet. Grant or revoke access, or add this repo to your organization, to see events here.
        </p>
      )}
      {!error && entries.length > 0 && (
        <ul className="mt-4 space-y-2" role="list">
          {entries.map((entry) => {
            const label = ACTION_LABELS[entry.action_type] ?? entry.action_type;
            const detail = detailText(entry);
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{label}</span>
                {detail != null && (
                  <span className="text-muted">{detail}</span>
                )}
                <span className="ml-auto text-muted">{formatTime(entry.created_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
