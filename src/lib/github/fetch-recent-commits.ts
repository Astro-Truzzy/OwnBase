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

/** Commit-level event: no per-file expansion, so one API call per repo. */
export type RecentCommit = {
  fullName: string;
  sha: string;
  shaShort: string;
  message: string;
  developer: string;
  developerAvatar: string | null;
  timestamp: string;
  url: string | null;
};

export type FetchRecentCommitsResult = {
  commits: RecentCommit[];
  error?: string;
};

/**
 * Loads recent commits for one repository at **commit** granularity.
 *
 * Deliberately separate from `fetchGithubRepoFileActivity`, which expands every
 * commit into per-file touch events and therefore costs 1 + N requests per repo.
 * The cross-repo activity timeline only needs commit headers, so this makes a
 * single list call — cheap enough to fan out across many repositories.
 */
export async function fetchGithubRecentCommits(
  owner: string,
  repo: string,
  accessToken: string,
  options?: { perPage?: number; since?: string },
): Promise<FetchRecentCommitsResult> {
  const perPage = Math.min(Math.max(options?.perPage ?? 15, 1), 100);

  try {
    const url = new URL(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
    );
    url.searchParams.set("per_page", String(perPage));
    if (options?.since) url.searchParams.set("since", options.since);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 120 },
    });

    if (res.status === 403 || res.status === 404) {
      return {
        commits: [],
        error: "Commit history unavailable — check repository access.",
      };
    }
    if (res.status === 409) {
      // Empty repository: GitHub returns 409 rather than an empty list.
      return { commits: [] };
    }
    if (!res.ok) {
      return { commits: [], error: `GitHub API: ${res.status}` };
    }

    const data = (await res.json()) as GitHubCommitListItem[];
    const fullName = `${owner}/${repo}`;

    const commits: RecentCommit[] = (Array.isArray(data) ? data : []).map(
      (item) => {
        const message = (item.commit?.message ?? "").split("\n")[0]!.trim();
        return {
          fullName,
          sha: item.sha,
          shaShort: item.sha.slice(0, 7),
          message: message || "(no commit message)",
          developer:
            item.author?.login ?? item.commit?.author?.name ?? "Unknown",
          developerAvatar: item.author?.avatar_url ?? null,
          timestamp: item.commit?.author?.date ?? new Date(0).toISOString(),
          url: item.html_url ?? null,
        };
      },
    );

    return { commits };
  } catch (error) {
    return {
      commits: [],
      error:
        error instanceof Error ? error.message : "Failed to load commit history.",
    };
  }
}
