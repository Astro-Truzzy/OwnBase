"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconDownload,
  IconFilter,
} from "@tabler/icons-react";
import Link from "next/link";
import { DashboardTodoPanel } from "./dashboard-todo-panel";
import { SystemHealthTrendChart } from "./system-health-trend-chart";
import {
  applyPortfolioCategoryFilter,
  filterSearchableRepos,
  type PortfolioFilterKey,
  type SearchableRepo,
} from "@/lib/dashboard/searchable-repos";
import { useDashboardSearch } from "./dashboard-search-context";
import {
  DASHBOARD_PORTFOLIO_FILTER_CHANGED,
  parsePortfolioFilterParam,
} from "./dashboard-todo-navigation";
import {
  DASHBOARD_TAB_CHANGED,
  readDashboardTabHash,
  setDashboardTabHash,
  type DashboardTabKey,
} from "./dashboard-tab-hash";

type TabKey = DashboardTabKey;

export interface DashboardRepoView {
  id: string;
  fullName: string;
  detailHref: string;
  name: string;
  unit: string;
  tech: string;
  health: number;
  contributors: number;
  lastActivity: string;
  status: "healthy" | "warning" | "critical";
  busFactor: number;
  description: string;
}

function statusMeta(status: DashboardRepoView["status"]): {
  label: string;
  dot: string;
} {
  switch (status) {
    case "healthy":
      return { label: "Healthy", dot: "bg-emerald-500" };
    case "critical":
      return { label: "Critical", dot: "bg-rose-500" };
    default:
      return { label: "Review", dot: "bg-amber-500" };
  }
}

export interface DashboardActivityView {
  action: string;
  repo: string;
  user: string;
  time: string;
  type: "deploy" | "merge" | "docs" | "security" | "audit";
}

export interface DashboardTeamView {
  name: string;
  role: string;
  domains: string[];
  access: "Admin" | "Write" | "Read";
  avatar: string;
  status: "active" | "warning";
}

export interface DashboardTodoView {
  id: string;
  title: string;
  desc: string;
  href: string;
}

interface DashboardTabsViewProps {
  repositories: DashboardRepoView[];
  /** GitHub/GitLab repos available before any are tracked in Ownbase. */
  discoverableRepos?: SearchableRepo[];
  activities: DashboardActivityView[];
  summary: {
    healthScore: number | null;
    totalSystems: number;
    teamMembers: number;
    docsCoverage: number | null;
  };
  isNewWorkspace: boolean;
  hasPortfolioData: boolean;
  hasTrendData: boolean;
  trendMonthLabels: string[];
  showTodos?: boolean;
  todos: DashboardTodoView[];
  currentTrendValues: number[];
  previousQuarterValues: number[];
  industryAverageValues: number[];
}

