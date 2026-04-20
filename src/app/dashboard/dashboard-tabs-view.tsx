"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDownload,
  IconFilter,
  IconGitCommit,
  IconGitPullRequest,
  IconInfoCircle,
  IconRocket,
  IconSearch,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { SystemHealthTrendChart } from "./system-health-trend-chart";

type TabKey = "dashboard" | "portfolio" | "operations";

export interface DashboardRepoView {
  id: string;
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
  progress: number;
  mentor: string;
}

interface DashboardTabsViewProps {
  repositories: DashboardRepoView[];
  activities: DashboardActivityView[];
  team: DashboardTeamView[];
  onboarding: DashboardOnboardingView[];
  summary: {
    healthScore: number;
    totalSystems: number;
    teamMembers: number;
    docsCoverage: number;
  };
  currentTrendValues: number[];
  previousQuarterValues: number[];
  industryAverageValues: number[];
}

function hashToTab(hash: string): TabKey {
  if (hash === "portfolio") return "portfolio";
  if (hash === "operations") return "operations";
  return "dashboard";
}

export function DashboardTabsView({
  repositories,
  activities,
  team,
  onboarding,
  summary,
  currentTrendValues,
  previousQuarterValues,
  industryAverageValues,
}: DashboardTabsViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [filter, setFilter] = useState<
    "all" | "critical" | "finance" | "operations" | "security"
  >("all");
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  useEffect(() => {
    const syncFromHash = () =>
      setActiveTab(hashToTab(window.location.hash.replace("#", "")));
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    window.location.hash = tab;
  }

  const pageTitle =
    activeTab === "dashboard"
      ? "Executive Dashboard"
      : activeTab === "portfolio"
        ? "Repository Portfolio"
        : "Operations Center";

  const filteredRepos = useMemo(() => {
    if (filter === "all") return repositories;
    if (filter === "critical")
      return repositories.filter(
        (r) => r.busFactor <= 1 || r.status === "critical",
      );
    if (filter === "finance")
      return repositories.filter((r) => r.unit.toLowerCase() === "finance");
    if (filter === "operations")
      return repositories.filter((r) => r.unit.toLowerCase() === "operations");
    return repositories.filter((r) => r.unit.toLowerCase() === "security");
  }, [repositories, filter]);

  const selectedRepo =
    repositories.find((r) => r.id === selectedRepoId) ?? null;
  const contributorsBars = repositories
    .slice(0, 6)
    .map((r) => ({ label: r.name.split(" ")[0], value: r.contributors }));

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-serif text-3xl text-foreground">{pageTitle}</h2>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Portfolio Health"
              value={`${summary.healthScore}`}
              suffix="/100"
              hint="+3 from last month"
            />
            <StatCard
              title="Active Repositories"
              value={`${summary.totalSystems}`}
              suffix="systems"
              hint="3 critical business units"
            />
            <StatCard
              title="Team Members"
              value={`${summary.teamMembers}`}
              suffix="contributors"
              hint="1 access review pending"
            />
            <StatCard
              title="Documentation"
              value={`${summary.docsCoverage}%`}
              suffix="coverage"
              hint="Auto-generated"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-sm border border-border bg-surface p-6 lg:col-span-2">
              <div className="mb-6">
                <h3 className="font-serif text-xl text-foreground">
                  System Health Trend
                </h3>
                <p className="text-sm text-muted">
                  Composite score across all repositories
                </p>
              </div>
              <SystemHealthTrendChart
                months={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
                currentValues={currentTrendValues}
                previousQuarterValues={previousQuarterValues}
                industryAverageValues={industryAverageValues}
              />
            </div>

            <div className="rounded-sm border border-border bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl text-foreground">
                  Attention Required
                </h3>
                <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                  3 items
                </span>
              </div>
              <AlertCard
                title="Single Contributor Risk"
                desc="Payment module has only 1 active developer"
                icon={<IconAlertCircle className="h-4 w-4" />}
              />
              <AlertCard
                title="Stale Dependencies"
                desc="3 critical libraries haven't updated in 6 months"
                icon={<IconClock className="h-4 w-4" />}
              />
              <AlertCard
                title="Access Review Due"
                desc="Quarterly audit overdue by 12 days"
                icon={<IconShield className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-sm border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <h3 className="font-serif text-xl text-foreground">
                  Critical Systems
                </h3>
                <p className="text-sm text-muted">
                  High-priority repositories requiring attention
                </p>
              </div>
              <button
                onClick={() => switchTab("portfolio")}
                className="text-sm font-medium text-accent hover:underline"
              >
                View all repositories
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">System</th>
                  <th className="px-4 py-3">Business Unit</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Contributors</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {repositories.slice(0, 2).map((repo) => (
                  <tr
                    key={repo.id}
                    onClick={() => setSelectedRepoId(repo.id)}
                    className="cursor-pointer border-t border-border/60 hover:bg-background/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {repo.name}
                    </td>
                    <td className="px-4 py-3 text-muted">{repo.unit}</td>
                    <td className="px-4 py-3">{repo.health}</td>
                    <td className="px-4 py-3">{repo.contributors}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-sm border px-2 py-1 text-xs ${repo.status === "healthy" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}
                      >
                        {repo.status === "healthy" ? "Healthy" : "Review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-sm border border-border bg-surface p-6">
              <h3 className="mb-4 font-serif text-xl text-foreground">
                Recent Changes
              </h3>
              <div className="space-y-3">
                {activities.slice(0, 3).map((a, idx) => (
                  <div
                    key={`${a.action}-${idx}`}
                    className="rounded-sm border border-border bg-background/60 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {a.action}
                    </p>
                    <p className="text-xs text-muted">
                      {a.repo} • {a.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-xl text-foreground">
                  Knowledge Distribution
                </h3>
                <IconInfoCircle className="h-4 w-4 text-muted" />
              </div>
              <div className="space-y-3">
                {contributorsBars.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>{b.label}</span>
                      <span>{b.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(100, b.value * 15)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "portfolio" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-3xl text-foreground">
                Repository Portfolio
              </h2>
              <p className="text-muted">
                Complete inventory of your software assets and their business
                context
              </p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-4 py-2 text-sm">
                <IconFilter className="h-4 w-4" />
                Filter
              </button>
              <button className="inline-flex items-center gap-2 rounded-sm border border-border bg-foreground px-4 py-2 text-sm text-background">
                <IconDownload className="h-4 w-4" />
                Export
              </button>
            </div>
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
                className={`rounded-sm border px-4 py-2 text-sm ${
                  filter === key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {repositories.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-background/40 p-8 text-center">
              <p className="text-base font-medium text-foreground">
                No repositories in your portfolio yet
              </p>
              <p className="mt-2 text-sm text-muted">
                Connect GitHub or GitLab, open a repository, and add it to your
                organization—or upload a project zip.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard/organization"
                  className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Set up organization
                </Link>
                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
                >
                  Upload a project
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => setSelectedRepoId(repo.id)}
                className="rounded-sm border border-border bg-surface p-6 text-left transition hover:border-foreground/30 hover:bg-surface-elevated"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-serif text-lg text-foreground">
                    {repo.name}
                  </span>
                  <span
                    className={`rounded-sm border px-2 py-1 text-xs ${repo.status === "healthy" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}
                  >
                    {repo.status === "healthy" ? "Healthy" : "Review"}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {repo.unit} • {repo.tech}
                </p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Health Score</span>
                    <span>{repo.health}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${repo.health > 85 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${repo.health}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-sm border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-background/60 p-4">
              <h3 className="font-serif text-lg text-foreground">
                Detailed Registry
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
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
                {filteredRepos.map((repo) => (
                  <tr
                    key={`reg-${repo.id}`}
                    className="border-t border-border/60 hover:bg-background/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {repo.name}
                    </td>
                    <td className="px-4 py-3 text-muted">{repo.unit}</td>
                    <td className="px-4 py-3 text-muted">{repo.tech}</td>
                    <td className="px-4 py-3">{repo.health}</td>
                    <td className="px-4 py-3">
                      {repo.busFactor <= 1
                        ? "Critical"
                        : repo.busFactor === 2
                          ? "At Risk"
                          : "Distributed"}
                    </td>
                    <td className="px-4 py-3 text-muted">{repo.lastDeploy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "operations" && (
        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-3xl text-foreground">
              Operations Center
            </h2>
            <p className="text-muted">
              Team management, access control, and operational intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-sm border border-border bg-surface p-6 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-foreground">
                    Team Composition
                  </h3>
                  <p className="text-sm text-muted">
                    Active contributors and their domain expertise
                  </p>
                </div>
                <button className="rounded-sm border border-border bg-foreground px-4 py-2 text-sm text-background">
                  Manage Access
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {team.map((m) => (
                  <div
                    key={m.name}
                    className="rounded-sm border border-border bg-background/60 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-elevated text-sm font-medium">
                          {m.avatar}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {m.name}
                          </p>
                          <p className="text-xs text-muted">{m.role}</p>
                        </div>
                      </div>
                      <span className="rounded-sm border border-border px-2 py-1 text-xs text-muted">
                        {m.access}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.domains.map((d) => (
                        <span
                          key={`${m.name}-${d}`}
                          className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-sm border border-border bg-surface p-6">
                <h3 className="mb-4 font-serif text-lg text-foreground">
                  Access Distribution
                </h3>
                <ProgressRow label="Admin Access" value={2} max={10} />
                <ProgressRow label="Write Access" value={5} max={10} />
                <ProgressRow label="Read Only" value={3} max={10} />
              </div>
              <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-6">
                <div className="flex items-start gap-3">
                  <IconAlertCircle className="h-5 w-5 text-amber-300" />
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Security Alert
                    </h4>
                    <p className="mt-1 text-sm text-muted">
                      1 former employee still has access to Payment Engine
                    </p>
                    <button className="mt-2 text-sm font-medium text-amber-300 hover:underline">
                      Review immediately
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-sm border border-border bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl text-foreground">
                  Activity Log
                </h3>
                <div className="flex items-center gap-2 text-muted">
                  <button className="rounded-sm p-1.5 hover:bg-background/60">
                    <IconChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm">This week</span>
                  <button className="rounded-sm p-1.5 hover:bg-background/60">
                    <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {activities.map((a, idx) => (
                  <div
                    key={`ops-act-${idx}`}
                    className="rounded-sm border border-border bg-background/60 p-3"
                  >
                    <div className="flex items-start gap-3">
                      {a.type === "deploy" ? (
                        <IconRocket className="h-4 w-4 text-emerald-300" />
                      ) : a.type === "merge" ? (
                        <IconGitPullRequest className="h-4 w-4 text-muted" />
                      ) : a.type === "docs" ? (
                        <IconSearch className="h-4 w-4 text-blue-300" />
                      ) : a.type === "security" ? (
                        <IconShieldCheck className="h-4 w-4 text-violet-300" />
                      ) : (
                        <IconGitCommit className="h-4 w-4 text-amber-300" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {a.action}
                        </p>
                        <p className="text-xs text-muted">
                          {a.repo} • {a.user} • {a.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-border bg-surface p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-xl text-foreground">
                  Knowledge Risk Matrix
                </h3>
                <IconChartBar className="h-4 w-4 text-muted" />
              </div>
              <svg viewBox="0 0 320 190" className="h-64 w-full">
                <line
                  x1="30"
                  y1="160"
                  x2="300"
                  y2="160"
                  stroke="var(--border)"
                />
                <line x1="30" y1="20" x2="30" y2="160" stroke="var(--border)" />
                {repositories.slice(0, 8).map((r, i) => {
                  const x = 30 + Math.min(8, r.contributors) * 30;
                  const y =
                    160 - (Math.max(70, Math.min(100, r.health)) - 70) * 4.2;
                  const color =
                    r.busFactor <= 1
                      ? "var(--accent)"
                      : r.health < 85
                        ? "#f59e0b"
                        : "#10b981";
                  return (
                    <circle
                      key={`risk-${r.id}-${i}`}
                      cx={x}
                      cy={y}
                      r="5.5"
                      fill={color}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-surface p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl text-foreground">
                  Developer Onboarding
                </h3>
                <p className="text-sm text-muted">
                  New team members and their progress
                </p>
              </div>
              <button className="rounded-sm border border-border bg-background px-4 py-2 text-sm text-foreground">
                + New Onboarding
              </button>
            </div>
            <div className="space-y-3">
              {onboarding.map((o) => (
                <div
                  key={o.name}
                  className="rounded-sm border border-border bg-background/60 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {o.name}
                    </p>
                    <p className="text-sm text-muted">{o.progress}%</p>
                  </div>
                  <p className="mb-2 text-xs text-muted">
                    {o.role} • Started {o.startDate} • Mentor: {o.mentor}
                  </p>
                  <div className="h-2 rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-foreground/80"
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm border border-border bg-background">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-6">
              <div>
                <h3 className="font-serif text-2xl text-foreground">
                  {selectedRepo.name}
                </h3>
                <p className="text-sm text-muted">
                  {selectedRepo.unit} • {selectedRepo.tech}
                </p>
              </div>
              <button
                onClick={() => setSelectedRepoId(null)}
                className="rounded-sm p-2 hover:bg-surface"
              >
                <IconX className="h-5 w-5 text-muted" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-muted">
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
              <div className="mt-6 flex gap-3">
                <button className="rounded-sm border border-border bg-foreground px-4 py-2 text-sm text-background">
                  View Documentation
                </button>
                <button className="rounded-sm border border-border bg-background px-4 py-2 text-sm text-foreground">
                  Access Logs
                </button>
                <button className="rounded-sm border border-border bg-background px-3 py-2 text-foreground">
                  <IconSettings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  title,
  value,
  suffix,
  hint,
}: {
  title: string;
  value: string;
  suffix: string;
  hint: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-serif text-3xl text-foreground">{value}</span>
        <span className="text-sm text-muted">{suffix}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}

function AlertCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-3 rounded-sm border border-border bg-background/60 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-amber-300">{icon}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
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
        <span className="text-muted">{label}</span>
        <span className="text-foreground">{value} members</span>
      </div>
      <div className="h-2 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-foreground/80"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl text-foreground">{value}</p>
    </div>
  );
}
