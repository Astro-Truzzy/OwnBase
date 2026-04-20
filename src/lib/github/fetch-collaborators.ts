import type { GitHubCollaborator } from "./types";

const GITHUB_API = "https://api.github.com";

export interface FetchCollaboratorsResult {
  collaborators: GitHubCollaborator[];
  error?: string;
}

/**
 * Fetches repository collaborators from GitHub.
 * Requires repo scope (and read:org for org repos). Returns 403/404 if user lacks access.
 */
export async function fetchRepoCollaborators(
  owner: string,
  repo: string,
  accessToken: string
): Promise<FetchCollaboratorsResult> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators?per_page=100&affiliation=direct`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
      }
    );

    if (res.status === 403 || res.status === 404) {
      return {
        collaborators: [],
        error: "Access information is only available to people with permission to manage this repository.",
      };
    }

    if (!res.ok) {
      const text = await res.text();
      return {
        collaborators: [],
        error: `Unable to load access list. ${text.slice(0, 120)}`,
      };
    }

    const data = (await res.json()) as GitHubCollaborator[];
    return { collaborators: data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load collaborators.";
    return { collaborators: [], error: message };
  }
}
