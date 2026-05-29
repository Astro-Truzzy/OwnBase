"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconBolt,
  IconBrandGithub,
  IconBrandGitlab,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCrown,
  IconDownload,
  IconExternalLink,
  IconFilter,
  IconFolder,
  IconGitCommit,
  IconGitPullRequest,
  IconRocket,
  IconSearch,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { InfoHint } from "@/components/dashboard/info-hint";
import { DashboardOrganizationPanel } from "./dashboard-organization-panel";
import type { OrganizationTrackedRepo } from "./dashboard-organization-panel";
import { DashboardTodoPanel } from "./dashboard-todo-panel";
import { KnowledgeRiskMatrixChart } from "./knowledge-risk-matrix-chart";
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
  lastDeploy: string;
  status: "healthy" | "warning" | "critical";
  busFactor: number;
  description: string;
}

function repoStatusBadge(status: DashboardRepoView["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "healthy":
      return {
        label: "Healthy",
        className:
          "border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-100",
      };
    case "critical":
      return {
        label: "Critical",
        className:
          "border-rose-500/40 bg-rose-500/12 text-rose-900 dark:text-rose-100",
      };
    default:
      return {
        label: "Review",
        className:
          "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-100",
      };
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

export interface DashboardOnboardingView {
  name: string;
  role: string;
  startDate: string;
  repo: string;
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
  organizationTracked?: OrganizationTrackedRepo[];
  trackedLimit?: number;
  businessName?: string | null;
  hasGitProvider?: boolean;
  activities: DashboardActivityView[];
  team: DashboardTeamView[];
  onboarding: DashboardOnboardingView[];
  viewer: {
    displayName: string;
    plan: string | null;
  };
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

function minutesFromRelativeLabel(value: string): number | null {
  const text = value.trim().toLowerCase();
  const match = text.match(/^(\d+)\s*([mhd])/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (match[2] === "m") return amount;
  if (match[2] === "h") return amount * 60;
  if (match[2] === "d") return amount * 24 * 60;
  return null;
}

export function DashboardTabsView({
  repositories,
  discoverableRepos = [],
  organizationTracked = [],
  trackedLimit = 5,
  businessName = null,
  hasGitProvider = false,
  activities,
  team,
  onboarding,
  viewer,
  summary,
  isNewWorkspace,
  hasPortfolioData,
  hasTrendData,
  trendMonthLabels,
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
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [activityWindowIndex, setActivityWindowIndex] = useState(1);

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

  function exportPortfolioCsv() {
    const csvEscape = (value: string | number) => {
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    };
    const rows = [
      [
        "Repository",
        "Full Name",
        "Business Function",
        "Tech Stack",
        "Health",
        "Contributors",
        "Bus Factor",
        "Last Deploy",
        "Status",
      ],
      ...filteredRepos.map((repo) => [
        repo.name,
        repo.fullName,
        repo.unit,
        repo.tech,
        repo.health,
        repo.contributors,
        repo.busFactor,
        repo.lastDeploy,
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

  const selectedRepo =
    repositories.find((r) => r.id === selectedRepoId) ?? null;
  const contributorsBars = repositories
    .slice(0, 6)
    .map((r) => ({ label: r.name.split(" ")[0], value: r.contributors }));
  const activityWindows = [
    { label: "Today", maxMinutes: 24 * 60 },
    { label: "This week", maxMinutes: 7 * 24 * 60 },
    { label: "This month", maxMinutes: 30 * 24 * 60 },
  ] as const;
  const activeActivityWindow = activityWindows[activityWindowIndex];
  const operationsActivities = useMemo(() => {
    const filtered = activities.filter((entry) => {
      const minutes = minutesFromRelativeLabel(entry.time);
      if (minutes == null) return activeActivityWindow.label === "This month";
      return minutes <= activeActivityWindow.maxMinutes;
    });
    return filtered.length > 0 ? filtered : activities.slice(0, 8);
  }, [activities, activeActivityWindow]);
  const adminCount = team.filter((member) => member.access === "Admin").length;
  const writeCount = team.filter((member) => member.access === "Write").length;
  const readCount = team.filter((member) => member.access === "Read").length;
  const securityEventsCount = activities.filter(
    (entry) => entry.type === "security",
  ).length;
  const accessReviewUrgent = securityEventsCount > 0;
  const normalizedPlan = (viewer.plan ?? "free").toLowerCase();
  const planBadgeClass =
    normalizedPlan === "enterprise"
      ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
      : normalizedPlan === "pro"
        ? "border-primary/45 bg-primary/15 text-primary"
        : "border-border bg-muted text-muted-foreground";
  const planIcon =
    normalizedPlan === "enterprise" ? (
      <IconCrown className="h-3.5 w-3.5" />
    ) : normalizedPlan === "pro" ? (
      <IconSparkles className="h-3.5 w-3.5" />
    ) : (
      <IconBolt className="h-3.5 w-3.5" />
    );

  const healthHint = isNewWorkspace
    ? "Available after you track a repository"
    : hasPortfolioData
      ? "Average across connected repositories"
      : "Track repositories to calculate";
  const reposHint = isNewWorkspace
    ? "Connect a provider, then add repos in Organization"
    : hasPortfolioData
      ? `${summary.totalSystems} tracked in Organization`
      : "Track repos under Organization to populate";
  const teamHint = isNewWorkspace
    ? "Shows collaborators on tracked repositories"
    : summary.teamMembers > 0
      ? `${summary.teamMembers} across your portfolio`
      : "Appears after collaborator data is available";
  const docsHint = isNewWorkspace
    ? "Run AI summaries on tracked repos to measure coverage"
    : (summary.docsCoverage ?? 0) > 0
      ? "Based on generated AI summaries"
      : "Generate summaries to measure coverage";
  const showTrendChart = hasTrendData && !isNewWorkspace;

  return (
    <div className="dash-hero relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-8">
      <div className="dash-hero-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div className="min-w-0 space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome to Ownbase, {viewer.displayName}!
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Your workspace for repository ownership, health signals, and team
            access.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${planBadgeClass}`}
        >
          {planIcon}
          Plan: {viewer.plan ?? "free"}
        </span>
      </div>

      {!isNewWorkspace && (
        <div className="relative mb-6 flex flex-wrap items-center gap-2">
          <PremiumSignalBadge
            label="Portfolio health"
            value={`${summary.healthScore ?? 0}/100`}
            tone="cyan"
          />
          <PremiumSignalBadge
            label="Risk posture"
            value={securityEventsCount > 0 ? "Elevated" : "Stable"}
            tone={securityEventsCount > 0 ? "amber" : "violet"}
          />
          <PremiumSignalBadge
            label="Repositories"
            value={`${summary.totalSystems} connected`}
            tone="violet"
          />
        </div>
      )}

      <div
        data-tour="dashboard-tabs"
        className="relative mb-8 flex flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-muted/25 p-1"
      >
        {(
          [
            ["dashboard", "Overview", "tab-overview"],
            ["organization", "Organization", "tab-organization"],
            ["portfolio", "Repositories", "tab-portfolio"],
            ["operations", "Activity", "tab-operations"],
          ] as const
        ).map(([key, label, tourId]) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              data-tour={tourId}
              onClick={() => switchTab(key)}
              className={`relative flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition sm:flex-none sm:px-5 ${
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <div data-tour="overview-panel" className="space-y-8">
          <div className="stagger-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Portfolio Health"
              value={summary.healthScore != null ? `${summary.healthScore}` : "—"}
              suffix={summary.healthScore != null ? "/100" : ""}
              hint={healthHint}
              unavailable={isNewWorkspace}
            />
            <StatCard
              title="Active Repositories"
              value={isNewWorkspace ? "—" : `${summary.totalSystems}`}
              suffix={isNewWorkspace ? "" : "systems"}
              hint={reposHint}
              unavailable={isNewWorkspace}
            />
            <StatCard
              title="Team Members"
              value={isNewWorkspace ? "—" : `${summary.teamMembers}`}
              suffix={isNewWorkspace ? "" : "contributors"}
              hint={teamHint}
              unavailable={isNewWorkspace}
            />
            <StatCard
              title="Documentation"
              value={
                summary.docsCoverage != null ? `${summary.docsCoverage}` : "—"
              }
              suffix={summary.docsCoverage != null ? "% coverage" : ""}
              hint={docsHint}
              unavailable={isNewWorkspace}
            />
          </div>

          <div className="stagger-grid grid grid-cols-1 gap-6">
            <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  System Health Trend
                </h3>
                <p className="text-sm text-muted-foreground">
                  Composite score across all repositories
                </p>
              </div>
              <SystemHealthTrendChart
                months={trendMonthLabels}
                currentValues={currentTrendValues}
                previousQuarterValues={previousQuarterValues}
                industryAverageValues={industryAverageValues}
                empty={!showTrendChart}
                emptyMessage={
                  isNewWorkspace
                    ? "Connect a provider and track your first repository to start building health trends from real activity."
                    : hasPortfolioData
                      ? "Monthly health trends appear once there is activity on your tracked repositories."
                      : "Track repositories in Organization to start building health trends from your activity."
                }
              />
            </div>

            <div className="stagger-item min-w-0">
              <DashboardTodoPanel
                todos={todos}
                isNewWorkspace={isNewWorkspace}
                hasPortfolioData={hasPortfolioData}
              />
            </div>
          </div>

          <div className="dash-inset-panel stagger-item rounded-xl p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  Your repositories
                </h3>
                <p className="text-sm text-muted-foreground">
                  Search from the top bar. Open the hub for summaries, access, and
                  activity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchTab("portfolio")}
                className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {showDiscoverableList ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => switchTab("organization")}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Open Organization
                    </button>{" "}
                    to add repos in one click, or open a hub for full detail.
                  </p>
                  {filteredDiscoverable.slice(0, 8).map((repo) => (
                    <DiscoverableRepoRow key={repo.id} repo={repo} />
                  ))}
                </>
              ) : repositories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
                  No repositories yet. Connect GitHub or GitLab, then use the{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("organization")}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Organization
                  </button>{" "}
                  tab to add repos, or{" "}
                  <Link
                    href="/dashboard/upload"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    upload a project
                  </Link>
                  .
                </p>
              ) : overviewRepos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
                  No repositories match your search. Try different keywords in the
                  header search bar.
                </p>
              ) : (
                overviewRepos.slice(0, 8).map((repo) => (
                  <OverviewRepoRow key={repo.id} repo={repo} />
                ))
              )}
            </div>
          </div>

          <div className="stagger-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
              <h3 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
                Recent Changes
              </h3>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="rounded-sm border border-border/50 bg-muted/50 p-3 text-sm text-muted-foreground">
                    No recent changes yet. Activity will appear after repository
                    actions.
                  </p>
                ) : (
                  activities.slice(0, 3).map((a, idx) => (
                    <div
                      key={`${a.action}-${idx}`}
                      className="rounded-lg border border-border/60 bg-muted/50 p-3 transition hover:border-primary/40"
                    >
                      <p className="text-sm font-medium text-foreground">
                        <Link
                          href={detailHrefFromRepo(a.repo)}
                          className="transition hover:text-primary"
                        >
                          {a.action}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.repo} • {a.time}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Knowledge Distribution
                </h3>
                <InfoHint label="About Knowledge Distribution">
                  <p className="font-medium text-foreground">
                    Who holds access per repository
                  </p>
                  <p className="mt-1.5">
                    Each bar shows how many collaborators can work on a tracked
                    repo. Fewer people with access means more knowledge
                    concentration — and higher risk if someone leaves.
                  </p>
                  <p className="mt-1.5">
                    Use this to spot repos that depend on one or two people and
                    may need backup access or documentation.
                  </p>
                </InfoHint>
              </div>
              <div className="space-y-3">
                {contributorsBars.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add repositories to view contributor distribution.
                  </p>
                ) : (
                  contributorsBars.map((b) => (
                    <div key={b.label}>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{b.label}</span>
                        <span>{b.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-border/80">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-primary to-accent-violet"
                          style={{ width: `${Math.min(100, b.value * 15)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="dash-promo relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-accent-violet/25"
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Ownbase
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Turn repository signals into ownership you can prove.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Summaries, access maps, and uploads stay in one workspace so
                  your team always knows what runs the business.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Link
                  href="/dashboard/organization"
                  className="inline-flex justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 transition hover:brightness-105 dark:shadow-lg dark:shadow-primary/20"
                >
                  Get started
                </Link>
                <Link
                  href="/pricing"
                  className="dash-btn-secondary inline-flex justify-center rounded-xl px-5 py-2.5 text-sm font-medium"
                >
                  View plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "organization" && (
        <DashboardOrganizationPanel
          discoverableRepos={discoverableRepos}
          trackedRepos={organizationTracked}
          trackedCount={summary.totalSystems}
          trackedLimit={trackedLimit}
          businessName={businessName}
          hasGitProvider={hasGitProvider}
        />
      )}

      {activeTab === "portfolio" && (
        <div data-tour="portfolio-panel" className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Repository Portfolio
              </h2>
              <p className="text-muted-foreground">
                Complete inventory of your software assets and their business
                context
              </p>
            </div>
            <div className="flex gap-3">
              {(filter !== "all" || searchQuery.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    clearSearch();
                  }}
                  className="magnetic-cta inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/55 px-4 py-2 text-sm text-foreground"
                >
                  <IconFilter className="h-4 w-4" />
                  Reset filters
                </button>
              )}
              <button
                onClick={exportPortfolioCsv}
                className="magnetic-cta inline-flex items-center gap-2 rounded-lg border border-primary/35 bg-linear-to-r from-primary/90 to-accent-violet/90 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_28px_rgba(34,211,238,0.25)]"
              >
                <IconDownload className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <IconSearch className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              {showDiscoverableList
                ? `${filteredDiscoverable.length} GitHub repositor${filteredDiscoverable.length === 1 ? "y" : "ies"} linked to your account`
                : `${filteredRepos.length} match${filteredRepos.length === 1 ? "" : "es"} — refine with the header search and filters below.`}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              ["all", "All Systems"],
              ["critical", "Critical"],
              ["finance", "Finance"],
              ["operations", "Operations"],
              ["security", "Security"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  filter === key
                    ? "border-primary bg-primary text-primary-foreground shadow-sm dark:border-primary/45 dark:bg-linear-to-r dark:from-primary/90 dark:to-accent-violet/90 dark:text-white dark:shadow-[0_8px_24px_rgba(34,211,238,0.2)]"
                    : "border-border/60 bg-muted/55 text-foreground hover:border-primary/30 hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showDiscoverableList ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Repositories linked to your account. Use the{" "}
                <button
                  type="button"
                  onClick={() => switchTab("organization")}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Organization
                </button>{" "}
                tab to add them in one click.
              </p>
              {filteredDiscoverable.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/55 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No repositories match this filter. Try &quot;All Systems&quot; or
                  another category.
                </div>
              ) : (
                <div className="stagger-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDiscoverable.map((repo) => (
                    <DiscoverableRepoRow key={repo.id} repo={repo} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            repositories.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/55 bg-muted/40 p-8 text-center">
                <p className="text-base font-medium text-foreground">
                  No repositories in your portfolio yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect GitHub or GitLab, open a repository, and add it to your
                  organization—or upload a project zip.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/dashboard/organization"
                    className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Set up organization
                  </Link>
                  <Link
                    href="/dashboard/upload"
                    className="dash-btn-secondary inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Upload a project
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-border hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            )
          )}

          {!showDiscoverableList && (
            <>
              <div className="stagger-grid grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepoId(repo.id)}
                    className="stagger-item magnetic-card rounded-xl border border-border/50 bg-card/90 p-6 text-left shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/30 transition duration-300 hover:border-primary/35 hover:bg-muted/80"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-lg font-semibold tracking-tight text-foreground">
                        {repo.name}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${repoStatusBadge(repo.status).className}`}
                      >
                        {repoStatusBadge(repo.status).label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {repo.unit} • {repo.tech}
                    </p>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Health Score</span>
                        <span>{repo.health}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border/80">
                        <div
                          className={`h-full rounded-full ${repo.health > 85 ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${repo.health}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {repositories.length > 0 && filteredRepos.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/55 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No repositories match your current filters. Try resetting filters
                  or search.
                </div>
              )}
            </>
          )}

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/90 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 p-4">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Detailed Registry
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Repository</th>
                  <th className="px-4 py-3">Business Function</th>
                  <th className="px-4 py-3">Tech Stack</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Bus Factor</th>
                  <th className="px-4 py-3">Last Deploy</th>
                </tr>
              </thead>
              <tbody>
                {showDiscoverableList ? (
                  filteredDiscoverable.length === 0 ? (
                    <tr className="border-t border-border/50">
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No registry entries to display for the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDiscoverable.map((repo) => (
                      <tr
                        key={`reg-${repo.id}`}
                        className="group border-t border-border/50 transition hover:bg-accent/10"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link
                            href={repo.detailHref}
                            className="inline-flex items-center transition hover:text-primary"
                          >
                            {repo.name}
                            <span className="ml-2 h-0.5 w-0 rounded-full bg-primary transition-all duration-300 group-hover:w-5" />
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{repo.unit}</td>
                        <td className="px-4 py-3 text-muted-foreground">{repo.tech}</td>
                        <td className="px-4 py-3 text-muted-foreground">—</td>
                        <td className="px-4 py-3 text-muted-foreground">Track to assess</td>
                        <td className="px-4 py-3 text-muted-foreground">—</td>
                      </tr>
                    ))
                  )
                ) : filteredRepos.length === 0 ? (
                  <tr className="border-t border-border/50">
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No registry entries to display for the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredRepos.map((repo) => (
                    <tr
                      key={`reg-${repo.id}`}
                      className="group border-t border-border/50 transition hover:bg-accent/10"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          href={repo.detailHref}
                          className="inline-flex items-center transition hover:text-primary"
                        >
                          {repo.name}
                          <span className="ml-2 h-0.5 w-0 rounded-full bg-primary transition-all duration-300 group-hover:w-5" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{repo.unit}</td>
                      <td className="px-4 py-3 text-muted-foreground">{repo.tech}</td>
                      <td className="px-4 py-3">{repo.health}</td>
                      <td className="px-4 py-3">
                        {repo.busFactor <= 1
                          ? "Critical"
                          : repo.busFactor === 2
                            ? "At Risk"
                            : "Distributed"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {repo.lastDeploy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "operations" && (
        <div data-tour="operations-panel" className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Operations Center
            </h2>
            <p className="text-muted-foreground">
              Team management, access control, and operational intelligence
            </p>
          </div>

          <div className="stagger-grid grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Team Composition
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Active contributors and their domain expertise
                  </p>
                </div>
                <Link
                  href="/dashboard/devs"
                  className="magnetic-cta rounded-lg border border-primary/35 bg-linear-to-r from-primary/90 to-accent-violet/90 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_28px_rgba(34,211,238,0.2)]"
                >
                  Manage Access
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {team.length === 0 ? (
                  <p className="rounded-sm border border-border/50 bg-muted/50 p-4 text-sm text-muted-foreground md:col-span-2">
                    Team access entries will appear here after collaborators are
                    added.
                  </p>
                ) : (
                  team.map((m) => (
                    <div
                      key={m.name}
                      className="rounded-sm border border-border/50 bg-muted/50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-muted text-sm font-medium text-foreground">
                            {m.avatar}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {m.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{m.role}</p>
                          </div>
                        </div>
                        <span className="rounded-sm border border-border/50 px-2 py-1 text-xs text-muted-foreground">
                          {m.access}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {m.domains.map((d) => (
                          <span
                            key={`${m.name}-${d}`}
                            className="rounded-sm border border-border/50 px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="stagger-item space-y-6">
              <div className="rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                  Access Distribution
                </h3>
                <ProgressRow
                  label="Admin Access"
                  value={adminCount}
                  max={Math.max(team.length, 1)}
                />
                <ProgressRow
                  label="Write Access"
                  value={writeCount}
                  max={Math.max(team.length, 1)}
                />
                <ProgressRow
                  label="Read Only"
                  value={readCount}
                  max={Math.max(team.length, 1)}
                />
              </div>
              <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-6">
                <div className="flex items-start gap-3">
                  <IconAlertCircle className="h-5 w-5 text-amber-300" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Security Alert
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {accessReviewUrgent
                        ? `${securityEventsCount} recent security-related access event${securityEventsCount === 1 ? "" : "s"} need review.`
                        : "No active security alerts detected from recent activity."}
                    </p>
                    <Link
                      href="/dashboard/devs"
                      className="mt-2 inline-block text-sm font-medium text-amber-300 hover:underline"
                    >
                      {accessReviewUrgent
                        ? "Review immediately"
                        : "Open access center"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stagger-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Activity Log
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <button
                    onClick={() =>
                      setActivityWindowIndex((idx) => Math.max(0, idx - 1))
                    }
                    disabled={activityWindowIndex === 0}
                    className="rounded-sm p-1.5 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm">{activeActivityWindow.label}</span>
                  <button
                    onClick={() =>
                      setActivityWindowIndex((idx) =>
                        Math.min(activityWindows.length - 1, idx + 1),
                      )
                    }
                    disabled={
                      activityWindowIndex === activityWindows.length - 1
                    }
                    className="rounded-sm p-1.5 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {operationsActivities.length === 0 ? (
                  <p className="rounded-sm border border-border/50 bg-muted/50 p-3 text-sm text-muted-foreground">
                    No activity for this period yet.
                  </p>
                ) : (
                  operationsActivities.map((a, idx) => (
                    <div
                      key={`ops-act-${idx}`}
                      className="rounded-sm border border-border/50 bg-muted/50 p-3"
                    >
                      <div className="flex items-start gap-3">
                        {a.type === "deploy" ? (
                          <IconRocket className="h-4 w-4 text-emerald-300" />
                        ) : a.type === "merge" ? (
                          <IconGitPullRequest className="h-4 w-4 text-muted-foreground" />
                        ) : a.type === "docs" ? (
                          <IconSearch className="h-4 w-4 text-primary" />
                        ) : a.type === "security" ? (
                          <IconShieldCheck className="h-4 w-4 text-violet-300" />
                        ) : (
                          <IconGitCommit className="h-4 w-4 text-amber-300" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            <Link
                              href={detailHrefFromRepo(a.repo)}
                              className="hover:text-primary"
                            >
                              {a.action}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.repo} • {a.user} • {a.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Knowledge Risk Matrix
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Where knowledge is concentrated vs. spread across collaborators
                  </p>
                </div>
                <IconChartBar
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </div>
              <KnowledgeRiskMatrixChart repositories={repositories} />
            </div>
          </div>

          <div className="stagger-item rounded-xl border border-border/60 bg-card/85 p-6 shadow-md shadow-slate-200/60 dark:shadow-xl dark:shadow-black/25 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Recent access changes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Collaborators added from your activity log
                </p>
              </div>
              <Link
                href="/dashboard/organization"
                className="rounded-lg border border-border/60 bg-muted/60 px-4 py-2 text-sm text-foreground transition hover:border-primary/35 hover:bg-primary/10"
              >
                View organization
              </Link>
            </div>
            <div className="space-y-3">
              {onboarding.length === 0 ? (
                <p className="rounded-sm border border-border/50 bg-muted/50 p-4 text-sm text-muted-foreground">
                  No collaborator additions logged yet.
                </p>
              ) : (
                onboarding.map((o) => (
                  <div
                    key={`${o.name}-${o.repo}-${o.startDate}`}
                    className="rounded-sm border border-border/50 bg-muted/50 p-4"
                  >
                    <p className="text-sm font-medium text-foreground">{o.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {o.role} • {o.repo} • {o.startDate}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border/60 bg-card/95 shadow-[0_30px_80px_rgba(4,10,32,0.55)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 p-6 backdrop-blur">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  {selectedRepo.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRepo.unit} • {selectedRepo.tech}
                </p>
              </div>
              <button
                onClick={() => setSelectedRepoId(null)}
                className="rounded-md p-2 transition hover:bg-muted/80"
              >
                <IconX className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selectedRepo.description}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricBox
                  label="Health Score"
                  value={`${selectedRepo.health}/100`}
                />
                <MetricBox
                  label="Contributors"
                  value={`${selectedRepo.contributors}`}
                />
                <MetricBox
                  label="Bus Factor"
                  value={`${selectedRepo.busFactor}`}
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={selectedRepo.detailHref}
                  className="rounded-md border border-border/60 bg-primary/20 px-4 py-2 text-sm text-foreground transition hover:-translate-y-0.5 hover:bg-primary/30"
                >
                  Open Repository
                </Link>
                <Link
                  href={`${selectedRepo.detailHref}#access`}
                  className="rounded-md border border-border/50 bg-muted/50 px-4 py-2 text-sm text-foreground transition hover:bg-muted/80"
                >
                  Access Controls
                </Link>
                <Link
                  href={`${selectedRepo.detailHref}#activity`}
                  className="rounded-md border border-border/50 bg-muted/50 px-3 py-2 text-foreground transition hover:bg-muted/80"
                  aria-label="Open activity log"
                >
                  <IconSettings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .premium-dashboard-wrap {
          --background: #080c14;
          --surface: #0d1525;
          --surface-elevated: #111d30;
          --foreground: #e2e8f0;
          --muted-foreground: #b4bcc8;
          --border: #162032;
          --accent: #22d3ee;
          --accent-hover: #67e8f9;
          --primary: #22d3ee;
          --card: #0d1525;
          --card-foreground: #e2e8f0;
          --error-bg: #3a1018;
          --error-border: #7f1d2d;
          --error-text: #fecdd3;
          animation: premiumFade 420ms ease-out;
        }
        .magnetic-cta {
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease;
          will-change: transform;
        }
        .magnetic-cta:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 14px 30px rgba(8, 22, 56, 0.36);
        }
        .magnetic-cta:active {
          transform: translateY(0) scale(0.99);
        }
        .magnetic-card {
          transition:
            transform 240ms ease,
            box-shadow 240ms ease,
            border-color 220ms ease;
          will-change: transform;
        }
        .magnetic-card:hover {
          transform: translateY(-4px) scale(1.012);
          box-shadow: 0 18px 34px rgba(10, 28, 70, 0.4);
        }
        .magnetic-card:active {
          transform: translateY(-1px) scale(0.995);
        }
        .stagger-grid > .stagger-item,
        .stagger-grid > *:not(.stagger-item):not(.dashboard-todo-panel) {
          animation: riseIn 500ms ease both;
        }
        .stagger-grid > *:nth-child(1) {
          animation-delay: 40ms;
        }
        .stagger-grid > *:nth-child(2) {
          animation-delay: 90ms;
        }
        .stagger-grid > *:nth-child(3) {
          animation-delay: 140ms;
        }
        .stagger-grid > *:nth-child(4) {
          animation-delay: 190ms;
        }
        .stagger-grid > *:nth-child(5) {
          animation-delay: 240ms;
        }
        .stagger-grid > *:nth-child(6) {
          animation-delay: 290ms;
        }
        @keyframes premiumFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .premium-dashboard-wrap {
            animation: none;
          }
          .magnetic-cta,
          .magnetic-card,
          .stagger-grid > .stagger-item,
          .stagger-grid > *:not(.stagger-item) {
            animation: none;
            transition: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

function DiscoverableRepoRow({ repo }: { repo: SearchableRepo }) {
  const isGitlab = repo.tech.toLowerCase().includes("gitlab");
  const SourceIcon = isGitlab ? IconBrandGitlab : IconBrandGithub;
  return (
    <div className="dash-surface flex flex-col gap-3 p-4 transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40">
          <SourceIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{repo.name}</p>
          <p className="truncate text-sm text-muted-foreground">{repo.fullName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {repo.unit} · {repo.tech}
          </p>
        </div>
      </div>
      <Link
        href={repo.detailHref}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
      >
        Open hub
        <IconExternalLink className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function OverviewRepoRow({ repo }: { repo: DashboardRepoView }) {
  const isGitlab = repo.tech.toLowerCase().includes("gitlab");
  const SourceIcon = isGitlab ? IconBrandGitlab : IconBrandGithub;
  const statusBadge = repoStatusBadge(repo.status);
  return (
    <div className="dash-surface flex flex-col gap-4 p-4 transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40">
          <SourceIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{repo.name}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{repo.fullName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {repo.unit} · {repo.tech} · Health {repo.health}/100
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link
              href={repo.detailHref}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <IconExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Repository hub
            </Link>
            <Link
              href="/dashboard/organization"
              className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-primary"
            >
              <IconFolder className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Organization
            </Link>
            <Link
              href="/dashboard/ai"
              className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-primary"
            >
              <IconSparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Ask AI
            </Link>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <Link
          href={repo.detailHref}
          className="inline-flex w-full justify-center rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted sm:w-auto"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

function PremiumSignalBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "violet" | "amber";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-primary/40 bg-primary/12 text-primary"
      : tone === "violet"
        ? "border-violet-400/35 bg-violet-500/10 text-violet-800 dark:border-violet-300/40 dark:bg-violet-400/15 dark:text-violet-50"
        : "border-amber-400/35 bg-amber-500/10 text-amber-900 dark:border-amber-300/40 dark:bg-amber-400/15 dark:text-amber-50";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${toneClass}`}
    >
      <span className="font-medium uppercase tracking-[0.12em]">{label}</span>
      <span className="opacity-80">{value}</span>
    </span>
  );
}

function StatCard({
  title,
  value,
  suffix,
  hint,
  unavailable = false,
}: {
  title: string;
  value: string;
  suffix: string;
  hint: string;
  unavailable?: boolean;
}) {
  const numericValue = Number(value);
  const canAnimate = !unavailable && Number.isFinite(numericValue);
  const [displayValue, setDisplayValue] = useState(canAnimate ? 0 : Number.NaN);

  useEffect(() => {
    if (!canAnimate) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setDisplayValue(numericValue);
      return;
    }
    let frame = 0;
    let start = 0;
    const duration = 900;
    const tick = (ts: number) => {
      if (start === 0) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(numericValue * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [numericValue, canAnimate]);

  return (
    <div className="dash-stat-card rounded-xl p-4 transition duration-200 hover:border-primary/30">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {canAnimate ? displayValue : value}
        </span>
        {suffix ? (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value} members</span>
      </div>
      <div className="h-2 rounded-full bg-border/80">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-accent-violet"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/90 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

