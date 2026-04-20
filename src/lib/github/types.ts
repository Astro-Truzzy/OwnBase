/**
 * Minimal GitHub API repo shape for dashboard display.
 * We only read metadata; no code or content is stored.
 */
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  updated_at: string;
  html_url: string;
  default_branch?: string;
}

/** GitHub API collaborator shape from GET /repos/{owner}/{repo}/collaborators */
export interface GitHubCollaborator {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  permissions?: {
    pull: boolean;
    triage?: boolean;
    push: boolean;
    maintain?: boolean;
    admin: boolean;
  };
}

/** User-facing access level (no technical jargon). */
export type AccessLevelLabel = "View only" | "Can edit" | "Full access";

/**
 * Maps GitHub permission flags to a single executive-friendly label.
 * admin/maintain → Full access; push → Can edit; pull/triage → View only.
 */
export function getAccessLevelLabel(collab: GitHubCollaborator): AccessLevelLabel {
  const p = collab.permissions;
  if (!p) return "View only";
  if (p.admin || p.maintain) return "Full access";
  if (p.push) return "Can edit";
  return "View only";
}
