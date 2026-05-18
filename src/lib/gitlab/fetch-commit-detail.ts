import type { CommitDetail, CommitFileChange } from "@/lib/repo-commit-detail";
import type { FileTouchAction } from "@/lib/repo-activity";

const GITLAB_API = "https://gitlab.com/api/v4";

type GitLabCommit = {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  committed_date: string;
  authored_date: string;
  web_url: string;
  stats?: { additions?: number; deletions?: number; total?: number };
};

type GitLabDiff = {
  new_path: string;
  old_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  diff?: string;
};

function diffToAction(diff: GitLabDiff): FileTouchAction {
  if (diff.new_file) return "added";
  if (diff.deleted_file) return "removed";
  if (diff.renamed_file) return "renamed";
  return "modified";
}

function countDiffLines(patch?: string): { additions: number; deletions: number } {
  if (!patch) return { additions: 0, deletions: 0 };
  let additions = 0;
  let deletions = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) additions += 1;
    else if (line.startsWith("-")) deletions += 1;
  }
  return { additions, deletions };
}

export async function fetchGitlabCommitDetail(
  projectPath: string,
  sha: string,
  accessToken: string,
): Promise<{ detail: CommitDetail | null; error?: string }> {
  const encodedProject = encodeURIComponent(projectPath);

  try {
    const commitRes = await fetch(
      `${GITLAB_API}/projects/${encodedProject}/repository/commits/${encodeURIComponent(sha)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      },
    );

    if (!commitRes.ok) {
      const text = await commitRes.text();
      return {
        detail: null,
        error:
          commitRes.status === 404
            ? "Commit not found."
            : `GitLab API: ${commitRes.status}. ${text.slice(0, 160)}`,
      };
    }

    const commit = (await commitRes.json()) as GitLabCommit;

    const diffRes = await fetch(
      `${GITLAB_API}/projects/${encodedProject}/repository/commits/${encodeURIComponent(sha)}/diff`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      },
    );

    const diffs = diffRes.ok ? ((await diffRes.json()) as GitLabDiff[]) : [];

    const files: CommitFileChange[] = diffs.map((diff) => {
      const action = diffToAction(diff);
      const path =
        action === "removed" ? diff.old_path : diff.new_path || diff.old_path;
      const lineCounts = countDiffLines(diff.diff);
      return {
        path,
        previousPath: action === "renamed" ? diff.old_path : undefined,
        action,
        additions: lineCounts.additions,
        deletions: lineCounts.deletions,
        patch: diff.diff,
      };
    });

    const additions =
      commit.stats?.additions ??
      files.reduce((sum, f) => sum + f.additions, 0);
    const deletions =
      commit.stats?.deletions ??
      files.reduce((sum, f) => sum + f.deletions, 0);

    return {
      detail: {
        sha: commit.id,
        shortSha: commit.short_id,
        message: commit.message.trim() || commit.title,
        author: commit.author_name || "Unknown developer",
        authorAvatar: null,
        timestamp: commit.committed_date || commit.authored_date,
        url: commit.web_url,
        stats: {
          additions,
          deletions,
          filesChanged: files.length,
        },
        files,
        provider: "gitlab",
      },
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load commit details.";
    return { detail: null, error: message };
  }
}
