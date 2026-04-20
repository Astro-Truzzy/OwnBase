/**
 * Minimal GitLab API project shape for dashboard display.
 * https://docs.gitlab.com/ee/api/projects.html
 */
export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  visibility: string;
  last_activity_at: string;
  web_url: string;
  default_branch?: string;
}
