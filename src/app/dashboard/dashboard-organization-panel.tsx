"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconBuilding,
  IconBuildingOff,
  IconCheck,
  IconExternalLink,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import {
  filterSearchableRepos,
  type SearchableRepo,
} from "@/lib/dashboard/searchable-repos";
import { parseTrackedRepoFullName } from "@/lib/dashboard/parse-tracked-repo";
import {
  addTrackedRepoAction,
  removeTrackedRepoAction,
} from "./repo/actions";

export type OrganizationTrackedRepo = {
  fullName: string;
  name: string;
  tech: string;
  detailHref: string;
  addedAt: string;
};

type MergedRepo = SearchableRepo & { isTracked: boolean };

type ViewFilter = "all" | "available" | "tracked";

function actionParamsFromFullName(
  fullName: string,
): { owner: string; name: string } | null {
  const parsed = parseTrackedRepoFullName(fullName);
  if (!parsed) return null;
  if (parsed.provider === "gitlab") {
    return { owner: "gitlab", name: parsed.pathWithNamespace };
  }
  return { owner: parsed.owner, name: parsed.repo };
}

function SourceIcon({ tech }: { tech: string }) {
  const isGitlab = tech.toLowerCase().includes("gitlab");
  const Icon = isGitlab ? IconBrandGitlab : IconBrandGithub;
  return <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />;
}

/** Tracked-repo pill — solid tint in light mode for readable contrast */
const inOrganizationBadgeClass =
  "inline-flex items-center gap-1 rounded-full border border-emerald-700/25 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/12 dark:text-emerald-100";

