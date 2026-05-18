import {
  type FileTouchAction,
  type RepoFileActivityEvent,
} from "@/lib/repo-activity";

const GITLAB_API = "https://gitlab.com/api/v4";

type GitLabCommit = {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committed_date: string;
  web_url: string;
};

type GitLabDiff = {
  new_path: string;
  old_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
};

export type FetchGitlabRepoFileActivityResult = {
  events: RepoFileActivityEvent[];
  error?: string;
};

function diffToAction(diff: GitLabDiff): FileTouchAction {
  if (diff.new_file) return "added";
  if (diff.deleted_file) return "removed";
  if (diff.renamed_file) return "renamed";
  return "modified";
}

/**
 * Loads recent GitLab commits and expands diffs into per-file touch events.
 */
export async function fetchGitlabRepoFileActivity(
  projectPath: string,
  accessToken: string,
  options?: { maxCommits?: number },
): Promise<FetchGitlabRepoFileActivityResult> {
  const maxCommits = options?.maxCommits ?? 20;
  const encodedProject = encodeURIComponent(projectPath);

  try {
    const listRes = await fetch(
      `${GITLAB_API}/projects/${encodedProject}/repository/commits?per_page=${maxCommits}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 120 },
      },
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      return {
        events: [],
        error: `GitLab API: ${listRes.status}. ${text.slice(0, 160)}`,
      };
    }

    const commits = (await listRes.json()) as GitLabCommit[];
    if (commits.length === 0) return { events: [] };

    const events: RepoFileActivityEvent[] = [];

    for (const commit of commits.slice(0, maxCommits)) {
      const diffRes = await fetch(
        `${GITLAB_API}/projects/${encodedProject}/repository/commits/${commit.id}/diff`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          next: { revalidate: 120 },
        },
      );

      if (!diffRes.ok) continue;

      const diffs = (await diffRes.json()) as GitLabDiff[];
      const timestamp = commit.committed_date || commit.authored_date;
      const commitMessage =
        commit.title?.trim() || commit.message.split("\n")[0]?.trim() || "";

      for (const diff of diffs) {
        const action = diffToAction(diff);
        const file =
          action === "removed" ? diff.old_path : diff.new_path || diff.old_path;

        events.push({
          kind: "file",
          id: `${commit.short_id}:${file}:${action}`,
          developer: commit.author_name || "Unknown developer",
          developerAvatar: null,
          file,
          previousFile:
            action === "renamed" ? diff.old_path : undefined,
          action,
          timestamp,
          commitSha: commit.short_id,
          commitShaFull: commit.id,
          commitMessage,
          commitUrl: commit.web_url,
        });
      }
    }

    events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return { events };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load GitLab commit activity.";
    return { events: [], error: message };
  }
}
