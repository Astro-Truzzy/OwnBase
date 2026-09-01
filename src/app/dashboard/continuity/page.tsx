import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchRepoCollaborators } from "@/lib/github/fetch-collaborators";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import type { GitHubCollaborator } from "@/lib/github/types";
import {
  buildAccessMatrix,
  type OrgMemberRow,
  type RepoAccessRow,
} from "@/lib/access/access-matrix";
import {
  buildContinuityScore,
  type ContinuityAccessEventInput,
  type ContinuityRepoInput,
} from "@/lib/continuity/continuity-score";
import {
  buildExpiringAccessQueue,
  type OffboardingRunRow,
} from "@/lib/continuity/offboarding";
import { ContinuityPageClient } from "./continuity-page-client";

type RepoWithCollabs = {
  fullName: string;
  owner: string;
  name: string;
  collaborators: GitHubCollaborator[];
  error?: string;
};

export const metadata = {
  title: "Continuity & Offboarding — Ownbase",
};

export default async function ContinuityPage() {
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
    { data: runRows },
  ] = await Promise.all([
    supabase
      .from("tracked_repos")
      .select("full_name, repo_owner, repo_name")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("repo_summaries")
      .select("full_name, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("activity_log")
      .select("action_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    // org_members / repo_access / offboarding_runs may not exist until their
    // migrations are applied; Supabase returns { data: null, error } without
    // throwing, so every view below degrades safely.
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
    supabase
      .from("offboarding_runs")
      .select(
        "id, member_id, login, status, steps, started_at, completed_at, notes",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(100),
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

  // ── Access matrix (same reconciliation the Team & Access screen uses) ───────
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

  const now = Date.now();

  const accessMatrix = buildAccessMatrix({
    trackedRepos: [...githubMatrixRepos, ...gitlabMatrixRepos],
    liveCollaboratorsByRepo: reposWithCollabs.map((r) => ({
      fullName: r.fullName,
      collaborators: r.collaborators,
    })),
    members: (memberRows ?? []) as OrgMemberRow[],
    repoAccessRows: (accessRows ?? []) as RepoAccessRow[],
    now,
  });

  // ── Continuity score inputs ────────────────────────────────────────────────
  const summaryUpdatedByRepo = new Map<string, string>();
  for (const row of summaryRows ?? []) {
    if (row.full_name && row.updated_at) {
      summaryUpdatedByRepo.set(row.full_name, row.updated_at);
    }
  }

  const continuityRepos: ContinuityRepoInput[] = [
    ...githubRepos.map((r) => {
      const live = reposWithCollabs.find((x) => x.fullName === r.full_name);
      const unresolved = Boolean(
        live?.error && (live?.collaborators.length ?? 0) === 0,
      );
      return {
        fullName: r.full_name,
        // Unknown when live data could not be fetched — excluded from SPOF
        // rather than counted as a single-maintainer repo.
        collaboratorCount: unresolved
          ? null
          : (live?.collaborators.length ?? null),
        custodyAssessmentSkipped: false,
        summaryUpdatedAt: summaryUpdatedByRepo.get(r.full_name) ?? null,
      };
    }),
    ...gitlabRepos.map((r) => ({
      fullName: r.full_name,
      collaboratorCount: null,
      // Members live on GitLab; custody cannot be sized here.
      custodyAssessmentSkipped: true,
      summaryUpdatedAt: summaryUpdatedByRepo.get(r.full_name) ?? null,
    })),
  ];

  const accessEvents: ContinuityAccessEventInput[] = (auditRows ?? []).map(
    (row) => ({ actionType: row.action_type, createdAt: row.created_at }),
  );

  const continuity = buildContinuityScore({
    repos: continuityRepos,
    accessRows: (accessRows ?? []).map((r) => ({
      fullName: r.full_name,
      login: r.login,
      accessLevel: r.access_level,
      expiresAt: r.expires_at,
    })),
    accessEvents,
    now,
  });

  const expiringQueue = buildExpiringAccessQueue({ matrix: accessMatrix, now });

  const runs = (runRows ?? []) as OffboardingRunRow[];

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

      <ContinuityPageClient
        continuity={continuity}
        matrix={accessMatrix}
        expiringQueue={expiringQueue}
        runs={runs}
        trackedEmpty={(trackedRows?.length ?? 0) === 0}
        hasProviderToken={Boolean(providerToken)}
        githubTrackedCount={githubRepos.length}
        now={now}
      />
    </div>
  );
}
