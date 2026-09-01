import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import {
  fetchGithubRecentCommits,
  type FetchRecentCommitsResult,
  type RecentCommit,
} from "@/lib/github/fetch-recent-commits";
import { buildUnifiedTimeline } from "@/lib/activity/unified-timeline";
import type { ActivityLogRow } from "@/lib/db/types";
import { ActivityPageClient } from "./activity-page-client";

/** How many repos get a live commit fetch. Bounded to keep the page fast. */
const MAX_COMMIT_REPOS = 8;
const COMMITS_PER_REPO = 15;
const COMMIT_FETCH_TIMEOUT_MS = 4000;
/** Audit window loaded into the page. */
const AUDIT_ROW_LIMIT = 500;

export const metadata = {
  title: "Activity & Audit Log — Ownbase",
};

async function fetchCommitsWithTimeout(
  owner: string,
  name: string,
  token: string,
): Promise<FetchRecentCommitsResult> {
  const timeout = new Promise<FetchRecentCommitsResult>((resolve) => {
    setTimeout(
      () => resolve({ commits: [], error: "Commit request timed out." }),
      COMMIT_FETCH_TIMEOUT_MS,
    );
  });
  return Promise.race([
    fetchGithubRecentCommits(owner, name, token, {
      perPage: COMMITS_PER_REPO,
    }),
    timeout,
  ]);
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user) redirect("/login");

  const provider = (user.app_metadata?.provider as string) ?? "github";
  const providerToken =
    provider === "gitlab"
      ? (session?.provider_token ?? null)
      : await getGitHubAccessToken(supabase, user);

  const [{ data: trackedRows }, { data: auditRows }] = await Promise.all([
    supabase
      .from("tracked_repos")
      .select("full_name, repo_owner, repo_name, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select(
        "id, user_id, repo_owner, repo_name, full_name, action_type, details, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(AUDIT_ROW_LIMIT),
  ]);

  const tracked = trackedRows ?? [];
  const audit = (auditRows ?? []) as ActivityLogRow[];

  // Rank GitHub repos by their most recent Ownbase event, falling back to when
  // they were added. Avoids an extra API call per repo just to sort by activity.
  const lastEventByRepo = new Map<string, number>();
  for (const row of audit) {
    if (!row.full_name) continue;
    const t = new Date(row.created_at).getTime();
    if (Number.isNaN(t)) continue;
    const current = lastEventByRepo.get(row.full_name);
    if (current === undefined || t > current) {
      lastEventByRepo.set(row.full_name, t);
    }
  }

  const commitRepos = tracked
    .filter((r) => r.repo_owner !== "gitlab")
    .map((r) => {
      const [owner, ...rest] = r.full_name.split("/");
      return {
        fullName: r.full_name,
        owner,
        name: rest.join("/") || r.repo_name,
        rank:
          lastEventByRepo.get(r.full_name) ??
          new Date(r.added_at ?? 0).getTime(),
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, MAX_COMMIT_REPOS);

  const skippedRepoCount =
    tracked.filter((r) => r.repo_owner !== "gitlab").length - commitRepos.length;

  let commits: RecentCommit[] = [];
  const commitErrors: Array<{ fullName: string; error: string }> = [];

  if (providerToken && provider !== "gitlab" && commitRepos.length > 0) {
    const results = await Promise.allSettled(
      commitRepos.map(async (repo) => ({
        repo,
        result: await fetchCommitsWithTimeout(
          repo.owner,
          repo.name,
          providerToken,
        ),
      })),
    );

    for (const settled of results) {
      if (settled.status !== "fulfilled") continue;
      const { repo, result } = settled.value;
      commits = commits.concat(result.commits);
      if (result.error) {
        commitErrors.push({ fullName: repo.fullName, error: result.error });
      }
    }
  }

  const items = buildUnifiedTimeline({ auditRows: audit, commits });

  const repoOptions = [
    ...new Set([
      ...tracked.map((r) => r.full_name),
      ...items.flatMap((i) => (i.fullName ? [i.fullName] : [])),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-10 sm:space-y-12">
      <div>
        <Link
          href="/dashboard"
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          ← Back to dashboard
        </Link>
      </div>

      <ActivityPageClient
        items={items}
        repoOptions={repoOptions}
        auditCount={audit.length}
        auditLimit={AUDIT_ROW_LIMIT}
        commitRepoCount={commitRepos.length}
        skippedRepoCount={Math.max(0, skippedRepoCount)}
        commitErrors={commitErrors}
        hasProviderToken={Boolean(providerToken)}
        isGitlabWorkspace={provider === "gitlab"}
        trackedEmpty={tracked.length === 0}
      />
    </div>
  );
}
