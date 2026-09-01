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
import {
  buildAccessMatrix,
  type OrgMemberRow,
  type RepoAccessRow,
} from "@/lib/access/access-matrix";
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

  const [
    { data: trackedRows },
    { data: summaryRows },
    { data: auditRows },
    { data: memberRows },
    { data: accessRows },
  ] = await Promise.all([
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
    // org_members / repo_access may not exist until the migration is applied;
    // Supabase returns { data: null, error } (no throw), so the matrix simply
    // degrades to the live-GitHub view below. Safe by construction.
    supabase
      .from("org_members")
      .select(
        "id, provider, login, email, display_name, avatar_url, html_url, org_role, status, notes",
      )
      .eq("user_id", user.id),
    supabase
      .from("repo_access")
      .select(
        "id, member_id, full_name, provider, login, access_level, granted_by, granted_at, expires_at",
      )
      .eq("user_id", user.id),
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

  // People × repos access matrix: live GitHub collaborators reconciled with the
  // owner-native access model. GitHub repos are editable columns; GitLab repos
  // are advisory (managed on GitLab), rendered read-only.
  const githubMatrixRepos = githubRepos.map((r) => {
    const live = reposWithCollabs.find((x) => x.fullName === r.full_name);
    const unavailable = Boolean(
      live?.error && (live?.collaborators.length ?? 0) === 0,
    );
    return {
      fullName: r.full_name,
      owner: r.repo_owner,
      name: r.repo_name,
      provider: "github" as const,
      unavailable,
      error: live?.error,
    };
  });
  const gitlabMatrixRepos = gitlabRepos.map((r) => ({
    fullName: r.full_name,
    owner: "gitlab",
    name: r.full_name.replace(/^gitlab\//, ""),
    provider: "gitlab" as const,
    unavailable: true,
    error: "Members are managed on GitLab.",
  }));

  const accessMatrix = buildAccessMatrix({
    trackedRepos: [...githubMatrixRepos, ...gitlabMatrixRepos],
    liveCollaboratorsByRepo: reposWithCollabs.map((r) => ({
      fullName: r.fullName,
      collaborators: r.collaborators,
    })),
    members: (memberRows ?? []) as OrgMemberRow[],
    repoAccessRows: (accessRows ?? []) as RepoAccessRow[],
    now: Date.now(),
  });

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
        accessMatrix={accessMatrix}
      />
    </div>
  );
}
