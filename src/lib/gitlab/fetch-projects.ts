import type { GitLabProject } from "./types";

const GITLAB_API = "https://gitlab.com/api/v4";

export interface FetchGitLabProjectsResult {
  projects: GitLabProject[];
  error?: string;
}

/**
 * Fetches a single GitLab project by path (path_with_namespace, URL-encoded).
 */
export async function fetchProjectByPath(
  pathWithNamespace: string,
  accessToken: string
): Promise<{ project: GitLabProject | null; error?: string }> {
  try {
    const encoded = encodeURIComponent(pathWithNamespace);
    const res = await fetch(`${GITLAB_API}/projects/${encoded}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      if (res.status === 404) return { project: null, error: "Project not found." };
      const text = await res.text();
      return { project: null, error: `GitLab API: ${res.status}. ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as GitLabProject;
    return { project: data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch project.";
    return { project: null, error: message };
  }
}

/**
 * Fetches the authenticated user's projects from GitLab (membership = true).
 */
export async function fetchUserProjects(
  accessToken: string
): Promise<FetchGitLabProjectsResult> {
  try {
    const res = await fetch(
      `${GITLAB_API}/projects?membership=true&order_by=last_activity_at&sort=desc&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) {
        return { projects: [], error: "GitLab token invalid or expired." };
      }
      return {
        projects: [],
        error: `GitLab API error: ${res.status}. ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as GitLabProject[];
    return { projects: data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch GitLab projects.";
    return { projects: [], error: message };
  }
}
