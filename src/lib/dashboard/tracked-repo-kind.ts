import { parseTrackedRepoFullName } from "@/lib/dashboard/parse-tracked-repo";

export type TrackedRepoKind = "github" | "gitlab" | "upload";

/**
 * Classify a tracked row for reporting / UX (GitLab vs GitHub API vs uploaded assets).
 */
export function getTrackedRepoKind(row: {
  full_name: string;
  repo_owner: string;
}): TrackedRepoKind {
  if (row.repo_owner === "gitlab") return "gitlab";
  if (row.repo_owner === "upload" || row.full_name.startsWith("upload/")) {
    return "upload";
  }
  const parsed = parseTrackedRepoFullName(row.full_name);
  if (parsed?.provider === "gitlab") return "gitlab";
  return "github";
}

export function gitlabProjectMembersUrl(pathWithNamespace: string): string {
  const path = pathWithNamespace.replace(/^\/+/, "");
  const segments = path.split("/").filter(Boolean).map(encodeURIComponent);
  return `https://gitlab.com/${segments.join("/")}/-/project_members`;
}
