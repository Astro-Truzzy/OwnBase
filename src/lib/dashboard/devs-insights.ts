import type {
  AccessLevelLabel,
  GitHubCollaborator,
} from "@/lib/github/types";
import { getAccessLevelLabel } from "@/lib/github/types";

export type DevRepoAttachment = {
  fullName: string;
  access: AccessLevelLabel;
};

/** Per-developer view for Team access: repos they are on and access level on each. */
export type DeveloperOrgOverviewEntry = {
  login: string;
  avatar_url: string;
  html_url: string;
  repos: DevRepoAttachment[];
};

export type ContributorCrosswalkEntry = {  login: string;
  avatar_url: string;
  html_url: string;
  /** Distinct repos this person appears on as a collaborator */
  repos: string[];
  /** Repos where they have Full access (admin/maintain) */
  fullAccessRepos: string[];
};

/**
 * Aggregate collaborators with per-repo access for the Team access overview.
 */
export function buildDeveloperOrgOverview(
  repos: Array<{ fullName: string; collaborators: GitHubCollaborator[] }>,
): DeveloperOrgOverviewEntry[] {
  const byLogin = new Map<
    string,
    {
      login: string;
      avatar_url: string;
      html_url: string;
      repos: DevRepoAttachment[];
    }
  >();

  for (const { fullName, collaborators } of repos) {
    for (const c of collaborators) {
      let row = byLogin.get(c.login);
      if (!row) {
        row = {
          login: c.login,
          avatar_url: c.avatar_url,
          html_url: c.html_url,
          repos: [],
        };
        byLogin.set(c.login, row);
      }
      const existing = row.repos.find((r) => r.fullName === fullName);
      if (!existing) {
        row.repos.push({ fullName, access: getAccessLevelLabel(c) });
      }
    }
  }

  return [...byLogin.values()]
    .map((row) => ({
      ...row,
      repos: [...row.repos].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    }))
    .sort((a, b) => {
      if (b.repos.length !== a.repos.length) return b.repos.length - a.repos.length;
      return a.login.localeCompare(b.login);
    });
}

/**
 * Aggregate GitHub collaborators across repos to show “who spans the most surface area”.
 */
export function buildContributorCrosswalk(
  repos: Array<{ fullName: string; collaborators: GitHubCollaborator[] }>,
): ContributorCrosswalkEntry[] {
  const byLogin = new Map<
    string,
    {
      login: string;
      avatar_url: string;
      html_url: string;
      repoKeys: Set<string>;
      fullAccessRepoKeys: Set<string>;
    }
  >();

  for (const { fullName, collaborators } of repos) {
    for (const c of collaborators) {
      let row = byLogin.get(c.login);
      if (!row) {
        row = {
          login: c.login,
          avatar_url: c.avatar_url,
          html_url: c.html_url,
          repoKeys: new Set(),
          fullAccessRepoKeys: new Set(),
        };
        byLogin.set(c.login, row);
      }
      row.repoKeys.add(fullName);
      if (getAccessLevelLabel(c) === "Full access") {
        row.fullAccessRepoKeys.add(fullName);
      }
    }
  }

  return [...byLogin.values()]
    .map((row) => ({
      login: row.login,
      avatar_url: row.avatar_url,
      html_url: row.html_url,
      repos: [...row.repoKeys].sort(),
      fullAccessRepos: [...row.fullAccessRepoKeys].sort(),
    }))
    .sort((a, b) => b.repos.length - a.repos.length);
}
