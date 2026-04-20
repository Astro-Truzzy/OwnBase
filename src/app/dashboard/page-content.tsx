import { createClient } from "../../lib/supabase/server";
import { fetchUserProjects } from "../../lib/gitlab/fetch-projects";
import { fetchUserRepos } from "../../lib/github/fetch-repos";
import { getUsageSnapshot } from "../../lib/usage-stats";
import {
  DashboardActivation,
  type OnboardingStep,
} from "./dashboard-activation";
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

export default async function DashboardPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const usage = user != null ? await getUsageSnapshot(supabase, user.id) : null;

  const { data: profileExtras } =
    user != null
      ? await supabase
          .from("profiles")
          .select("onboarding_checklist_dismissed_at")
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

  const { count: savedSummariesCount } =
    user != null
      ? await supabase
          .from("repo_summaries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
      : { count: 0 };

  const trackedDone = (usage?.trackedRepos ?? 0) > 0;
  const uploadDone = (usage?.uploads ?? 0) > 0;
  const summaryDone = (savedSummariesCount ?? 0) > 0;
  const allOnboardingDone = trackedDone && uploadDone && summaryDone;
  const onboardingDismissed =
    profileExtras?.onboarding_checklist_dismissed_at != null;

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "track",
      title: "Add a repository to your organization",
      description:
        "Track a repo from the dashboard so it appears under Organization.",
      done: trackedDone,
      href: "/dashboard/organization",
    },
    {
      id: "upload",
      title: "Upload a project zip",
      description:
        "Store a snapshot of your codebase in your workspace storage.",
      done: uploadDone,
      href: "/dashboard/upload",
    },
    {
      id: "summary",
      title: "Generate an AI overview",
      description:
        "Open a GitHub repo, then generate an executive summary and handoff brief.",
      done: summaryDone,
      href: "/dashboard",
    },
  ];

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
      ? ((
          await supabase
            .from("activity_log")
            .select("full_name, action_type, details, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
        ).data ?? [])
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
            recentActivityRows.filter(
              (r) => r.full_name === `gitlab/${project.path_with_namespace}`,
            ).length || 2,
          ),
          lastDeploy: formatRelativeTime(project.last_activity_at),
          status:
            calcHealthScore(project.last_activity_at) >= 88
              ? "healthy"
              : "warning",
          busFactor: Math.max(
            1,
            recentActivityRows.filter(
              (r) => r.full_name === `gitlab/${project.path_with_namespace}`,
            ).length || 2,
          ),
          description:
            project.description ??
            `Core ${repoUnit(project.name).toLowerCase()} repository.`,
        }))
      : githubRepos.map((repo) => ({
          id: `github-${repo.id}`,
          name: repo.name,
          unit: repoUnit(repo.name),
          tech: `GitHub • ${repo.private ? "Private" : "Public"}`,
          health: calcHealthScore(repo.updated_at),
          contributors: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === repo.full_name)
              .length || 2,
          ),
          lastDeploy: formatRelativeTime(repo.updated_at),
          status:
            calcHealthScore(repo.updated_at) >= 88 ? "healthy" : "warning",
          busFactor: Math.max(
            1,
            recentActivityRows.filter((r) => r.full_name === repo.full_name)
              .length || 2,
          ),
          description:
            repo.description ??
            `Core ${repoUnit(repo.name).toLowerCase()} repository.`,
        }));

  const activities: DashboardActivityView[] = recentActivityRows
    .slice(0, 5)
    .map((row) => {
      const details = row.details as Record<string, unknown> | null;
      const username =
        typeof details?.username === "string" ? details.username : "System";
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
    {
      name: "John Doe",
      role: "Senior Engineer",
      domains: ["Payment", "Core"],
      access: "Admin",
      avatar: "JD",
      status: "active",
    },
    {
      name: "Sarah Park",
      role: "Staff Engineer",
      domains: ["Auth", "Security"],
      access: "Admin",
      avatar: "SP",
      status: "active",
    },
    {
      name: "Amy Liu",
      role: "Full Stack Dev",
      domains: ["Portal", "API"],
      access: "Write",
      avatar: "AL",
      status: "active",
    },
    {
      name: "Mike Chen",
      role: "Backend Engineer",
      domains: ["Analytics"],
      access: "Write",
      avatar: "MC",
      status: "warning",
    },
  ];

  const onboarding: DashboardOnboardingView[] = [
    {
      name: "David Kim",
      role: "Backend Engineer",
      startDate: "3 days ago",
      progress: 35,
      mentor: "John Doe",
    },
    {
      name: "Lisa Wong",
      role: "DevOps Engineer",
      startDate: "1 week ago",
      progress: 68,
      mentor: "Sarah Park",
    },
  ];

  const avgHealth =
    repositories.length > 0
      ? Math.round(
          repositories.reduce((sum, r) => sum + r.health, 0) /
            repositories.length,
        )
      : 0;

  return (
    <>
      {usage && (
        <DashboardActivation
          usage={usage}
          onboardingSteps={onboardingSteps}
          onboardingDismissed={onboardingDismissed}
          allOnboardingDone={allOnboardingDone}
        />
      )}
      <DashboardTabsView
        repositories={repositories}
        activities={activities}
        team={team}
        onboarding={onboarding}
        summary={{
          healthScore: avgHealth,
          totalSystems: repositories.length,
          teamMembers: Math.max(
            team.length,
            new Set(activities.map((a) => a.user)).size,
          ),
          docsCoverage: Math.max(
            68,
            Math.min(96, 70 + repositories.length * 3),
          ),
        }}
        currentTrendValues={[82, 85, 87, 89, 91, Math.max(72, avgHealth)]}
        previousQuarterValues={[78, 80, 82, 83, 85, 87]}
        industryAverageValues={[75, 77, 78, 79, 80, 82]}
      />
    </>
  );
}
