import { fetchUserProjects } from "@/lib/gitlab/fetch-projects";
import { fetchUserRepos } from "@/lib/github/fetch-repos";

export type SearchableRepo = {
  id: string;
  name: string;
  fullName: string;
  detailHref: string;
  unit: string;
  tech: string;
};

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function repoUnit(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pay") || n.includes("bill")) return "Finance";
  if (n.includes("portal") || n.includes("customer")) return "Operations";
  if (n.includes("data") || n.includes("analytics")) return "Data";
  if (n.includes("auth") || n.includes("security")) return "Security";
  return "Platform";
}

export function matchSearchableRepo(
  repo: SearchableRepo,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true;
  return (
    repo.name.toLowerCase().includes(normalizedQuery) ||
    repo.unit.toLowerCase().includes(normalizedQuery) ||
    repo.tech.toLowerCase().includes(normalizedQuery) ||
    repo.fullName.toLowerCase().includes(normalizedQuery)
  );
}

export function filterSearchableRepos(
  repos: SearchableRepo[],
  query: string,
): SearchableRepo[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return repos;
  return repos.filter((repo) => matchSearchableRepo(repo, normalizedQuery));
}

export async function fetchSearchableReposForUser(options: {
  provider: string;
  providerToken: string | null;
}): Promise<SearchableRepo[]> {
  const { provider, providerToken } = options;

  if (provider === "gitlab" && providerToken) {
    const { projects } = await fetchUserProjects(providerToken);
    return projects.map((project) => ({
      id: `gitlab-${project.id}`,
      fullName: `gitlab/${project.path_with_namespace}`,
      detailHref: repoDetailHref(`gitlab/${project.path_with_namespace}`),
      name: project.name,
      unit: repoUnit(project.name),
      tech: `GitLab • ${project.visibility === "private" ? "Private" : "Public"}`,
    }));
  }

  if (!providerToken || provider === "gitlab") {
    return [];
  }

  const { repos } = await fetchUserRepos(providerToken);
  return repos.map((repo) => ({
    id: `github-${repo.id}`,
    fullName: repo.full_name,
    detailHref: repoDetailHref(repo.full_name),
    name: repo.name,
    unit: repoUnit(repo.name),
    tech: `GitHub • ${repo.private ? "Private" : "Public"}`,
  }));
}
