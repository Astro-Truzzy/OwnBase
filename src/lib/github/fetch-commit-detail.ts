import { normalizeGithubFileStatus } from "@/lib/repo-activity";
import type { CommitDetail, CommitFileChange } from "@/lib/repo-commit-detail";

const GITHUB_API = "https://api.github.com";

type GitHubCommitDetail = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: { login: string; avatar_url: string } | null;
  stats?: { additions?: number; deletions?: number; total?: number };
  files?: Array<{
    filename: string;
    previous_filename?: string;
    status: string;
    additions?: number;
    deletions?: number;
    patch?: string;
  }>;
};

export async function fetchGithubCommitDetail(
  owner: string,
  repo: string,
  sha: string,
  accessToken: string,
): Promise<{ detail: CommitDetail | null; error?: string }> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return {
        detail: null,
        error:
          res.status === 404
            ? "Commit not found."
            : `GitHub API: ${res.status}. ${text.slice(0, 160)}`,
      };
    }

    const data = (await res.json()) as GitHubCommitDetail;
    const files: CommitFileChange[] = (data.files ?? []).map((file) => ({
      path: file.filename,
      previousPath: file.previous_filename,
      action: normalizeGithubFileStatus(file.status),
      additions: file.additions ?? 0,
      deletions: file.deletions ?? 0,
      patch: file.patch,
    }));

    const additions =
      data.stats?.additions ??
      files.reduce((sum, f) => sum + f.additions, 0);
    const deletions =
      data.stats?.deletions ??
      files.reduce((sum, f) => sum + f.deletions, 0);

    return {
      detail: {
        sha: data.sha,
        shortSha: data.sha.slice(0, 7),
        message: data.commit.message.trim(),
        author:
          data.author?.login ?? data.commit.author?.name ?? "Unknown developer",
        authorAvatar: data.author?.avatar_url ?? null,
        timestamp: data.commit.author?.date ?? new Date().toISOString(),
        url: data.html_url,
        stats: {
          additions,
          deletions,
          filesChanged: files.length,
        },
        files,
        provider: "github",
      },
    };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load commit details.";
    return { detail: null, error: message };
  }
}
