"use client";

import Link from "next/link";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  IconArrowRight,
  IconBulb,
  IconFolder,
  IconLayoutGrid,
  IconUsersGroup,
} from "@tabler/icons-react";
import type { GitHubCollaborator } from "@/lib/github/types";
import type {
  ContributorCrosswalkEntry,
  DeveloperOrgOverviewEntry,
} from "@/lib/dashboard/devs-insights";
import type { PortfolioRiskSnapshot } from "@/lib/dashboard/org-risk-assessment";
import type { AccessMatrix } from "@/lib/access/access-matrix";
import { cn } from "@/lib/utils";
import { DevsTeamOverview } from "./devs-team-overview";
import { DevsInsightsSection } from "./devs-insights-section";
import { DevsRepoSection } from "./devs-repo-section";
import { AccessMatrixView } from "./access-matrix-view";

function repoDetailHref(fullName: string): string {
  const [owner, ...nameParts] = fullName.split("/");
  const name = nameParts.join("/");
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

/** The three views of Team & Access. Default (no/unknown hash) = matrix. */
type DevsView = "matrix" | "roster" | "insights";

/** Preserves existing `#team` deep-links → the roster view. */
function readDevsView(): DevsView {
  if (typeof window === "undefined") return "matrix";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "team") return "roster";
  if (hash === "insights") return "insights";
  return "matrix";
}

function viewToHash(view: DevsView): string {
  return view === "roster" ? "team" : view; // "matrix" | "insights" | "team"
}

type TabIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

const VIEWS: { id: DevsView; label: string; icon: TabIcon }[] = [
  { id: "matrix", label: "Access matrix", icon: IconLayoutGrid },
  { id: "roster", label: "Collaborators", icon: IconUsersGroup },
  { id: "insights", label: "Insights", icon: IconBulb },
];

type GitlabRow = { full_name: string };

type RepoWithCollabs = {
  fullName: string;
  owner: string;
  name: string;
  collaborators: GitHubCollaborator[];
  error?: string;
};

