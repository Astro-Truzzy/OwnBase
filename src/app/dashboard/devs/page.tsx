import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildPortfolioRiskSnapshot,
  normalizeSummary,
} from "../../../lib/dashboard/org-risk-assessment";
import {
  buildContributorCrosswalk,
  buildDeveloperOrgOverview,
} from "../../../lib/dashboard/devs-insights";
import { createClient } from "../../../lib/supabase/server";
import { fetchRepoCollaborators } from "../../../lib/github/fetch-collaborators";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import type { GitHubCollaborator } from "../../../lib/github/types";
import { DevsPageClient } from "./devs-page-client";

type RepoWithCollabs = {
  fullName: string;
  owner: string;
  name: string;
  collaborators: GitHubCollaborator[];
  error?: string;
};

export default async function DevsPage() {
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

  const [{ data: trackedRows }, { data: summaryRows }, { data: auditRows }] =
    await Promise.all([
      supabase
        .from("tracked_repos")
        .select("full_name, repo_owner, repo_name")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false }),
      supabase
        .from("repo_summaries")
        .select("full_name, summary_json")
        .eq("user_id", user.id),
      supabase
        .from("activity_log")
        .select("id, full_name, action_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(120),
    ]);

  const githubRepos = (trackedRows ?? []).filter(
    (r) => r.repo_owner !== "gitlab",
  );
  const gitlabRepos = (trackedRows ?? []).filter(
    (r) => r.repo_owner === "gitlab",
  );

  const reposWithCollabs: RepoWithCollabs[] =
    providerToken && githubRepos.length > 0
      ? await Promise.all(
          githubRepos.map(async (r) => {
            const [owner, ...nameParts] = r.full_name.split("/");
            const name = nameParts.join("/") || r.full_name;
            const { collaborators, error } = await fetchRepoCollaborators(
              owner,
              name,
              providerToken,
            );
            return { fullName: r.full_name, owner, name, collaborators, error };
          }),
        )
      : [];

  const summariesByRepo = new Map<
    string,
    NonNullable<ReturnType<typeof normalizeSummary>>
  >();
  for (const row of summaryRows ?? []) {
    const parsed = normalizeSummary(row.summary_json);
    if (parsed && row.full_name) summariesByRepo.set(row.full_name, parsed);
  }

  const collaboratorCounts = new Map<
    string,
    {
      count: number | null;
      error?: string;
      custodyAssessmentSkipped?: boolean;
    }
  >();

  for (const row of trackedRows ?? []) {
    if (row.repo_owner === "gitlab") {
      collaboratorCounts.set(row.full_name, {
        count: null,
        custodyAssessmentSkipped: true,
        error:
          "Verify member roster in GitLab — not fetched via Ownbase.",
      });
    }
  }

  for (const r of reposWithCollabs) {
    if (r.error && r.collaborators.length === 0) {
      collaboratorCounts.set(r.fullName, { count: null, error: r.error });
    } else {
      collaboratorCounts.set(r.fullName, {
        count: r.collaborators.length,
      });
    }
  }

  const snapshot = buildPortfolioRiskSnapshot({
    trackedFullNames: (trackedRows ?? []).map((r) => r.full_name),
    summariesByRepo,
    collaboratorCounts,
    recentAuditRows: auditRows ?? [],
  });

  const crosswalk = buildContributorCrosswalk(
    reposWithCollabs.map((r) => ({
      fullName: r.fullName,
      collaborators: r.collaborators,
    })),
  );

  const devOverview = buildDeveloperOrgOverview(
    reposWithCollabs.map((r) => ({
      fullName: r.fullName,
      collaborators: r.collaborators,
    })),
  );

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

      <DevsPageClient
        trackedEmpty={(trackedRows?.length ?? 0) === 0}
        snapshot={snapshot}
        crosswalk={crosswalk}
        devOverview={devOverview}
        gitlabRepos={gitlabRepos}
        hasProviderToken={Boolean(providerToken)}
        githubTrackedCount={githubRepos.length}
        reposWithCollabs={reposWithCollabs}
      />
    </div>
  );
}
