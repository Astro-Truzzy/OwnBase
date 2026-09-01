"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  IconHistory,
  IconFilter,
  IconDownload,
  IconFileText,
  IconX,
  IconExternalLink,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";
import { StatusPill } from "@/components/dashboard/status-pill";
import { TimelineRow } from "@/components/dashboard/timeline-row";
import {
  distinctActors,
  filterUnifiedTimeline,
  UNIFIED_CATEGORY_LABELS,
  type UnifiedActivityFilters,
  type UnifiedActivityItem,
} from "@/lib/activity/unified-timeline";
import { formatActivityTimestamp } from "@/lib/repo-activity";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

const EMPTY: UnifiedActivityFilters = {
  repo: "",
  actor: "",
  category: "",
  from: "",
  to: "",
  query: "",
};

/** Reads filters from the URL so a filtered view survives a reload or share. */
function readFiltersFromUrl(): UnifiedActivityFilters {
  if (typeof window === "undefined") return EMPTY;
  const p = new URLSearchParams(window.location.search);
  return {
    repo: p.get("repo") ?? "",
    actor: p.get("actor") ?? "",
    category: p.get("category") ?? "",
    from: p.get("from") ?? "",
    to: p.get("to") ?? "",
    query: p.get("q") ?? "",
  };
}

function writeFiltersToUrl(filters: UnifiedActivityFilters) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (filters.repo) p.set("repo", filters.repo);
  if (filters.actor) p.set("actor", filters.actor);
  if (filters.category) p.set("category", filters.category);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (filters.query) p.set("q", filters.query);
  const qs = p.toString();
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", next);
}

