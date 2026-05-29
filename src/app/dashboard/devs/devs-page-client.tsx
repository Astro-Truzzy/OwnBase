"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import {
  IconArrowRight,
  IconBulb,
  IconFolder,
  IconUsersGroup,
} from "@tabler/icons-react";
import type { GitHubCollaborator } from "@/lib/github/types";
import type {
  ContributorCrosswalkEntry,
  DeveloperOrgOverviewEntry,
} from "@/lib/dashboard/devs-insights";
import { DevsTeamOverview } from "./devs-team-overview";
import type { PortfolioRiskSnapshot } from "@/lib/dashboard/org-risk-assessment";
import { DevsInsightsSection } from "./devs-insights-section";
import { DevsRepoSection } from "./devs-repo-section";

function repoDetailHref(fullName: string): string {
  const [owner, ...nameParts] = fullName.split("/");
  const name = nameParts.join("/");
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function readTeamTab(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hash.replace(/^#/, "") === "team";
}

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
  } = props;

  const gitlabNames = gitlabRepos.map((r) => r.full_name);
  const trackedTotal = snapshot.trackedCount;
  const hasGithubData =
    hasProviderToken && reposWithCollabs.length > 0 && githubTrackedCount > 0;

  const [teamTab, setTeamTab] = useState(false);

  useLayoutEffect(() => {
    const sync = () => setTeamTab(readTeamTab());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

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

  return (
    <div className="w-full min-w-0 space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          {teamTab ? (
            <IconUsersGroup className="h-7 w-7" aria-hidden />
          ) : (
            <IconBulb className="h-7 w-7" aria-hidden />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {teamTab ? "Collaborator access" : "Insights"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {teamTab ? (
              <>
                See every developer in your organization, which repos they are
                on, and their access level — then manage or revoke per repo
                below.
              </>
            ) : (
              <>
                See who appears across repositories, compare roster sizes, and
                review recent collaborator and membership changes — without
                duplicating the exposure modeling on{" "}
                <Link
                  href="/dashboard/organization#risk"
                  className="text-primary underline-offset-2 hover:text-foreground hover:underline"
                >
                  Risk assessment
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </div>

      {teamTab ? (
        <div className="space-y-10 sm:space-y-12">
          <DevsTeamOverview
            overview={devOverview}
            hasGithubData={hasGithubData}
            githubRepoCount={reposWithCollabs.length}
            repoDetailHref={repoDetailHref}
          />

          {reposWithCollabs.length === 0 && gitlabRepos.length > 0 && (
            <section className="dash-panel p-6 sm:p-8">
              <h2 className="text-lg font-medium text-foreground">GitLab projects</h2>
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
                repos. GitLab projects: manage members from the project page on
                GitLab.
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
  );
}
