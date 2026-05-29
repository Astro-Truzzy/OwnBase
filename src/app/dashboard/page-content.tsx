import { createClient } from "../../lib/supabase/server";
import { fetchUserProjects } from "../../lib/gitlab/fetch-projects";
import { fetchRepoCollaborators } from "../../lib/github/fetch-collaborators";
import { fetchUserRepos } from "../../lib/github/fetch-repos";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import type { SearchableRepo } from "@/lib/dashboard/searchable-repos";
import { getUsageSnapshot } from "../../lib/usage-stats";
import {
  DashboardActivation,
  type OnboardingStep,
} from "./dashboard-activation";
import {
  buildDashboardTodos,
  computeDocsCoveragePercent,
  isNewWorkspace,
} from "@/lib/dashboard/overview-metrics";
import {
  buildPortfolioHealthTrend,
  calcHealthScore,
  countSummariesForTracked,
  inferRepoUnit,
  lastActivityIsoForRepo,
  repoStatus,
} from "@/lib/dashboard/portfolio-data";
import {
  type DashboardActivityView,
  type DashboardOnboardingView,
  type DashboardRepoView,
  type DashboardTeamView,
  DashboardTabsView,
} from "./dashboard-tabs-view";
import { DashboardIntroFlow } from "./dashboard-intro-flow";

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