export function ActivityPageClient({
  items,
  repoOptions,
  auditCount,
  auditLimit,
  commitRepoCount,
  skippedRepoCount,
  commitErrors,
  hasProviderToken,
  isGitlabWorkspace,
  trackedEmpty,
}: {
  items: UnifiedActivityItem[];
  repoOptions: string[];
  auditCount: number;
  auditLimit: number;
  commitRepoCount: number;
  skippedRepoCount: number;
  commitErrors: Array<{ fullName: string; error: string }>;
  hasProviderToken: boolean;
  isGitlabWorkspace: boolean;
  trackedEmpty: boolean;
}) {
  const baseId = useId();
  // Start from the server-rendered default, then adopt the URL after mount so
  // the first client render matches the server markup.
  const [filters, setFilters] = useState<UnifiedActivityFilters>(EMPTY);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openItem, setOpenItem] = useState<UnifiedActivityItem | null>(null);

  useEffect(() => {
    setFilters(readFiltersFromUrl());
  }, []);

  useEffect(() => {
    writeFiltersToUrl(filters);
    setVisible(PAGE_SIZE);
  }, [filters]);

  const actors = useMemo(() => distinctActors(items), [items]);
  const filtered = useMemo(
    () => filterUnifiedTimeline(items, filters),
    [items, filters],
  );
  const shown = filtered.slice(0, visible);

  const hasActiveFilter =
    filters.repo !== "" ||
    filters.actor !== "" ||
    filters.category !== "" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.query !== "";

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.repo) p.set("repo", filters.repo);
    if (filters.actor) p.set("actor", filters.actor);
    if (filters.category) p.set("category", filters.category);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    if (filters.query) p.set("q", filters.query);
    return (format: "csv" | "pdf") => {
      const q = new URLSearchParams(p);
      q.set("format", format);
      return `/api/dashboard/reports/audit-export?${q.toString()}`;
    };
  }, [filters]);

  const update = <K extends keyof UnifiedActivityFilters>(
    key: K,
    value: UnifiedActivityFilters[K],
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <IconHistory className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Activity &amp; Audit Log
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every access change Ownbase recorded, merged with recent code
            activity across your repositories. Filter it, open any entry for
            detail, and export a signed copy.
          </p>
        </div>
      </div>

      {trackedEmpty ? (
        <section className="dash-panel p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">
            No repositories tracked yet. Add repos from your{" "}
            <Link
              href="/dashboard/organization"
              className="text-primary underline hover:no-underline"
            >
              organization
            </Link>{" "}
            and activity will appear here.
          </p>
        </section>
      ) : (
        <>
          {/* ── Filters ──────────────────────────────────────────────────── */}
          <section
            aria-labelledby={`${baseId}-filters`}
            className="dash-panel p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id={`${baseId}-filters`}
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <IconFilter className="h-4 w-4 text-muted-foreground" aria-hidden />
                Filters
              </h2>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY)}
                  className="rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardSelect
                label="Repository"
                value={filters.repo}
                onChange={(v) => update("repo", v)}
                options={[
                  { value: "", label: "All repositories" },
                  ...repoOptions.map((r) => ({ value: r, label: r })),
                ]}
                triggerClassName="dash-input shadow-none"
              />
              <DashboardSelect
                label="Developer"
                value={filters.actor}
                onChange={(v) => update("actor", v)}
                options={[
                  { value: "", label: "Anyone" },
                  ...actors.map((a) => ({ value: a, label: a })),
                ]}
                triggerClassName="dash-input shadow-none"
              />
              <DashboardSelect
                label="Category"
                value={filters.category}
                onChange={(v) => update("category", v)}
                options={[
                  { value: "", label: "All categories" },
                  ...Object.entries(UNIFIED_CATEGORY_LABELS).map(
                    ([value, label]) => ({ value, label }),
                  ),
                ]}
                triggerClassName="dash-input shadow-none"
              />
              <div>
                <label
                  htmlFor={`${baseId}-from`}
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  From
                </label>
                <input
                  id={`${baseId}-from`}
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => update("from", e.target.value)}
                  className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
              <div>
                <label
                  htmlFor={`${baseId}-to`}
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  To
                </label>
                <input
                  id={`${baseId}-to`}
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => update("to", e.target.value)}
                  className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
              <div>
                <label
                  htmlFor={`${baseId}-q`}
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Search
                </label>
                <input
                  id={`${baseId}-q`}
                  type="search"
                  value={filters.query}
                  onChange={(e) => update("query", e.target.value)}
                  placeholder="Commit message, repo, person…"
                  className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" role="status">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {shown.length}
                </span>{" "}
                of {filtered.length}
                {hasActiveFilter ? ` filtered` : ""} entries
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={exportHref("csv")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <IconDownload className="h-4 w-4" aria-hidden />
                  Export CSV
                </a>
                <a
                  href={exportHref("pdf")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <IconFileText className="h-4 w-4" aria-hidden />
                  Export PDF
                </a>
              </div>
            </div>
          </section>

          {/* ── Coverage disclosure ──────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <IconInfoCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Access events are stored permanently and nothing is deleted; this
                view loads the {auditLimit} most recent
                {auditCount >= auditLimit ? " (more exist — narrow the dates or export)" : ""}
                . Code activity is fetched live for your {commitRepoCount} most
                recently active {commitRepoCount === 1 ? "repository" : "repositories"}
                {skippedRepoCount > 0
                  ? `; ${skippedRepoCount} other ${skippedRepoCount === 1 ? "repo is" : "repos are"} not included`
                  : ""}
                . Pull requests, branch events, and force-pushes need repository
                webhooks, which Ownbase does not use — they are not shown.
              </span>
            </p>

            {!hasProviderToken && !isGitlabWorkspace && (
              <p className="rounded-lg border border-warning-border bg-warning-subtle px-3 py-2 text-xs text-warning">
                Sign in with GitHub to include code activity. Access events below
                are complete.
              </p>
            )}
            {isGitlabWorkspace && (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                GitLab workspace: code activity is shown on each project&apos;s
                detail page. Access events below are complete.
              </p>
            )}
            {commitErrors.length > 0 && (
              <ul className="space-y-1">
                {commitErrors.slice(0, 3).map((err) => (
                  <li
                    key={err.fullName}
                    className="flex items-start gap-2 text-xs text-warning"
                  >
                    <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      {err.fullName}: {err.error}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Timeline ─────────────────────────────────────────────────── */}
          <section aria-labelledby={`${baseId}-timeline`} className="dash-panel p-4 sm:p-6">
            <h2 id={`${baseId}-timeline`} className="sr-only">
              Activity timeline
            </h2>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {items.length === 0
                  ? "No activity recorded yet. Granting access or tracking a repo will show up here."
                  : "No entries match these filters."}
              </p>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {shown.map((item) => {
                    const stamp = formatActivityTimestamp(item.timestamp);
                    return (
                      <TimelineRow
                        key={item.id}
                        category={item.categoryKey}
                        action={item.label}
                        target={item.fullName ?? undefined}
                        at={
                          <button
                            type="button"
                            onClick={() => setOpenItem(item)}
                            className="rounded text-left underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            aria-label={`Show details for ${item.label}${item.fullName ? ` on ${item.fullName}` : ""}`}
                          >
                            {stamp.relative}
                            {item.actor ? ` · ${item.actor}` : ""}
                            {item.description ? ` · ${item.description}` : ""}
                          </button>
                        }
                        dateTime={item.timestamp}
                      />
                    );
                  })}
                </ul>

                {visible < filtered.length && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {openItem && (
        <ActivityDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
      )}
    </div>
  );
}

function ActivityDetailDrawer({
  item,
  onClose,
}: {
  item: UnifiedActivityItem;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const stamp = formatActivityTimestamp(item.timestamp);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const entries = Object.entries(item.details ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="app-scrollbar flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground"
            >
              {item.label}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <time dateTime={item.timestamp}>{stamp.absolute}</time>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusPill tone="neutral">
                {UNIFIED_CATEGORY_LABELS[item.category]}
              </StatusPill>
              {item.actor ? (
                <StatusPill tone="info">{item.actor}</StatusPill>
              ) : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <IconX className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {item.fullName && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Repository
              </h3>
              <p className="mt-1 break-words text-sm text-foreground">
                {item.fullName}
              </p>
            </div>
          )}

          {item.description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Detail
              </h3>
              <p className="mt-1 break-words text-sm text-foreground">
                {item.description}
              </p>
            </div>
          )}

          {entries.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recorded data
              </h3>
              <dl className="mt-2 space-y-2">
                {entries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-3 gap-2 border-b border-border pb-2 last:border-0"
                  >
                    <dt className="col-span-1 text-xs text-muted-foreground">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="col-span-2 break-words text-xs text-foreground">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {item.href && (
            <Link
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <IconExternalLink className="h-4 w-4" aria-hidden />
              {item.kind === "commit" ? "View commit" : "Open repository"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
