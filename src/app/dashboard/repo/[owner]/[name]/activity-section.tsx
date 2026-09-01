"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconFile,
  IconGitCommit,
  IconShield,
  IconUser,
} from "@tabler/icons-react";
import type { ActivityLogRow } from "@/lib/db/types";
import {
  auditActivityLabel,
  buildGroupedActivityTimeline,
  commitDetailHref,
  fileTouchActionLabel,
  formatActivityTimestamp,
  type RepoActivityTimelineItem,
  type RepoCommitGroup,
} from "@/lib/repo-activity";

interface ActivitySectionProps {
  owner: string;
  name: string;
  fileEvents: import("@/lib/repo-activity").RepoFileActivityEvent[];
  auditEntries: ActivityLogRow[];
  fileActivityError?: string | null;
}

type ActivityFilter = "all" | "code" | "access";

const INITIAL_VISIBLE = 3;
const SEE_MORE_INCREMENT = 4;
const PAGE_SIZE = INITIAL_VISIBLE + SEE_MORE_INCREMENT;

function auditDetailText(
  entry: Extract<RepoActivityTimelineItem, { kind: "audit" }>,
): string | null {
  const d = entry.details;
  if (
    entry.actionType === "collaborator_added" &&
    typeof d.username === "string"
  ) {
    const perm = d.permission as string | undefined;
    return perm ? `${d.username} (${perm})` : d.username;
  }
  if (
    entry.actionType === "collaborator_removed" &&
    typeof d.username === "string"
  ) {
    return d.username;
  }
  return null;
}

function CommitGroupRow({
  group,
  owner,
  name,
}: {
  group: RepoCommitGroup;
  owner: string;
  name: string;
}) {
  const { relative, absolute } = formatActivityTimestamp(group.timestamp);
  const href = commitDetailHref(owner, name, group.commitShaFull);
  const previewFiles = group.files.slice(0, 4);
  const remaining = group.files.length - previewFiles.length;

  const actionCounts = group.files.reduce(
    (acc, f) => {
      acc[f.action] = (acc[f.action] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <li className="rounded-xl border border-border dash-surface-inset p-4">
      <div className="flex gap-3">
        {group.developerAvatar ? (
          <img
            src={group.developerAvatar}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-border"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-primary">
            <IconUser className="h-4 w-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-semibold text-foreground">
                  {group.developer}
                </span>{" "}
                <span className="text-muted-foreground">
                  pushed {group.files.length} file
                  {group.files.length === 1 ? "" : "s"}
                </span>
              </p>
              {group.commitMessage && (
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <IconGitCommit
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary/70"
                    aria-hidden
                  />
                  <span className="line-clamp-2">{group.commitMessage}</span>
                </p>
              )}
            </div>
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
            >
              View all changes
              <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {Object.entries(actionCounts).map(([action, count]) => (
              <span
                key={action}
                className="rounded-md border border-border bg-primary/5 px-2 py-0.5"
              >
                {count}{" "}
                {fileTouchActionLabel(
                  action as import("@/lib/repo-activity").FileTouchAction,
                )}
              </span>
            ))}
            {(group.totalAdditions > 0 || group.totalDeletions > 0) && (
              <span className="rounded-md border border-border bg-primary/5 px-2 py-0.5">
                <span className="text-emerald-300/90">
                  +{group.totalAdditions}
                </span>
                {" / "}
                <span className="text-red-600/90 dark:text-red-300/90">
                  −{group.totalDeletions}
                </span>
              </span>
            )}
          </div>

          <ul className="mt-3 space-y-1 border-t border-border pt-3">
            {previewFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
              >
                <IconFile
                  className="h-3 w-3 shrink-0 text-primary/80"
                  aria-hidden
                />
                <span className="truncate">{file.file}</span>
                <span className="shrink-0 text-muted-foreground/70">
                  {fileTouchActionLabel(file.action)}
                </span>
              </li>
            ))}
            {remaining > 0 && (
              <li className="text-xs text-muted-foreground/80">
                +{remaining} more file{remaining === 1 ? "" : "s"} in this
                commit
              </li>
            )}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={group.timestamp} title={absolute}>
              {absolute}
            </time>
            <span aria-hidden>·</span>
            <span>{relative}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{group.commitSha}</span>
          </div>
        </div>
      </div>
    </li>
  );
}

function AuditActivityRow({
  entry,
}: {
  entry: Extract<RepoActivityTimelineItem, { kind: "audit" }>;
}) {
  const { relative, absolute } = formatActivityTimestamp(entry.timestamp);
  const label = auditActivityLabel(entry.actionType);
  const detail = auditDetailText(entry);

  return (
    <li className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/15 text-violet-200">
          <IconShield className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            <span className="font-semibold text-violet-100">{label}</span>
            {detail != null && (
              <span className="text-muted-foreground"> — {detail}</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={entry.timestamp} title={absolute}>
              {absolute}
            </time>
            <span aria-hidden>·</span>
            <span>{relative}</span>
          </div>
        </div>
      </div>
    </li>
  );
}

export function ActivitySection({
  owner,
  name,
  fileEvents,
  auditEntries,
  fileActivityError,
}: ActivitySectionProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setExpanded(false);
    setPage(0);
  }, [filter]);

  const timeline = useMemo(
    () => buildGroupedActivityTimeline(fileEvents, auditEntries),
    [fileEvents, auditEntries],
  );

  const filtered = useMemo(() => {
    if (filter === "code")
      return timeline.filter((item) => item.kind === "commit");
    if (filter === "access")
      return timeline.filter((item) => item.kind === "audit");
    return timeline;
  }, [timeline, filter]);

  const commitCount = timeline.filter((i) => i.kind === "commit").length;
  const accessCount = auditEntries.length;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleItems = expanded
    ? filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
    : filtered.slice(0, INITIAL_VISIBLE);
  const showSeeMore = !expanded && filtered.length > INITIAL_VISIBLE;
  const showPagination = expanded && filtered.length > PAGE_SIZE;

  return (
    <section id="activity" className="dash-panel p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-foreground">Activity</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Commits grouped by change set — open any commit to see every file
            touched and ask AI what it means.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(
            [
              ["all", "All", timeline.length],
              ["code", "Commits", commitCount],
              ["access", "Access & org", accessCount],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? "bg-primary/10 text-foreground ring-1 ring-cyan-300/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 text-muted-foreground/70">
                  ({count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {fileActivityError && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          {fileActivityError} Organization and access events below are still
          available.
        </p>
      )}

      {filtered.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
          {filter === "code"
            ? "No recent commits with file changes were found. Push code to this repository to populate activity."
            : filter === "access"
              ? "No access or organization events yet. Track this repo or manage collaborators to see entries here."
              : "No activity recorded yet. Commit history and workspace events will appear here."}
        </p>
      )}

      {filtered.length > 0 && (
        <>
          <ul className="mt-6 space-y-3" role="list">
            {visibleItems.map((item) =>
              item.kind === "commit" ? (
                <CommitGroupRow
                  key={item.id}
                  group={item}
                  owner={owner}
                  name={name}
                />
              ) : (
                <AuditActivityRow key={item.id} entry={item} />
              ),
            )}
          </ul>

          {showSeeMore && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                See more
                <span className="ml-1.5 text-muted-foreground">
                  (
                  {Math.min(
                    SEE_MORE_INCREMENT,
                    filtered.length - INITIAL_VISIBLE,
                  )}{" "}
                  more)
                </span>
              </button>
            </div>
          )}

          {showPagination && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {totalPages} · {filtered.length} events
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconChevronLeft className="h-4 w-4" aria-hidden />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                  <IconChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
