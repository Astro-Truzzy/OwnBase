import type { GitHubRepo } from "./types";

const GITHUB_API = "https://api.github.com";

/**
 * Fetches a single repository by owner and name. Returns null if not found or no access.
 */
export async function fetchRepo(
  owner: string,
  repo: string,
  accessToken: string
): Promise<{ repo: GitHubRepo | null; error?: string }> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) {
      if (res.status === 404) return { repo: null, error: "Repository not found." };
      const text = await res.text();
      return { repo: null, error: `GitHub API: ${res.status}. ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as GitHubRepo;
    return { repo: data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch repository.";
    return { repo: null, error: message };
  }
}

export interface FetchReposResult {
  repos: GitHubRepo[];
  error?: string;
}

/**
 * Fetches the authenticated user's repositories from GitHub.
 * Uses OAuth token only; no data is stored in our database.
 */
export async function fetchUserRepos(accessToken: string): Promise<FetchReposResult> {
  try {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=100&sort=updated&direction=desc&type=all`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) {
        return { repos: [], error: "GitHub token invalid or expired." };
      }
      return {
        repos: [],
        error: `GitHub API error: ${res.status}. ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as GitHubRepo[];
    return { repos: data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch repositories.";
    return { repos: [], error: message };
  }
}