export function DashboardOrganizationPanel({
  discoverableRepos,
  trackedRepos,
  trackedCount,
  trackedLimit,
  businessName,
  hasGitProvider,
}: {
  discoverableRepos: SearchableRepo[];
  trackedRepos: OrganizationTrackedRepo[];
  trackedCount: number;
  trackedLimit: number;
  businessName?: string | null;
  hasGitProvider: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewFilter>("all");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [localTracked, setLocalTracked] = useState(
    () => new Set(trackedRepos.map((r) => r.fullName)),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalTracked(new Set(trackedRepos.map((r) => r.fullName)));
  }, [trackedRepos]);

  const effectiveTrackedCount = Math.max(trackedCount, localTracked.size);
  const atLimit = effectiveTrackedCount >= trackedLimit;

  const mergedRepos = useMemo((): MergedRepo[] => {
    const byFullName = new Map<string, MergedRepo>();

    for (const repo of discoverableRepos) {
      byFullName.set(repo.fullName, {
        ...repo,
        isTracked: localTracked.has(repo.fullName),
      });
    }

    for (const row of trackedRepos) {
      if (byFullName.has(row.fullName)) continue;
      byFullName.set(row.fullName, {
        id: `tracked-${row.fullName}`,
        fullName: row.fullName,
        name: row.name,
        detailHref: row.detailHref,
        unit: "Platform",
        tech: row.tech,
        isTracked: true,
      });
    }

    return Array.from(byFullName.values());
  }, [discoverableRepos, trackedRepos, localTracked]);

  const filteredRepos = useMemo(() => {
    const searchable = mergedRepos.map(({ isTracked: _t, ...repo }) => repo);
    const matchedIds = new Set(
      filterSearchableRepos(searchable, query).map((repo) => repo.id),
    );
    let list = mergedRepos.filter((repo) => matchedIds.has(repo.id));
    if (view === "available") {
      list = list.filter((repo) => !repo.isTracked);
    } else if (view === "tracked") {
      list = list.filter((repo) => repo.isTracked);
    }
    return [...list].sort((a, b) => {
      if (a.isTracked !== b.isTracked) return a.isTracked ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [mergedRepos, query, view]);

  const availableCount = mergedRepos.filter((r) => !r.isTracked).length;

  function runAction(
    fullName: string,
    action: "add" | "remove",
  ) {
    const params = actionParamsFromFullName(fullName);
    if (!params) {
      setMessage({ type: "error", text: "Invalid repository path." });
      return;
    }

    if (action === "remove") {
      const confirmed = window.confirm(
        `Remove ${fullName} from your organization? You can add it again anytime.`,
      );
      if (!confirmed) return;
    }

    setPendingKey(fullName);
    setMessage(null);

    startTransition(async () => {
      const result =
        action === "add"
          ? await addTrackedRepoAction(params.owner, params.name)
          : await removeTrackedRepoAction(params.owner, params.name);

      setPendingKey(null);

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error ?? "Something went wrong. Try again.",
        });
        return;
      }

      setLocalTracked((prev) => {
        const next = new Set(prev);
        if (action === "add") next.add(fullName);
        else next.delete(fullName);
        return next;
      });
      setMessage({
        type: "success",
        text:
          action === "add"
            ? `${fullName} is now in your organization.`
            : `${fullName} was removed from your organization.`,
      });
      router.refresh();
    });
  }

  return (
    <div data-tour="organization-panel" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Organization
          </h2>
          {businessName && (
            <p className="mt-1 text-base text-foreground/90">{businessName}</p>
          )}
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add repositories from your connected provider in one place. Tracked
            repos unlock health signals, access maps, and AI summaries across
            Ownbase.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground">
            <IconBuilding className="h-4 w-4 text-primary" aria-hidden />
            {effectiveTrackedCount} / {trackedLimit} tracked
          </span>
          <Link
            href="/dashboard/organization"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Risk & reports →
          </Link>
        </div>
      </div>

      {!hasGitProvider && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Connect GitHub or GitLab from your profile to browse and add
          repositories here.
        </div>
      )}

      {atLimit && (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          You&apos;ve reached your plan limit ({trackedLimit} repositories).{" "}
          <Link href="/dashboard/billing" className="font-medium text-primary hover:underline">
            Upgrade
          </Link>{" "}
          to add more.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, path, or category…"
            className="w-full rounded-lg border border-border/60 bg-muted/40 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
            aria-label="Search repositories"
          />
        </div>
        <ViewFilterChips view={view} onChange={setView} counts={{
          all: mergedRepos.length,
          available: availableCount,
          tracked: localTracked.size,
        }} />
      </div>

      {message && (
        <p
          role="alert"
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            message.type === "success"
              ? "border-emerald-700/25 bg-emerald-100 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-100"
              : "border-red-500/35 bg-red-100 text-red-900 dark:bg-red-500/10 dark:text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {filteredRepos.length === 0 ? (
        <EmptyState
          hasGitProvider={hasGitProvider}
          view={view}
          query={query}
        />
      ) : (
        <ul className="space-y-2" role="list">
          {filteredRepos.map((repo) => (
            <li key={repo.id}>
              <RepoOrganizationRow
                repo={repo}
                disabled={isPending}
                pending={pendingKey === repo.fullName}
                atLimit={atLimit && !repo.isTracked}
                onAdd={() => runAction(repo.fullName, "add")}
                onRemove={() => runAction(repo.fullName, "remove")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewFilterChips({
  view,
  onChange,
  counts,
}: {
  view: ViewFilter;
  onChange: (view: ViewFilter) => void;
  counts: { all: number; available: number; tracked: number };
}) {
  const chips: { key: ViewFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "available", label: "Not added", count: counts.available },
    { key: "tracked", label: "In org", count: counts.tracked },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            view === key
              ? "border-primary/45 bg-primary/15 text-foreground"
              : "border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
          }`}
        >
          {label}
          <span className="ml-1.5 text-xs opacity-70">({count})</span>
        </button>
      ))}
    </div>
  );
}

function RepoOrganizationRow({
  repo,
  disabled,
  pending,
  atLimit,
  onAdd,
  onRemove,
}: {
  repo: MergedRepo;
  disabled: boolean;
  pending: boolean;
  atLimit: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/85 p-4 shadow-sm transition hover:border-primary/25 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40">
          <SourceIcon tech={repo.tech} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{repo.name}</p>
            <span className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {repo.unit}
            </span>
            {repo.isTracked && (
              <span className={inOrganizationBadgeClass}>
                <IconCheck className="h-3 w-3 shrink-0" aria-hidden />
                In organization
              </span>
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{repo.fullName}</p>
          <p className="text-xs text-muted-foreground">{repo.tech}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={repo.detailHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/35 hover:text-primary"
        >
          Hub
          <IconExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        {repo.isTracked ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
          >
            <IconBuildingOff className="h-4 w-4" aria-hidden />
            {pending ? "Removing…" : "Remove"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={disabled || atLimit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-linear-to-r from-primary/90 to-accent-violet/85 px-3 py-2 text-sm font-semibold text-foreground shadow-[0_6px_20px_rgba(34,211,238,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconPlus className="h-4 w-4" aria-hidden />
            {pending ? "Adding…" : "Add to organization"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  hasGitProvider,
  view,
  query,
}: {
  hasGitProvider: boolean;
  view: ViewFilter;
  query: string;
}) {
  let body: ReactNode;
  if (!hasGitProvider) {
    body = "Connect a Git provider to see repositories you can add.";
  } else if (query.trim()) {
    body = "No repositories match your search. Try different keywords.";
  } else if (view === "available") {
    body = "Every linked repository is already in your organization.";
  } else if (view === "tracked") {
    body = "No repositories tracked yet. Switch to “Not added” and pick repos to include.";
  } else {
    body = "No repositories found. Check your provider connection or try again shortly.";
  }

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/25 px-6 py-12 text-center">
      <IconBuilding className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
      <p className="mt-4 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
