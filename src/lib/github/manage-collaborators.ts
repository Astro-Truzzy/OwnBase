const GITHUB_API = "https://api.github.com";

/** GitHub API permission for adding/updating a collaborator. */
export type GitHubCollaboratorPermission = "pull" | "push" | "maintain" | "admin";

export interface AddCollaboratorResult {
  success: boolean;
  error?: string;
}

/**
 * Adds a collaborator to a repository (or updates their permission).
 * Requires admin/maintain permission on the repo. User stays in-app; no redirect to GitHub.
 */
export async function addRepoCollaborator(
  owner: string,
  repo: string,
  username: string,
  permission: GitHubCollaboratorPermission,
  accessToken: string
): Promise<AddCollaboratorResult> {
  const normalizedUsername = username.trim().replace(/^@/, "");
  if (!normalizedUsername) {
    return { success: false, error: "Enter a GitHub username." };
  }

  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(normalizedUsername)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permission }),
      }
    );

    if (res.status === 201 || res.status === 204) {
      return { success: true };
    }

    if (res.status === 403) {
      return {
        success: false,
        error: "You don’t have permission to add people to this repo. Only repo admins can.",
      };
    }

    if (res.status === 404) {
      const text = await res.text();
      if (text.toLowerCase().includes("not found")) {
        return { success: false, error: "Repo not found or username doesn’t exist on GitHub." };
      }
      return { success: false, error: "Repo or user not found." };
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text) as { message?: string };
      return { success: false, error: data.message ?? "Could not add collaborator." };
    } catch {
      return { success: false, error: text.slice(0, 120) || "Could not add collaborator." };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add collaborator.";
    return { success: false, error: message };
  }
}

export interface RemoveCollaboratorResult {
  success: boolean;
  error?: string;
}

/**
 * Removes a collaborator from a repository.
 * Requires admin/maintain permission on the repo. User stays in-app; no redirect to GitHub.
 */
export async function removeRepoCollaborator(
  owner: string,
  repo: string,
  username: string,
  accessToken: string
): Promise<RemoveCollaboratorResult> {
  const normalizedUsername = username.trim().replace(/^@/, "");
  if (!normalizedUsername) {
    return { success: false, error: "Username is required." };
  }

  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(normalizedUsername)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (res.status === 204) {
      return { success: true };
    }

    if (res.status === 403) {
      return {
        success: false,
        error: "You don’t have permission to remove people from this repo. Only repo admins can.",
      };
    }

    if (res.status === 404) {
      return { success: false, error: "Repo or user not found." };
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text) as { message?: string };
      return { success: false, error: data.message ?? "Could not remove collaborator." };
    } catch {
      return { success: false, error: text.slice(0, 120) || "Could not remove collaborator." };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to remove collaborator.";
    return { success: false, error: message };
  }
}