const MAX_TRACKED_REPOS_FOR_COLLAB_FETCH = 24;
const COLLABORATOR_FETCH_TIMEOUT_MS = 4000;
const ACTIVITY_TREND_MONTHS = 6;

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
            "onboarding_checklist_dismissed_at, dashboard_walkthrough_completed_at, first_name, last_name, plan, business_name",
          )
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

  const trendSince = new Date();
  trendSince.setUTCMonth(trendSince.getUTCMonth() - (ACTIVITY_TREND_MONTHS - 1));
  trendSince.setUTCDate(1);
  trendSince.setUTCHours(0, 0, 0, 0);

  const [{ data: summaryRows }, { data: activityRowsRaw }] =
    user != null
      ? await Promise.all([
          supabase.from("repo_summaries").select("full_name").eq("user_id", user.id),
          supabase
            .from("activity_log")
            .select("full_name, action_type, details, created_at")
            .eq("user_id", user.id)
            .gte("created_at", trendSince.toISOString())
            .order("created_at", { ascending: false })
            .limit(500),
        ])
      : [{ data: [] }, { data: [] }];

  const activityRows = activityRowsRaw ?? [];
  const recentActivityRows = activityRows.slice(0, 100);

  const trackedDone = (usage?.trackedRepos ?? 0) > 0;
  const uploadDone = (usage?.uploads ?? 0) > 0;
  const summaryDone = (summaryRows?.length ?? 0) > 0;
  const allOnboardingDone = trackedDone && uploadDone && summaryDone;
  const onboardingDismissed =
    profileExtras?.onboarding_checklist_dismissed_at != null;
  const showDashboardWalkthrough =
    profileExtras?.dashboard_walkthrough_completed_at == null;
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
  const hasGitHubIdentity =
    user?.identities?.some((identity) => identity.provider === "github") ??
    false;
  const githubToken =
    user != null ? await getGitHubAccessToken(supabase, user) : null;
  const providerToken =
    provider === "gitlab"
      ? (session?.provider_token ?? null)
      : githubToken;

  const githubResult =
    provider === "gitlab" || !githubToken
      ? { repos: [] }
      : await fetchUserRepos(githubToken);
  const githubRepos = githubResult.repos ?? [];

  const { projects: gitlabProjects } =
    provider === "gitlab" && providerToken
      ? await fetchUserProjects(providerToken)
      : { projects: [] };

  const { data: trackedRows } =
    user != null
      ? await supabase
          .from("tracked_repos")
          .select("full_name, repo_name, repo_owner, added_at")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false })
      : { data: [] };

  const tracked = trackedRows ?? [];
  const trackedFullNames = new Set(tracked.map((row) => row.full_name));

  const trackedGithubRows = tracked
    .filter((row) => row.repo_owner !== "gitlab")
    .slice(0, MAX_TRACKED_REPOS_FOR_COLLAB_FETCH);

  const collaboratorsByRepo =
    providerToken && provider !== "gitlab" && trackedGithubRows.length > 0
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
              fullName: repoRow.full_name,
              collaborators,
            };
          }),
        ).then((results) =>
          results.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : [],
          ),
        )
      : [];

  const collaboratorCountByFullName = new Map<string, number>();
  for (const entry of collaboratorsByRepo) {
    collaboratorCountByFullName.set(
      entry.fullName,
      entry.collaborators.length,
    );
  }

  const githubByFullName = new Map(
    githubRepos.map((repo) => [repo.full_name, repo] as const),
  );
  const gitlabByFullName = new Map(
    gitlabProjects.map(
      (project) =>
        [`gitlab/${project.path_with_namespace}`, project] as const,
    ),
  );

  const discoverableRepos: SearchableRepo[] = [
    ...(provider !== "gitlab" && githubRepos.length > 0
      ? githubRepos.slice(0, 60).map((repo) => ({
          id: `github-${repo.id}`,
          fullName: repo.full_name,
          detailHref: repoDetailHref(repo.full_name),
          name: repo.name,
          unit: inferRepoUnit(repo.name),
          tech: `GitHub • ${repo.private ? "Private" : "Public"}`,
        }))
      : []),
    ...(provider === "gitlab" && gitlabProjects.length > 0
      ? gitlabProjects.slice(0, 60).map((project) => ({
          id: `gitlab-${project.id}`,
          fullName: `gitlab/${project.path_with_namespace}`,
          detailHref: repoDetailHref(`gitlab/${project.path_with_namespace}`),
          name: project.name,
          unit: inferRepoUnit(project.name),
          tech: `GitLab • ${project.visibility === "private" ? "Private" : "Public"}`,
        }))
      : []),
  ];

  const organizationTracked = tracked.map((row) => {
    const isGitlab = row.repo_owner === "gitlab";
    const fullName = row.full_name;
    const githubRepo = githubByFullName.get(fullName);
    const gitlabProject = isGitlab
      ? gitlabByFullName.get(
          fullName.startsWith("gitlab/")
            ? fullName
            : `gitlab/${row.repo_name}`,
        )
      : undefined;

    return {
      fullName,
      name: row.repo_name,
      detailHref: repoDetailHref(fullName),
      tech: isGitlab
        ? `GitLab • ${gitlabProject?.visibility === "private" ? "Private" : "Public"}`
        : githubRepo
          ? `GitHub • ${githubRepo.private ? "Private" : "Public"}`
          : "Tracked repository",
      addedAt: row.added_at,
    };
  });

  const repositories: DashboardRepoView[] = tracked.map((row) => {
    const isGitlab = row.repo_owner === "gitlab";
    const fullName = row.full_name;
    const githubRepo = githubByFullName.get(fullName);
    const gitlabProject = isGitlab
      ? gitlabByFullName.get(
          fullName.startsWith("gitlab/")
            ? fullName
            : `gitlab/${row.repo_name}`,
        )
      : undefined;
    const collabCount = collaboratorCountByFullName.get(fullName) ?? 0;
    const busFactor = collabCount;
    const lastActivityIso =
      githubRepo?.updated_at ??
      gitlabProject?.last_activity_at ??
      lastActivityIsoForRepo(fullName, activityRows) ??
      row.added_at;
    const health = calcHealthScore(lastActivityIso);
    const detailHref = isGitlab
      ? repoDetailHref(
          fullName.startsWith("gitlab/")
            ? fullName
            : `gitlab/${row.repo_name}`,
        )
      : repoDetailHref(fullName);

    return {
      id: `tracked-${fullName}`,
      fullName,
      detailHref,
      name: row.repo_name,
      unit: inferRepoUnit(row.repo_name),
      tech: isGitlab
        ? `GitLab • ${gitlabProject?.visibility === "private" ? "Private" : "Public"}`
        : githubRepo
          ? `GitHub • ${githubRepo.private ? "Private" : "Public"}`
          : "Tracked repository",
      health,
      contributors: collabCount,
      lastDeploy: formatRelativeTime(lastActivityIso),
      status: repoStatus(health, busFactor),
      busFactor,
      description:
        githubRepo?.description ??
        gitlabProject?.description ??
        `Added to your organization ${formatRelativeTime(row.added_at)}.`,
    };
  });

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
    const repoLabel =
      repo.fullName.split("/").filter(Boolean).pop() ?? repo.fullName;
    const domain = inferRepoUnit(repoLabel);
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
    const domain = inferRepoUnit(repoName);
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
      const accessLabel =
        permission === "admin"
          ? "Admin access"
          : permission === "pull"
            ? "Read access"
            : "Write access";
      return {
        name: username,
        role: accessLabel,
        startDate: formatCompactRelativeTime(row.created_at),
        repo: row.full_name,
      };
    });

  const avgHealth =
    repositories.length > 0
      ? Math.round(
          repositories.reduce((sum, r) => sum + r.health, 0) /
            repositories.length,
        )
      : 0;

  const teamMemberCount = team.filter((m) => m.name !== "System").length;
  const summarizedTrackedCount = countSummariesForTracked(
    trackedFullNames,
    (summaryRows ?? []).map((row) => row.full_name).filter(Boolean) as string[],
  );
  const docsCoverage = computeDocsCoveragePercent(
    tracked.length,
    summarizedTrackedCount,
  );
  const healthTrend = buildPortfolioHealthTrend(
    repositories.map((r) => ({ fullName: r.fullName, health: r.health })),
    activityRows,
  );
  const newWorkspace = isNewWorkspace(
    tracked.length,
    usage?.uploads ?? 0,
  );
  const hasTrendData =
    !newWorkspace &&
    repositories.length > 0 &&
    activityRows.some((row) => trackedFullNames.has(row.full_name));
  const singleContributorRepos = repositories.filter(
    (r) => r.busFactor <= 1,
  ).length;
  const lowHealthRepos = repositories.filter((r) => r.health < 85).length;
  const securityEvents = activities.filter((a) => a.type === "security").length;
  const summarizedFullNames = new Set(
    (summaryRows ?? [])
      .map((row) => row.full_name)
      .filter((name): name is string => Boolean(name)),
  );
  const firstWithoutSummary = repositories.find(
    (repo) => !summarizedFullNames.has(repo.fullName),
  );
  const firstSingleContributor = repositories.find((repo) => repo.busFactor <= 1);
  const firstLowHealth = repositories.find((repo) => repo.health < 85);
  const firstSecurityActivity = activities.find((a) => a.type === "security");

  const todos = buildDashboardTodos({
    repositoryCount: repositories.length || discoverableRepos.length,
    trackedRepos: usage?.trackedRepos ?? 0,
    uploads: usage?.uploads ?? 0,
    summariesCount: summaryRows?.length ?? 0,
    teamCount: teamMemberCount,
    singleContributorRepos,
    lowHealthRepos,
    securityEvents,
    hasGitProvider: Boolean(providerToken) || hasGitHubIdentity,
    targets: {
      summary: firstWithoutSummary
        ? `${firstWithoutSummary.detailHref}#summary`
        : repositories[0]
          ? `${repositories[0].detailHref}#summary`
          : null,
      busFactor: firstSingleContributor
        ? `${firstSingleContributor.detailHref}#access`
        : "/dashboard/devs#team",
      lowHealth: firstLowHealth
        ? `${firstLowHealth.detailHref}#activity`
        : null,
      security: firstSecurityActivity
        ? `${repoDetailHref(firstSecurityActivity.repo)}#activity`
        : null,
      access: "/dashboard/devs#team",
    },
  });
  const hasPortfolioData = tracked.length > 0;

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
      {showDashboardWalkthrough && (
        <DashboardIntroFlow displayName={viewerDisplayName} />
      )}
      <DashboardTabsView
        repositories={repositories}
        discoverableRepos={discoverableRepos}
        organizationTracked={organizationTracked}
        trackedLimit={usage?.limits.maxTrackedRepos ?? 5}
        businessName={profileExtras?.business_name?.trim() ?? null}
        hasGitProvider={Boolean(providerToken) || hasGitHubIdentity}
        activities={activities}
        team={team}
        onboarding={onboarding}
        viewer={{
          displayName: viewerDisplayName,
          plan: viewerPlan,
        }}
        summary={{
          healthScore: newWorkspace ? null : avgHealth,
          totalSystems: tracked.length,
          teamMembers: teamMemberCount,
          docsCoverage: newWorkspace ? null : docsCoverage,
        }}
        isNewWorkspace={newWorkspace}
        hasPortfolioData={hasPortfolioData}
        hasTrendData={hasTrendData}
        todos={todos}
        trendMonthLabels={healthTrend.monthLabels}
        currentTrendValues={hasTrendData ? healthTrend.values : []}
        previousQuarterValues={[]}
        industryAverageValues={[]}
      />
    </>
  );
}