export function DevsPageClient(props: {
  trackedEmpty: boolean;
  snapshot: PortfolioRiskSnapshot;
  crosswalk: ContributorCrosswalkEntry[];
  devOverview: DeveloperOrgOverviewEntry[];
  gitlabRepos: GitlabRow[];
  hasProviderToken: boolean;
  githubTrackedCount: number;
  reposWithCollabs: RepoWithCollabs[];
  accessMatrix: AccessMatrix;
}) {
  const {
    trackedEmpty,
    snapshot,
    crosswalk,
    devOverview,
    gitlabRepos,
    hasProviderToken,
    githubTrackedCount,
    reposWithCollabs,
    accessMatrix,
  } = props;

  // Free tier is a permanent, real plan now — nothing is ever fully locked;
  // per-resource caps (repos/seats/uploads/summaries) do the gating instead.
  const locked = false;

  const gitlabNames = gitlabRepos.map((r) => r.full_name);
  const trackedTotal = snapshot.trackedCount;
  const hasGithubData =
    hasProviderToken && reposWithCollabs.length > 0 && githubTrackedCount > 0;

  // Initialize to a stable constant on both server and client to avoid a
  // hydration mismatch, then reconcile with the URL hash after mount.
  const [view, setView] = useState<DevsView>("matrix");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const sync = () => setView(readDevsView());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  function goToView(next: DevsView) {
    if (typeof window !== "undefined") {
      window.location.hash = viewToHash(next);
    }
    setView(next);
  }

  function onTabKeyDown(event: React.KeyboardEvent, index: number) {
    const count = VIEWS.length;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % count;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + count) % count;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = count - 1;
    } else {
      return;
    }
    event.preventDefault();
    goToView(VIEWS[next].id);
    tabRefs.current[next]?.focus();
  }

  if (trackedEmpty) {
    return (
      <section className="dash-panel p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">
          No repos in your organization yet. Add repos from the{" "}
          <Link
            href="/dashboard"
            className="text-primary underline hover:no-underline"
          >
            dashboard
          </Link>{" "}
          or your{" "}
          <Link
            href="/dashboard/organization"
            className="text-primary underline hover:no-underline"
          >
            organization
          </Link>{" "}
          to see insights and collaborators here.
        </p>
      </section>
    );
  }

  const header = {
    matrix: {
      icon: <IconLayoutGrid className="h-7 w-7" aria-hidden />,
      title: "Team & Access",
    },
    roster: {
      icon: <IconUsersGroup className="h-7 w-7" aria-hidden />,
      title: "Collaborator access",
    },
    insights: {
      icon: <IconBulb className="h-7 w-7" aria-hidden />,
      title: "Insights",
    },
  }[view];

  const description: ReactNode =
    view === "matrix" ? (
      <>
        Manage who can access each repository in one grid. Change a developer’s
        level to update GitHub instantly; GitLab projects are shown for
        reference and managed on GitLab.
      </>
    ) : view === "roster" ? (
      <>
        See every developer in your organization, which repos they are on, and
        their access level — then manage or revoke per repo below.
      </>
    ) : (
      <>
        See who appears across repositories, compare roster sizes, and review
        recent collaborator and membership changes — without duplicating the
        exposure modeling on{" "}
        <Link
          href="/dashboard/organization#risk"
          className="text-primary underline-offset-2 hover:text-foreground hover:underline"
        >
          Risk assessment
        </Link>
        .
      </>
    );

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          {header.icon}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {header.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Team & Access views"
        className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1"
      >
        {VIEWS.map((tab, index) => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`devs-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`devs-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => goToView(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`devs-panel-${view}`}
        aria-labelledby={`devs-tab-${view}`}
        tabIndex={0}
        className="focus:outline-none"
      >
        {view === "matrix" ? (
          <AccessMatrixView matrix={accessMatrix} locked={locked} />
        ) : view === "roster" ? (
          <div className="space-y-10 sm:space-y-12">
            <DevsTeamOverview
              overview={devOverview}
              hasGithubData={hasGithubData}
              githubRepoCount={reposWithCollabs.length}
              repoDetailHref={repoDetailHref}
            />

            {reposWithCollabs.length === 0 && gitlabRepos.length > 0 && (
              <section className="dash-panel p-6 sm:p-8">
                <h2 className="text-lg font-medium text-foreground">
                  GitLab projects
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Collaborator management for GitLab projects is done on GitLab.
                  Open the project and go to Members to add or remove people.
                </p>
                <ul className="mt-4 space-y-2">
                  {gitlabRepos.map((r) => (
                    <li key={r.full_name}>
                      <Link
                        href={repoDetailHref(r.full_name)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                      >
                        <IconFolder
                          className="h-4 w-4 text-primary"
                          aria-hidden
                        />
                        {r.full_name}
                        <IconArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!hasProviderToken && githubTrackedCount > 0 && (
              <section className="dash-panel p-6 sm:p-8">
                <p className="text-sm text-muted-foreground">
                  Sign in with GitHub to see and manage collaborators on your
                  repos. GitLab projects: manage members from the project page
                  on GitLab.
                </p>
              </section>
            )}

            {reposWithCollabs.length > 0 ? (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
                  By repository
                </h2>
                <div className="space-y-10 sm:space-y-12">
                  {reposWithCollabs.map((repo) => (
                    <DevsRepoSection
                      key={repo.fullName}
                      fullName={repo.fullName}
                      owner={repo.owner}
                      name={repo.name}
                      collaborators={repo.collaborators}
                      error={repo.error}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <DevsInsightsSection
            snapshot={snapshot}
            crosswalk={crosswalk}
            repoDetailHref={repoDetailHref}
            gitlabRepoNames={gitlabNames}
            hasGithubData={hasGithubData}
            trackedTotal={trackedTotal}
            githubRosterRepoCount={reposWithCollabs.length}
          />
        )}
      </div>
    </div>
  );
}