function detailHrefFromRepo(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export function DashboardTabsView({
  repositories,
  discoverableRepos = [],
  activities,
  summary,
  isNewWorkspace,
  hasPortfolioData,
  hasTrendData,
  trendMonthLabels,
  showTodos = true,
  todos,
  currentTrendValues,
  previousQuarterValues,
  industryAverageValues,
}: DashboardTabsViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [filter, setFilter] = useState<PortfolioFilterKey>(() => {
    const fromUrl = parsePortfolioFilterParam(searchParams.get("pf"));
    return fromUrl ?? "all";
  });
  const { searchQuery, clearSearch, setSearchableRepos, isSearchActive } =
    useDashboardSearch();

  useEffect(() => {
    const searchable: SearchableRepo[] =
      repositories.length > 0
        ? repositories.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.fullName,
            detailHref: repo.detailHref,
            unit: repo.unit,
            tech: repo.tech,
          }))
        : discoverableRepos;
    setSearchableRepos(searchable);
  }, [repositories, discoverableRepos, setSearchableRepos]);

  useEffect(() => {
    const pf = parsePortfolioFilterParam(searchParams.get("pf"));
    if (pf) setFilter(pf);
  }, [searchParams]);

  useEffect(() => {
    const onPortfolioFilter = (event: Event) => {
      const detail = (event as CustomEvent<{ filter: PortfolioFilterKey }>)
        .detail;
      if (detail?.filter) setFilter(detail.filter);
    };
    window.addEventListener(
      DASHBOARD_PORTFOLIO_FILTER_CHANGED,
      onPortfolioFilter,
    );
    return () => {
      window.removeEventListener(
        DASHBOARD_PORTFOLIO_FILTER_CHANGED,
        onPortfolioFilter,
      );
    };
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace("#", "");
      if (raw === "organization") {
        window.location.replace("/dashboard/organization");
        return;
      }
      if (isSearchActive) {
        setActiveTab("portfolio");
        setDashboardTabHash("portfolio");
        return;
      }
      const tab = readDashboardTabHash();
      setActiveTab(tab);
      if (tab === "portfolio") {
        const pf = parsePortfolioFilterParam(
          new URLSearchParams(window.location.search).get("pf"),
        );
        if (pf) setFilter(pf);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener(DASHBOARD_TAB_CHANGED, syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener(DASHBOARD_TAB_CHANGED, syncFromHash);
    };
  }, [isSearchActive, pathname]);

  useEffect(() => {
    if (!isSearchActive) return;
    setActiveTab("portfolio");
    setDashboardTabHash("portfolio");
  }, [isSearchActive]);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    setDashboardTabHash(tab);
  }

  const filteredRepos = useMemo(() => {
    const categoryMatched = applyPortfolioCategoryFilter(
      repositories,
      filter,
      (repo) => repo.busFactor <= 1 || repo.status === "critical",
    );
    const searchable = categoryMatched.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      detailHref: repo.detailHref,
      unit: repo.unit,
      tech: repo.tech,
    }));
    const matchedIds = new Set(
      filterSearchableRepos(searchable, searchQuery).map((r) => r.id),
    );
    return categoryMatched.filter((r) => matchedIds.has(r.id));
  }, [repositories, filter, searchQuery]);

  const overviewRepos = useMemo(() => {
    const searchable = repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      detailHref: repo.detailHref,
      unit: repo.unit,
      tech: repo.tech,
    }));
    const matchedIds = new Set(
      filterSearchableRepos(searchable, searchQuery).map((r) => r.id),
    );
    return repositories.filter((r) => matchedIds.has(r.id));
  }, [repositories, searchQuery]);

  const inDiscoverableMode =
    repositories.length === 0 && discoverableRepos.length > 0;

  const filteredDiscoverable = useMemo(() => {
    const categoryMatched = applyPortfolioCategoryFilter(
      discoverableRepos,
      filter,
      (repo) =>
        repo.unit.toLowerCase() === "security" ||
        repo.name.toLowerCase().includes("auth"),
    );
    return filterSearchableRepos(categoryMatched, searchQuery);
  }, [discoverableRepos, filter, searchQuery]);

  const showDiscoverableList = inDiscoverableMode;
  const recentActivity = activities.slice(0, 5);
  const showTrendChart = hasTrendData && !isNewWorkspace;

  function exportPortfolioCsv() {
    const csvEscape = (value: string | number) => {
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    };
    const rows = [
      [
        "Repository",
        "Full Name",
        "Tech Stack",
        "Activity score",
        "Contributors",
        "Bus Factor",
        "Last activity",
        "Status",
      ],
      ...filteredRepos.map((repo) => [
        repo.name,
        repo.fullName,
        repo.tech,
        repo.health,
        repo.contributors,
        repo.busFactor,
        repo.lastActivity,
        repo.status,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ownbase-portfolio-${filter}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {activeTab === "dashboard" && (
        <div data-tour="overview-panel" className="space-y-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Overview
          </h1>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-border py-5 lg:grid-cols-4">
            <Stat
              label="Activity"
              value={
                summary.healthScore != null ? `${summary.healthScore}` : "—"
              }
              hint={summary.healthScore != null ? "/100" : undefined}
            />
            <Stat
              label="Repos"
              value={isNewWorkspace ? "—" : `${summary.totalSystems}`}
            />
            <Stat
              label="Team"
              value={isNewWorkspace ? "—" : `${summary.teamMembers}`}
            />
            <Stat
              label="Docs"
              value={
                summary.docsCoverage != null ? `${summary.docsCoverage}` : "—"
              }
              hint={summary.docsCoverage != null ? "%" : undefined}
            />
          </dl>

          {showTodos && (
            <DashboardTodoPanel
              todos={todos}
              isNewWorkspace={isNewWorkspace}
              hasPortfolioData={hasPortfolioData}
            />
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Repositories
              </h2>
              <button
                type="button"
                onClick={() => switchTab("portfolio")}
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                View all
              </button>
            </div>
            {showDiscoverableList ? (
              <ul className="divide-y divide-border border-y border-border">
                {filteredDiscoverable.slice(0, 5).map((repo) => (
                  <li key={repo.id}>
                    <DiscoverableRepoRow repo={repo} />
                  </li>
                ))}
              </ul>
            ) : repositories.length === 0 ? (
              <p className="border-y border-border py-8 text-sm text-muted-foreground">
                No repositories yet.{" "}
                <Link
                  href="/dashboard/organization"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Add from Organization
                </Link>
                {" or "}
                <Link
                  href="/dashboard/upload"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  upload a project
                </Link>
                .
              </p>
            ) : overviewRepos.length === 0 ? (
              <p className="border-y border-border py-8 text-sm text-muted-foreground">
                No repositories match your search.
              </p>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {overviewRepos.slice(0, 5).map((repo) => (
                  <li key={repo.id}>
                    <OverviewRepoRow repo={repo} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {recentActivity.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Recent activity
              </h2>
              <ul className="divide-y divide-border border-y border-border">
                {recentActivity.map((entry, idx) => (
                  <li key={`${entry.action}-${idx}`}>
                    <Link
                      href={detailHrefFromRepo(entry.repo)}
                      className="flex items-baseline justify-between gap-4 rounded-lg py-3 transition hover:bg-muted/50 sm:px-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {entry.action}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {entry.repo}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {entry.time}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showTrendChart && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Activity trend
              </h2>
              <SystemHealthTrendChart
                months={trendMonthLabels}
                currentValues={currentTrendValues}
                previousQuarterValues={previousQuarterValues}
                industryAverageValues={industryAverageValues}
              />
            </section>
          )}
        </div>
      )}

      {activeTab === "portfolio" && (
        <div data-tour="portfolio-panel" className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Repositories
            </h1>
            <div className="flex items-center gap-2">
              {(filter !== "all" || searchQuery.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    clearSearch();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <IconFilter className="h-4 w-4" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={exportPortfolioCsv}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <IconDownload className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="flex gap-1 border-b border-border">
            {(
              [
                ["all", "All"],
                ["critical", "Critical"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                  filter === key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showDiscoverableList ? (
            filteredDiscoverable.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                No repositories match this filter.
              </p>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {filteredDiscoverable.map((repo) => (
                  <li key={repo.id}>
                    <DiscoverableRepoRow repo={repo} />
                  </li>
                ))}
              </ul>
            )
          ) : repositories.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No repositories yet.{" "}
              <Link
                href="/dashboard/organization"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Add from Organization
              </Link>
              {" or "}
              <Link
                href="/dashboard/upload"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                upload a project
              </Link>
              .
            </p>
          ) : filteredRepos.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No repositories match your current filters.
            </p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {filteredRepos.map((repo) => (
                <li key={repo.id}>
                  <OverviewRepoRow repo={repo} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
        {hint ? (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function SourceIcon({ tech }: { tech: string }) {
  const isGitlab = tech.toLowerCase().includes("gitlab");
  const Icon = isGitlab ? IconBrandGitlab : IconBrandGithub;
  return (
    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
  );
}

function DiscoverableRepoRow({ repo }: { repo: SearchableRepo }) {
  return (
    <Link
      href={repo.detailHref}
      className="flex items-center gap-3 rounded-lg py-3 transition hover:bg-muted/50 sm:px-2"
    >
      <SourceIcon tech={repo.tech} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {repo.name}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {repo.fullName}
        </span>
      </span>
    </Link>
  );
}

function OverviewRepoRow({ repo }: { repo: DashboardRepoView }) {
  const status = statusMeta(repo.status);
  return (
    <Link
      href={repo.detailHref}
      className="flex items-center gap-3 rounded-lg py-3 transition hover:bg-muted/50 sm:px-2"
    >
      <SourceIcon tech={repo.tech} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {repo.name}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {repo.fullName}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-3 sm:flex">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
          {repo.health}
        </span>
      </span>
    </Link>
  );
}
