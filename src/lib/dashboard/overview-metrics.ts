import type { DashboardTabKey } from "@/app/dashboard/dashboard-tab-hash";
import type { PortfolioFilterKey } from "@/lib/dashboard/searchable-repos";

export interface DashboardTodoItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  /** In-dashboard navigation (tab switch + optional portfolio filter). */
  dashboardTab?: DashboardTabKey;
  portfolioFilter?: PortfolioFilterKey;
}

export type DashboardTodoTargets = {
  summary?: string | null;
  busFactor?: string | null;
  lowHealth?: string | null;
  security?: string | null;
  access?: string | null;
};

/** No tracked repos and no uploads — show onboarding, not portfolio metrics. */
export function isNewWorkspace(trackedRepos: number, uploads: number): boolean {
  return trackedRepos <= 0 && uploads <= 0;
}

export function computeDocsCoveragePercent(
  trackedRepoCount: number,
  summarizedTrackedCount: number,
): number {
  if (trackedRepoCount <= 0) return 0;
  if (summarizedTrackedCount <= 0) return 0;
  return Math.min(
    100,
    Math.round((summarizedTrackedCount / trackedRepoCount) * 100),
  );
}

export function buildDashboardTodos(options: {
  repositoryCount: number;
  trackedRepos: number;
  uploads: number;
  summariesCount: number;
  teamCount: number;
  singleContributorRepos: number;
  lowHealthRepos: number;
  securityEvents: number;
  hasGitProvider?: boolean;
  targets?: DashboardTodoTargets;
}): DashboardTodoItem[] {
  const targets = options.targets ?? {};
  const {
    repositoryCount,
    trackedRepos,
    uploads,
    summariesCount,
    teamCount,
    singleContributorRepos,
    lowHealthRepos,
    securityEvents,
    hasGitProvider = false,
  } = options;

  if (repositoryCount === 0 && trackedRepos === 0) {
    const items: DashboardTodoItem[] = [];

    if (!hasGitProvider) {
      items.push({
        id: "connect",
        title: "Connect GitHub or GitLab",
        desc: "Link your account so you can browse and track repositories.",
        href: "/dashboard/organization",
      });
    }

    items.push({
      id: "track-repo",
      title: "Track your first repository",
      desc: hasGitProvider
        ? "Open Organization and add repos in one click."
        : "After connecting a provider, use Organization to add repos.",
      href: "/dashboard/organization",
    });

    if (uploads === 0) {
      items.push({
        id: "upload",
        title: "Or upload a project zip",
        desc: "Optional snapshot when your code is not on GitHub or GitLab yet.",
        href: "/dashboard/upload",
      });
    }

    if (summariesCount === 0 && items.length < 3) {
      items.push({
        id: "summary",
        title: "Generate an AI overview",
        desc: "Available after you track a repo or upload a project.",
        href: targets.summary ?? "/dashboard/organization",
      });
    }

    return items.slice(0, 3);
  }

  const items: DashboardTodoItem[] = [];

  if (trackedRepos === 0 && repositoryCount > 0) {
    items.push({
      id: "track-repo",
      title: "Add a repo to your organization",
      desc: "Tracked repos unlock health signals, access maps, and summaries.",
      href: "/dashboard/organization",
    });
  }

  if (summariesCount === 0 && (trackedRepos > 0 || repositoryCount > 0)) {
    items.push({
      id: "summary",
      title: "Generate your first AI summary",
      desc: "Open a repository hub and create an executive overview.",
      href: targets.summary ?? "/dashboard/organization",
    });
  }

  if (uploads === 0 && items.length < 3) {
    items.push({
      id: "upload",
      title: "Upload a project backup",
      desc: "Optional zip upload for repos that are not on GitHub or GitLab.",
      href: "/dashboard/upload",
    });
  }

  if (trackedRepos > 0 && singleContributorRepos > 0 && items.length < 3) {
    items.push({
      id: "bus-factor",
      title: "Review single-contributor repos",
      desc: `${singleContributorRepos} repo${singleContributorRepos === 1 ? "" : "s"} may depend on one maintainer.`,
      href:
        targets.busFactor ?? "/dashboard?pf=critical#portfolio",
      dashboardTab: targets.busFactor ? undefined : "portfolio",
      portfolioFilter: targets.busFactor ? undefined : "critical",
    });
  }

  if (trackedRepos > 0 && lowHealthRepos > 0 && items.length < 3) {
    items.push({
      id: "low-health",
      title: "Check inactive repositories",
      desc: `${lowHealthRepos} repo${lowHealthRepos === 1 ? " needs" : "s need"} attention based on recent activity.`,
      href: targets.lowHealth ?? "/dashboard#portfolio",
      dashboardTab: targets.lowHealth ? undefined : "portfolio",
    });
  }

  if (trackedRepos > 0 && securityEvents > 0 && items.length < 3) {
    items.push({
      id: "security",
      title: "Review access changes",
      desc: "Recent collaborator or permission changes need a quick audit.",
      href: targets.security ?? "/dashboard/devs",
    });
  }

  if (trackedRepos > 0 && teamCount > 0 && items.length < 3) {
    items.push({
      id: "access",
      title: "Audit collaborator access",
      desc: "Confirm who has admin, write, and read access across your portfolio.",
      href: targets.access ?? "/dashboard/devs#team",
    });
  }

  if (items.length === 0) {
    return [
      {
        id: "explore",
        title: "Workspace looks healthy",
        desc: "Open a repository hub to run summaries or review recent activity.",
        href: "/dashboard#portfolio",
        dashboardTab: "portfolio",
      },
    ];
  }

  return items.slice(0, 3);
}
