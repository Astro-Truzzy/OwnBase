export { default } from "./page-content";
/*
import { createClient } from "../../lib/supabase/server";
import { fetchUserProjects } from "../../lib/gitlab/fetch-projects";
import { fetchUserRepos } from "../../lib/github/fetch-repos";
import {
  type DashboardActivityView,
  type DashboardOnboardingView,
  type DashboardRepoView,
  type DashboardTeamView,
  DashboardTabsView,
} from "./dashboard-tabs-view";

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${Math.max(mins, 1)} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function calcHealthScore(updatedAt: string): number {
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return 78;
  const days = Math.max(0, (Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 95;
  if (days <= 7) return 90;
  if (days <= 14) return 86;
  if (days <= 30) return 81;
  return 74;
}

function repoUnit(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pay") || n.includes("bill")) return "Finance";
  if (n.includes("portal") || n.includes("customer")) return "Operations";
  if (n.includes("data") || n.includes("analytics")) return "Data";
  if (n.includes("auth") || n.includes("security")) return "Security";
  return "Platform";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const provider = (user?.app_metadata?.provider as string) ?? "github";
  const providerToken = session?.provider_token ?? null;

  const githubResult =
    provider === "gitlab" || !providerToken
      ? { repos: [] }
      : await fetchUserRepos(providerToken);
  const githubRepos = githubResult.repos ?? [];

  const { projects: gitlabProjects } =
    provider === "gitlab" && providerToken
      ? await fetchUserProjects(providerToken)
      : { projects: [] };

  const recentActivityRows =
    user != null
      ? (
          await supabase
            .from("activity_log")
            .select("full_name, action_type, details, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
        ).data ?? []
      : [];

  const repositories: DashboardRepoView[] =
    provider === "gitlab"
      ? gitlabProjects.map((project) => ({
          id: `gitlab-${project.id}`,
          name: project.name,
          unit: repoUnit(project.name),
          tech: `GitLab • ${project.visibility === "private" ? "Private" : "Public"}`,
          health: calcHealthScore(project.last_activity_at),
          contributors: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === `gitlab/${project.path_with_namespace}`).length || 2
          ),
          lastDeploy: formatRelativeTime(project.last_activity_at),
          status: calcHealthScore(project.last_activity_at) >= 88 ? "healthy" : "warning",
          busFactor: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === `gitlab/${project.path_with_namespace}`).length || 2
          ),
          description: project.description ?? `Core ${repoUnit(project.name).toLowerCase()} repository.`,
        }))
      : githubRepos.map((repo) => ({
          id: `github-${repo.id}`,
          name: repo.name,
          unit: repoUnit(repo.name),
          tech: `GitHub • ${repo.private ? "Private" : "Public"}`,
          health: calcHealthScore(repo.updated_at),
          contributors: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === repo.full_name).length || 2
          ),
          lastDeploy: formatRelativeTime(repo.updated_at),
          status: calcHealthScore(repo.updated_at) >= 88 ? "healthy" : "warning",
          busFactor: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === repo.full_name).length || 2
          ),
          description: repo.description ?? `Core ${repoUnit(repo.name).toLowerCase()} repository.`,
        }));

  const activities: DashboardActivityView[] = recentActivityRows.slice(0, 5).map((row) => {
    const details = row.details as Record<string, unknown> | null;
    const username = typeof details?.username === "string" ? details.username : "System";
    const type =
      row.action_type === "repo_tracked"
        ? "docs"
        : row.action_type === "repo_untracked"
          ? "audit"
          : row.action_type === "collaborator_added"
            ? "merge"
            : row.action_type === "collaborator_removed"
              ? "security"
              : "deploy";
    return {
      action:
        row.action_type === "repo_tracked"
          ? "Repository added to organization"
          : row.action_type === "repo_untracked"
            ? "Repository removed from organization"
            : row.action_type === "collaborator_added"
              ? "Collaborator granted access"
              : row.action_type === "collaborator_removed"
                ? "Collaborator access revoked"
                : "Repository activity",
      repo: row.full_name,
      user: username,
      time: formatRelativeTime(row.created_at),
      type,
    };
  });

  const team: DashboardTeamView[] = [
    { name: "John Doe", role: "Senior Engineer", domains: ["Payment", "Core"], access: "Admin", avatar: "JD", status: "active" },
    { name: "Sarah Park", role: "Staff Engineer", domains: ["Auth", "Security"], access: "Admin", avatar: "SP", status: "active" },
    { name: "Amy Liu", role: "Full Stack Dev", domains: ["Portal", "API"], access: "Write", avatar: "AL", status: "active" },
    { name: "Mike Chen", role: "Backend Engineer", domains: ["Analytics"], access: "Write", avatar: "MC", status: "warning" },
  ];

  const onboarding: DashboardOnboardingView[] = [
    { name: "David Kim", role: "Backend Engineer", startDate: "3 days ago", progress: 35, mentor: "John Doe" },
    { name: "Lisa Wong", role: "DevOps Engineer", startDate: "1 week ago", progress: 68, mentor: "Sarah Park" },
  ];

  const avgHealth =
    repositories.length > 0
      ? Math.round(repositories.reduce((sum, r) => sum + r.health, 0) / repositories.length)
      : 0;

  return (
    <DashboardTabsView
      repositories={repositories}
      activities={activities}
      team={team}
      onboarding={onboarding}
      summary={{
        healthScore: avgHealth,
        totalSystems: repositories.length,
        teamMembers: Math.max(team.length, new Set(activities.map((a) => a.user)).size),
        docsCoverage: Math.max(68, Math.min(96, 70 + repositories.length * 3)),
      }}
      currentTrendValues={[82, 85, 87, 89, 91, Math.max(72, avgHealth)]}
      previousQuarterValues={[78, 80, 82, 83, 85, 87]}
      industryAverageValues={[75, 77, 78, 79, 80, 82]}
    />
  );
}
import { createClient } from "../../lib/supabase/server";
import { fetchUserProjects } from "../../lib/gitlab/fetch-projects";
import { fetchUserRepos } from "../../lib/github/fetch-repos";
import {
  type DashboardActivityView,
  type DashboardOnboardingView,
  type DashboardRepoView,
  type DashboardTeamView,
  DashboardTabsView,
} from "./dashboard-tabs-view";

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${Math.max(mins, 1)} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function calcHealthScore(updatedAt: string): number {
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return 78;
  const days = Math.max(0, (Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 95;
  if (days <= 7) return 90;
  if (days <= 14) return 86;
  if (days <= 30) return 81;
  return 74;
}

function repoUnit(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pay") || n.includes("bill")) return "Finance";
  if (n.includes("portal") || n.includes("customer")) return "Operations";
  if (n.includes("data") || n.includes("analytics")) return "Data";
  if (n.includes("auth") || n.includes("security")) return "Security";
  return "Platform";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const provider = (user?.app_metadata?.provider as string) ?? "github";
  const providerToken = session?.provider_token ?? null;

  const githubResult =
    provider === "gitlab" || !providerToken
      ? { repos: [], error: undefined as string | undefined }
      : await fetchUserRepos(providerToken);
  const { repos: githubRepos } = githubResult;

  const { projects: gitlabProjects } =
    provider === "gitlab" && providerToken
      ? await fetchUserProjects(providerToken)
      : { projects: [] };

  const recentActivityRows =
    user != null
      ? (
          await supabase
            .from("activity_log")
            .select("full_name, action_type, details, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
        ).data ?? []
      : [];

  const repositories: DashboardRepoView[] =
    provider === "gitlab"
      ? gitlabProjects.map((project) => ({
          id: `gitlab-${project.id}`,
          name: project.name,
          unit: repoUnit(project.name),
          tech: `GitLab • ${project.visibility === "private" ? "Private" : "Public"}`,
          health: calcHealthScore(project.last_activity_at),
          contributors: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === `gitlab/${project.path_with_namespace}`).length || 2
          ),
          lastDeploy: formatRelativeTime(project.last_activity_at),
          status: calcHealthScore(project.last_activity_at) >= 88 ? "healthy" : "warning",
          busFactor: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === `gitlab/${project.path_with_namespace}`).length || 2
          ),
          description: project.description ?? `Core ${repoUnit(project.name).toLowerCase()} repository.`,
        }))
      : githubRepos.map((repo) => ({
          id: `github-${repo.id}`,
          name: repo.name,
          unit: repoUnit(repo.name),
          tech: `GitHub • ${repo.private ? "Private" : "Public"}`,
          health: calcHealthScore(repo.updated_at),
          contributors: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === repo.full_name).length || 2
          ),
          lastDeploy: formatRelativeTime(repo.updated_at),
          status: calcHealthScore(repo.updated_at) >= 88 ? "healthy" : "warning",
          busFactor: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === repo.full_name).length || 2
          ),
          description: repo.description ?? `Core ${repoUnit(repo.name).toLowerCase()} repository.`,
        }));

  const activities: DashboardActivityView[] = recentActivityRows.slice(0, 5).map((row) => {
    const details = row.details as Record<string, unknown> | null;
    const username = typeof details?.username === "string" ? details.username : "System";
    const type =
      row.action_type === "repo_tracked"
        ? "docs"
        : row.action_type === "repo_untracked"
          ? "audit"
          : row.action_type === "collaborator_added"
            ? "merge"
            : row.action_type === "collaborator_removed"
              ? "security"
              : "deploy";
    return {
      action:
        row.action_type === "repo_tracked"
          ? "Repository added to organization"
          : row.action_type === "repo_untracked"
            ? "Repository removed from organization"
            : row.action_type === "collaborator_added"
              ? "Collaborator granted access"
              : row.action_type === "collaborator_removed"
                ? "Collaborator access revoked"
                : "Repository activity",
      repo: row.full_name,
      user: username,
      time: formatRelativeTime(row.created_at),
      type,
    };
  });

  const team: DashboardTeamView[] = [
    { name: "John Doe", role: "Senior Engineer", domains: ["Payment", "Core"], access: "Admin", avatar: "JD", status: "active" },
    { name: "Sarah Park", role: "Staff Engineer", domains: ["Auth", "Security"], access: "Admin", avatar: "SP", status: "active" },
    { name: "Amy Liu", role: "Full Stack Dev", domains: ["Portal", "API"], access: "Write", avatar: "AL", status: "active" },
    { name: "Mike Chen", role: "Backend Engineer", domains: ["Analytics"], access: "Write", avatar: "MC", status: "warning" },
  ];

  const onboarding: DashboardOnboardingView[] = [
    { name: "David Kim", role: "Backend Engineer", startDate: "3 days ago", progress: 35, mentor: "John Doe" },
    { name: "Lisa Wong", role: "DevOps Engineer", startDate: "1 week ago", progress: 68, mentor: "Sarah Park" },
  ];

  const avgHealth =
    repositories.length > 0
      ? Math.round(repositories.reduce((sum, r) => sum + r.health, 0) / repositories.length)
      : 0;

  return (
    <DashboardTabsView
      repositories={repositories}
      activities={activities}
      team={team}
      onboarding={onboarding}
      summary={{
        healthScore: avgHealth,
        totalSystems: repositories.length,
        teamMembers: Math.max(team.length, new Set(activities.map((a) => a.user)).size),
        docsCoverage: Math.max(68, Math.min(96, 70 + repositories.length * 3)),
      }}
      currentTrendValues={[82, 85, 87, 89, 91, Math.max(72, avgHealth)]}
      previousQuarterValues={[78, 80, 82, 83, 85, 87]}
      industryAverageValues={[75, 77, 78, 79, 80, 82]}
    />
  );
}
import Link from "next/link";
import {
  IconActivity,
  IconAlertCircle,
  IconAlertTriangle,
  IconChartBar,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconFileDescription,
  IconFilePlus,
  IconGitCommit,
  IconGitPullRequest,
  IconShield,
  IconTrendingUp,
  IconUsersGroup,
} from "@tabler/icons-react";
import { createClient } from "../../lib/supabase/server";
import { fetchUserRepos } from "../../lib/github/fetch-repos";
import { fetchUserProjects } from "../../lib/gitlab/fetch-projects";
import { SystemHealthTrendChart } from "./system-health-trend-chart";

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

type DashboardRepo = {
  key: string;
  fullName: string;
  name: string;
  description: string | null;
  updatedAt: string;
  visibility: "private" | "public";
  source: "github" | "gitlab";
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Unknown";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function calcHealthScore(updatedAt: string): number {
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return 78;
  const days = Math.max(0, (Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 95;
  if (days <= 7) return 90;
  if (days <= 14) return 86;
  if (days <= 30) return 81;
  return 74;
}

function scoreStatus(score: number): "Healthy" | "Review" | "Risk" {
  if (score >= 88) return "Healthy";
  if (score >= 78) return "Review";
  return "Risk";
}

function statusClasses(status: "Healthy" | "Review" | "Risk"): string {
  if (status === "Healthy") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  if (status === "Review") {
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  }
  return "bg-red-500/15 text-red-300 border-red-500/30";
}

function actionLabel(action: string): string {
  switch (action) {
    case "repo_tracked":
      return "Repository added to organization";
    case "repo_untracked":
      return "Repository removed from organization";
    case "collaborator_added":
      return "Collaborator granted access";
    case "collaborator_removed":
      return "Collaborator access revoked";
    default:
      return "Repository activity";
  }
}

function repoUnit(name: string): "Finance" | "Operations" | "Data" | "Security" {
  const n = name.toLowerCase();
  if (n.includes("pay") || n.includes("bill")) return "Finance";
  if (n.includes("portal") || n.includes("customer")) return "Operations";
  if (n.includes("data") || n.includes("analytics")) return "Data";
  return "Security";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: profile } =
    user != null
      ? await supabase
          .from("profiles")
          .select("first_name, last_name, business_name")
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

  const displayName =
    profile?.first_name || profile?.last_name
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
      : user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        user?.email?.split("@")[0] ??
        "there";
  const businessName = profile?.business_name?.trim() ?? null;

  const provider = (user?.app_metadata?.provider as string) ?? "github";
  const providerToken = session?.provider_token ?? null;

  const githubResult =
    provider === "gitlab" || !providerToken
      ? { repos: [], error: undefined as string | undefined }
      : await fetchUserRepos(providerToken);
  const { repos: githubRepos, error: githubError } = githubResult;

  const { projects: gitlabProjects, error: gitlabError } =
    provider === "gitlab" && providerToken
      ? await fetchUserProjects(providerToken)
      : { projects: [], error: undefined };

  const trackedRepos =
    user != null
      ? (
          await supabase
            .from("tracked_repos")
            .select("full_name, repo_owner, repo_name, added_at")
            .eq("user_id", user.id)
            .order("added_at", { ascending: false })
        ).data ?? []
      : [];

  const uploadedCount =
    user != null
      ? ((await supabase.from("uploaded_projects").select("*", { count: "exact", head: true }).eq("user_id", user.id)).count ?? 0)
      : 0;

  const recentActivityRows =
    user != null
      ? (
          await supabase
            .from("activity_log")
            .select("full_name, action_type, details, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
        ).data ?? []
      : [];

  const dashboardRepos: DashboardRepo[] =
    provider === "gitlab"
      ? gitlabProjects.map((project) => ({
          key: `gitlab-${project.id}`,
          fullName: `gitlab/${project.path_with_namespace}`,
          name: project.name,
          description: project.description,
          updatedAt: project.last_activity_at,
          visibility: project.visibility === "private" ? "private" : "public",
          source: "gitlab",
        }))
      : githubRepos.map((repo) => ({
          key: `github-${repo.id}`,
          fullName: repo.full_name,
          name: repo.name,
          description: repo.description,
          updatedAt: repo.updated_at,
          visibility: repo.private ? "private" : "public",
          source: "github",
        }));

  const totalRepos = dashboardRepos.length;
  const healthScores = dashboardRepos.map((r) => calcHealthScore(r.updatedAt));
  const avgHealth =
    healthScores.length > 0
      ? Math.round(healthScores.reduce((sum, v) => sum + v, 0) / healthScores.length)
      : 0;
  const reposNeedingReview = healthScores.filter((s) => s < 88).length;
  const contributorsTouched = new Set(
    recentActivityRows
      .map((row) => {
        const details = row.details as Record<string, unknown> | null;
        const username = details?.username;
        return typeof username === "string" ? username : null;
      })
      .filter(Boolean)
  ).size;

  const currentTrendValues = [82, 85, 87, 89, 91, Math.max(72, avgHealth)];
  const previousQuarterValues = [78, 80, 82, 83, 85, 87];
  const industryAverageValues = [75, 77, 78, 79, 80, 82];

  const topRepos = [...dashboardRepos]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const knowledgeBars = topRepos.map((repo, idx) => {
    const activityTouches = recentActivityRows.filter((row) => row.full_name === repo.fullName).length;
    const contributors = Math.max(1, activityTouches || ((idx % 5) + 1));
    return { repo, contributors };
  });

  const riskHigh = knowledgeBars.filter((k) => k.contributors <= 1).length;
  const riskMedium = knowledgeBars.filter((k) => k.contributors === 2).length;
  const riskLow = Math.max(0, knowledgeBars.length - riskHigh - riskMedium);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Portfolio Health"
          value={totalRepos > 0 ? String(avgHealth) : "—"}
          suffix={totalRepos > 0 ? "/100" : ""}
          tone="healthy"
          hint={
            totalRepos > 0
              ? "+3 from last month"
              : "Connect repositories to start"
          }
          icon={<span className="h-2 w-2 rounded-full bg-emerald-400" />}
        />
        <SummaryCard
          title="Active Repositories"
          value={String(totalRepos)}
          suffix="systems"
          tone="neutral"
          hint="3 critical business units"
          icon={<IconTrendingUp className="h-4 w-4 text-muted" aria-hidden />}
        />
        <SummaryCard
          title="Team Members"
          value={String(contributorsTouched)}
          suffix="contributors"
          tone={contributorsTouched > 0 ? "review" : "neutral"}
          hint={reposNeedingReview > 0 ? `${reposNeedingReview} access review pending` : "All access reviewed"}
          icon={<IconUsersGroup className="h-4 w-4 text-muted" aria-hidden />}
        />
        <SummaryCard
          title="Documentation"
          value={totalRepos > 0 ? `${Math.max(68, Math.min(96, 70 + totalRepos * 3))}` : "—"}
          suffix={totalRepos > 0 ? "%" : ""}
          tone="healthy"
          hint="Auto-generated"
          icon={<IconFileDescription className="h-4 w-4" aria-hidden />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-border bg-surface p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-foreground">System Health Trend</h2>
              <p className="text-sm text-muted">
                Composite score across all repositories
              </p>
            </div>
          </div>
          <SystemHealthTrendChart
            months={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
            currentValues={currentTrendValues}
            previousQuarterValues={previousQuarterValues}
            industryAverageValues={industryAverageValues}
          />
        </div>

        <div className="rounded-sm border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl text-foreground">Attention Required</h2>
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
              {reposNeedingReview} item{reposNeedingReview === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            <AlertRow
              title="Single contributor risk"
              description={
                contributorsTouched <= 1
                  ? "Only one active contributor detected recently."
                  : "Review distribution on core repositories."
              }
              icon={<IconAlertCircle className="h-4 w-4 text-amber-300" aria-hidden />}
            />
            <AlertRow
              title="Stale dependencies"
              description={`${Math.max(1, reposNeedingReview)} critical libraries haven't updated in 6 months`}
              icon={<IconClock className="h-4 w-4 text-amber-300" aria-hidden />}
            />
            <AlertRow
              title="Access audit"
              description="Quarterly audit overdue by 12 days"
              icon={<IconShield className="h-4 w-4 text-muted" aria-hidden />}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-sm border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-serif text-xl text-foreground">Repository Portfolio</h2>
            <p className="text-sm text-muted">Business-critical systems and current status</p>
          </div>
          <Link
            href="/dashboard/organization"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            Export report
          </Link>
        </div>

        {topRepos.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted">
            Connect GitHub or GitLab to populate your portfolio table.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">System</th>
                  <th className="px-4 py-3 font-medium">Business Unit</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">Contributors</th>
                  <th className="px-4 py-3 font-medium">Last activity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {topRepos.map((repo) => {
                  const score = calcHealthScore(repo.updatedAt);
                  const status = scoreStatus(score);
                  const c = Math.max(
                    1,
                    recentActivityRows.filter((r) => r.full_name === repo.fullName).length || 2
                  );
                  return (
                    <tr
                      key={repo.key}
                      className="border-t border-border/60 transition-colors hover:bg-background/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={repoDetailHref(repo.fullName)}
                          className="inline-flex items-center gap-2 font-medium text-foreground hover:text-accent"
                        >
                          {repoUnit(repo.name) === "Finance" ? (
                            <IconCreditCard className="h-4 w-4 text-emerald-300" aria-hidden />
                          ) : repoUnit(repo.name) === "Operations" ? (
                            <IconUsersGroup className="h-4 w-4 text-amber-300" aria-hidden />
                          ) : repoUnit(repo.name) === "Data" ? (
                            <IconChartBar className="h-4 w-4 text-blue-300" aria-hidden />
                          ) : (
                            <IconShield className="h-4 w-4 text-violet-300" aria-hidden />
                          )}
                          {repo.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {repo.source === "github" ? "GitHub" : "GitLab"} •{" "}
                          {repo.visibility === "private" ? "Private" : "Public"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {repoUnit(repo.name)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
                            <div
                              className={`h-full rounded-full ${
                                status === "Healthy"
                                  ? "bg-emerald-500"
                                  : status === "Review"
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">{score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(c, 3) }).map((_, idx) => (
                            <span
                              key={`${repo.key}-c-${idx}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-surface-elevated text-[10px] font-medium text-muted"
                            >
                              {String.fromCharCode(65 + idx)}
                              {String.fromCharCode(76 + idx)}
                            </span>
                          ))}
                          {c > 3 && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted/30 text-[10px] font-medium text-muted">
                              +{c - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatRelativeTime(repo.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${statusClasses(status)}`}
                        >
                          {status === "Healthy" ? (
                            <IconCheck className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <IconActivity className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-foreground">Recent Changes</h2>
            <Link href="/dashboard/devs" className="text-sm text-muted hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivityRows.length === 0 ? (
              <p className="text-sm text-muted">
                Activity will appear here as collaborators are added, removed, or repositories are tracked.
              </p>
            ) : (
              recentActivityRows.slice(0, 5).map((row) => (
                <div
                  key={`${row.full_name}-${row.created_at}`}
                  className="rounded-sm border border-border bg-background/60 p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-muted">
                      {row.action_type === "collaborator_added" ? (
                        <IconGitPullRequest className="h-4 w-4" />
                      ) : row.action_type === "collaborator_removed" ? (
                        <IconAlertTriangle className="h-4 w-4" />
                      ) : row.action_type === "repo_tracked" ? (
                        <IconFilePlus className="h-4 w-4" />
                      ) : (
                        <IconGitCommit className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {actionLabel(row.action_type)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {row.full_name} • {formatDate(row.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-muted">{formatRelativeTime(row.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-foreground">Knowledge Distribution</h2>
            <span className="text-xs text-muted">Bus-factor view</span>
          </div>
          {knowledgeBars.length === 0 ? (
            <p className="text-sm text-muted">Connect repositories to view distribution metrics.</p>
          ) : (
            <div className="space-y-3">
              {knowledgeBars.map(({ repo, contributors }) => {
                const risk = contributors <= 1 ? "High" : contributors === 2 ? "Medium" : "Low";
                return (
                  <div key={repo.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-foreground">{repo.name}</span>
                      <span className="text-muted">{contributors} contributor(s)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full ${
                          risk === "High"
                            ? "bg-red-500"
                            : risk === "Medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, contributors * 20)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            <div>
              <p className="text-xl font-semibold text-foreground">{riskHigh}</p>
              <p className="text-[11px] text-muted">High risk</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-amber-300">{riskMedium}</p>
              <p className="text-[11px] text-muted">Medium risk</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-emerald-300">{riskLow}</p>
              <p className="text-[11px] text-muted">Well distributed</p>
            </div>
          </div>
        </div>
      </section>

      {!providerToken && (
        <div className="rounded-sm border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-medium text-foreground">
            Connect your repository
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sign in with GitHub or GitLab to populate analytics, portfolio health, and repository insights.
          </p>
        </div>
      )}

      {providerToken && provider === "github" && githubError && (
        <div
          className="rounded-xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--error-border)",
            backgroundColor: "var(--error-bg)",
          }}
        >
          <h2 className="text-base font-medium text-error-text">
            Unable to load projects
          </h2>
          <p className="mt-2 text-sm text-error-text/90">{githubError}</p>
        </div>
      )}

      {providerToken && provider === "gitlab" && gitlabError && (
        <div
          className="rounded-xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--error-border)",
            backgroundColor: "var(--error-bg)",
          }}
        >
          <h2 className="text-base font-medium text-error-text">
            Unable to load GitLab projects
          </h2>
          <p className="mt-2 text-sm text-error-text/90">{gitlabError}</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  suffix,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  suffix: string;
  hint: string;
  icon: React.ReactNode;
  tone: "healthy" | "review" | "neutral";
}) {
  const dotColor =
    tone === "healthy" ? "bg-emerald-400" : tone === "review" ? "bg-amber-400" : "bg-border";
  return (
    <div className="rounded-sm border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{title}</span>
        <span className="text-muted">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="font-serif text-3xl text-foreground">{value}</span>
        {suffix && <span className="mb-1 text-sm text-muted">{suffix}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden />
        <span>{hint}</span>
      </div>
    </div>
  );
}

function AlertRow({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-border bg-background/70 p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}
*/
