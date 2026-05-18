import { createClient } from "../../lib/supabase/server";
import { fetchUserProjects } from "../../lib/gitlab/fetch-projects";
import { fetchRepoCollaborators } from "../../lib/github/fetch-collaborators";
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

function formatCompactRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function collaboratorAccessFromPermissions(
  permissions:
    | {
        pull: boolean;
        push: boolean;
        admin: boolean;
        triage?: boolean;
        maintain?: boolean;
      }
    | undefined,
): "Admin" | "Write" | "Read" {
  if (!permissions) return "Read";
  if (permissions.admin || permissions.maintain) return "Admin";
  if (permissions.push) return "Write";
  return "Read";
}

const MAX_TRACKED_REPOS_FOR_COLLAB_FETCH = 6;
const COLLABORATOR_FETCH_TIMEOUT_MS = 2500;

async function fetchRepoCollaboratorsWithTimeout(
  owner: string,
  name: string,
  providerToken: string,
): Promise<Awaited<ReturnType<typeof fetchRepoCollaborators>>> {
  const timeoutPromise = new Promise<
    Awaited<ReturnType<typeof fetchRepoCollaborators>>
  >((resolve) => {
    setTimeout(
      () =>
        resolve({
          collaborators: [],
          error: "Collaborator request timed out",
        }),
      COLLABORATOR_FETCH_TIMEOUT_MS,
    );
  });

  return Promise.race([
    fetchRepoCollaborators(owner, name, providerToken),
    timeoutPromise,
  ]);
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
          .select(
            "onboarding_checklist_dismissed_at, first_name, last_name, plan",
          )
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
  const viewerDisplayName =
    [profileExtras?.first_name, profileExtras?.last_name]
      .filter(
        (part): part is string => typeof part === "string" && part.length > 0,
      )
      .join(" ")
      .trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const viewerPlan =
    typeof profileExtras?.plan === "string" && profileExtras.plan.length > 0
      ? profileExtras.plan
      : null;

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
            .limit(100)
        ).data ?? [])
      : [];
  const trackedGithubRows =
    user != null
      ? ((
          await supabase
            .from("tracked_repos")
            .select("full_name, repo_name")
            .eq("user_id", user.id)
            .neq("repo_owner", "gitlab")
            .order("added_at", { ascending: false })
            .limit(MAX_TRACKED_REPOS_FOR_COLLAB_FETCH)
        ).data ?? [])
      : [];

  const collaboratorsByRepo =
    providerToken && trackedGithubRows.length > 0
      ? await Promise.allSettled(
          trackedGithubRows.map(async (repoRow) => {
            const [owner, ...nameParts] = repoRow.full_name.split("/");
            const name = nameParts.join("/") || repoRow.repo_name;
            const { collaborators } = await fetchRepoCollaboratorsWithTimeout(
              owner,
              name,
              providerToken,
            );
            return {
              repoName: repoRow.repo_name,
              collaborators,
            };
          }),
        ).then((results) =>
          results.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : [],
          ),
        )
      : [];

  const repositories: DashboardRepoView[] =
    provider === "gitlab"
      ? gitlabProjects.map((project) => ({
          id: `gitlab-${project.id}`,
          fullName: `gitlab/${project.path_with_namespace}`,
          detailHref: repoDetailHref(`gitlab/${project.path_with_namespace}`),
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
          fullName: repo.full_name,
          detailHref: repoDetailHref(repo.full_name),
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

  const teamByUser = new Map<
    string,
    {
      name: string;
      role: string;
      domains: Set<string>;
      access: "Admin" | "Write" | "Read";
      status: "active" | "warning";
      lastSeenAt: string;
    }
  >();

  for (const repo of collaboratorsByRepo) {
    const domain = repoUnit(repo.repoName);
    for (const collab of repo.collaborators) {
      const current = teamByUser.get(collab.login);
      const access = collaboratorAccessFromPermissions(collab.permissions);
      if (current) {
        current.domains.add(domain);
        if (current.access !== "Admin" && access === "Admin") {
          current.access = "Admin";
        } else if (current.access === "Read" && access === "Write") {
          current.access = "Write";
        }
      } else {
        teamByUser.set(collab.login, {
          name: collab.login,
          role: "Repository collaborator",
          domains: new Set([domain]),
          access,
          status: "active",
          lastSeenAt: new Date(0).toISOString(),
        });
      }
    }
  }

  for (const row of recentActivityRows) {
    const details = row.details as Record<string, unknown> | null;
    const username =
      typeof details?.username === "string"
        ? details.username
        : typeof details?.actor === "string"
          ? details.actor
          : "System";
    const repoName =
      row.full_name.split("/").slice(1).join("/") || row.full_name;
    const domain = repoUnit(repoName);
    const current = teamByUser.get(username);
    const permission =
      typeof details?.permission === "string" ? details.permission : null;
    const access: "Admin" | "Write" | "Read" =
      permission === "admin"
        ? "Admin"
        : permission === "pull"
          ? "Read"
          : "Write";
    const nextStatus: "active" | "warning" =
      row.action_type === "collaborator_removed" ? "warning" : "active";

    if (current) {
      current.domains.add(domain);
      if (current.access !== "Admin" && access === "Admin")
        current.access = "Admin";
      if (current.access === "Read" && access === "Write")
        current.access = "Write";
      if (nextStatus === "warning") current.status = "warning";
      if (new Date(row.created_at) > new Date(current.lastSeenAt)) {
        current.lastSeenAt = row.created_at;
      }
    } else {
      teamByUser.set(username, {
        name: username,
        role: username === "System" ? "System" : "Repository collaborator",
        domains: new Set([domain]),
        access,
        status: nextStatus,
        lastSeenAt: row.created_at,
      });
    }
  }

  const team: DashboardTeamView[] = Array.from(teamByUser.values())
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
    )
    .slice(0, 8)
    .map((member) => ({
      name: member.name,
      role: member.role,
      domains: Array.from(member.domains).slice(0, 3),
      access: member.access,
      avatar:
        member.name
          .split(/[\s_-]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("")
          .slice(0, 2) || "??",
      status: member.status,
    }));

  const onboarding: DashboardOnboardingView[] = recentActivityRows
    .filter((row) => row.action_type === "collaborator_added")
    .slice(0, 5)
    .map((row) => {
      const details = row.details as Record<string, unknown> | null;
      const username =
        typeof details?.username === "string"
          ? details.username
          : "New collaborator";
      const permission =
        typeof details?.permission === "string" ? details.permission : "push";
      const progress =
        permission === "admin" ? 90 : permission === "pull" ? 45 : 65;
      return {
        name: username,
        role: "Repository collaborator",
        startDate: formatCompactRelativeTime(row.created_at),
        progress,
        mentor: "Repository owner",
      };
    });

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
        viewer={{
          displayName: viewerDisplayName,
          plan: viewerPlan,
        }}
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
