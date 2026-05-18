import {
  normalizeGithubFileStatus,
  type FileTouchAction,
  type RepoFileActivityEvent,
} from "@/lib/repo-activity";

const GITHUB_API = "https://api.github.com";

type GitHubCommitListItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: { login: string; avatar_url: string } | null;
};

type GitHubCommitFile = {
  filename: string;
  previous_filename?: string;
  status: string;
  additions?: number;
  deletions?: number;
};

type GitHubCommitDetail = GitHubCommitListItem & {
  files?: GitHubCommitFile[];
};

export type FetchRepoCommitActivityResult = {
  events: RepoFileActivityEvent[];
  error?: string;
};

async function githubFetch<T>(
  url: string,
  accessToken: string,
): Promise<{ data: T | null; error?: string }> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 120 },
  });

  if (res.status === 403 || res.status === 404) {
    return {
      data: null,
      error:
        "Commit history is unavailable. Check repository access permissions.",
    };
  }

  if (!res.ok) {
    const text = await res.text();
    return {
      data: null,
      error: `GitHub API: ${res.status}. ${text.slice(0, 160)}`,
    };
  }

  return { data: (await res.json()) as T };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

function commitEventsFromDetail(detail: GitHubCommitDetail): RepoFileActivityEvent[] {
  const developer =
    detail.author?.login ??
    detail.commit.author?.name ??
    "Unknown developer";
  const developerAvatar = detail.author?.avatar_url ?? null;
  const timestamp = detail.commit.author?.date ?? new Date().toISOString();
  const commitMessage = detail.commit.message.split("\n")[0]?.trim() ?? "";
  const files = detail.files ?? [];

  return files.map((file) => {
    const action: FileTouchAction = normalizeGithubFileStatus(file.status);
    const filePath =
      action === "renamed" && file.previous_filename
        ? file.filename
        : file.filename;

    return {
      kind: "file",
      id: `${detail.sha}:${filePath}:${file.status}`,
      developer,
      developerAvatar,
      file: filePath,
      previousFile:
        action === "renamed" ? file.previous_filename : undefined,
      action,
      timestamp,
      commitSha: detail.sha.slice(0, 7),
      commitShaFull: detail.sha,
      commitMessage,
      commitUrl: detail.html_url,
      additions: file.additions,
      deletions: file.deletions,
    };
  });
}

/**
 * Loads recent commits and expands each into per-file touch events (developer, file, time).
 */
export async function fetchGithubRepoFileActivity(
  owner: string,
  repo: string,
  accessToken: string,
  options?: { maxCommits?: number; branch?: string },
): Promise<FetchRepoCommitActivityResult> {
  const maxCommits = options?.maxCommits ?? 20;
  const branch = options?.branch;

  try {
    const listUrl = new URL(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
    );
    listUrl.searchParams.set("per_page", String(maxCommits));
    if (branch) listUrl.searchParams.set("sha", branch);

    const listResult = await githubFetch<GitHubCommitListItem[]>(
      listUrl.toString(),
      accessToken,
    );
    if (listResult.error || !listResult.data) {
      return { events: [], error: listResult.error };
    }

    if (listResult.data.length === 0) {
      return { events: [] };
    }

    const details = await mapWithConcurrency(
      listResult.data,
      5,
      async (item) => {
        const detailUrl = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${item.sha}`;
        const detailResult = await githubFetch<GitHubCommitDetail>(
          detailUrl,
          accessToken,
        );
        return detailResult.data;
      },
    );

    const events = details
      .filter((d): d is GitHubCommitDetail => d != null)
      .flatMap(commitEventsFromDetail)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    return { events };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load commit activity.";
    return { events: [], error: message };
  }
}
