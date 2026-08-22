import { redirect } from "next/navigation";
import { fetchRepoCollaborators } from "../../../lib/github/fetch-collaborators";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import {
  buildPortfolioRiskSnapshot,
  normalizeSummary,
} from "../../../lib/dashboard/org-risk-assessment";
import { fetchSearchableReposForUser } from "@/lib/dashboard/searchable-repos";
import { getUsageSnapshot } from "@/lib/usage-stats";
import { createClient } from "../../../lib/supabase/server";
import { isReportDeliveryPreferencesTableMissing } from "../../../lib/report-delivery-preferences-schema";
import { OrganizationHashScroll } from "./organization-hash-scroll";
import { OrganizationPageClient } from "./organization-page-client";
import type { ReportScheduleInitial } from "./organization-report-types";
import type { OrganizationTrackedRepo } from "../dashboard-organization-panel";

const MAX_GITHUB_COLLAB_FETCH = 22;
const COLLAB_FETCH_TIMEOUT_MS = 2500;

async function fetchRepoCollaboratorsWithTimeout(
  owner: string,
  name: string,
  providerToken: string,
): Promise<Awaited<ReturnType<typeof fetchRepoCollaborators>>> {
  const timeoutPromise = new Promise<
    Awaited<ReturnType<typeof fetchRepoCollaborators>>
  >((resolve) => {
    setTimeout(
      () =>
        resolve({
          collaborators: [],
          error: "Collaborator request timed out",
        }),
      COLLAB_FETCH_TIMEOUT_MS,
    );
  });

  return Promise.race([
    fetchRepoCollaborators(owner, name, providerToken),
    timeoutPromise,
  ]);
}

export default async function OrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const provider = (user?.app_metadata?.provider as string) ?? "github";
  const providerToken =
    provider === "gitlab"
      ? (session?.provider_token ?? null)
      : await getGitHubAccessToken(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const businessName = profile?.business_name?.trim() ?? null;

  const [{ data: trackedRepos }, { data: summaryRows }, { data: auditRows }] =
    await Promise.all([
      supabase
        .from("tracked_repos")
        .select("full_name, repo_owner, repo_name, added_at")
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

  const tracked = trackedRepos ?? [];

  function repoDetailHref(fullName: string): string {
    const [owner, ...rest] = fullName.split("/");
    const name = rest.join("/") || fullName;
    return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  }

  const hasGitHubIdentity =
    user.identities?.some((identity) => identity.provider === "github") ??
    false;
  const hasGitLabIdentity =
    user.identities?.some((identity) => identity.provider === "gitlab") ??
    false;
  const hasGitProvider =
    Boolean(providerToken) || hasGitHubIdentity || hasGitLabIdentity;

  const [discoverableRepos, usage] = await Promise.all([
    fetchSearchableReposForUser({ provider, providerToken }),
    getUsageSnapshot(supabase, user.id),
  ]);

  const organizationTracked: OrganizationTrackedRepo[] = tracked.map((row) => {
    const isGitlab = row.repo_owner === "gitlab";
    const fullName = row.full_name;
    return {
      fullName,
      name: row.repo_name,
      detailHref: repoDetailHref(fullName),
      tech: isGitlab ? "GitLab" : "GitHub",
      addedAt: row.added_at,
    };
  });

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

  const trackedGithubLimited = tracked
    .filter((row) => row.repo_owner !== "gitlab")
    .slice(0, MAX_GITHUB_COLLAB_FETCH);

  for (const row of tracked) {
    if (row.repo_owner === "gitlab") {
      collaboratorCounts.set(row.full_name, {
        count: null,
        custodyAssessmentSkipped: true,
        error: "Verify member roster in GitLab — not fetched via Ownbase.",
      });
    }
  }

  if (provider !== "gitlab" && providerToken) {
    await Promise.allSettled(
      trackedGithubLimited.map(async (row) => {
        const owner = row.repo_owner;
        const name = row.repo_name;
        const { collaborators, error } = await fetchRepoCollaboratorsWithTimeout(
          owner,
          name,
          providerToken,
        );
        if (error && collaborators.length === 0) {
          collaboratorCounts.set(row.full_name, {
            count: null,
            error,
          });
        } else {
          collaboratorCounts.set(row.full_name, {
            count: collaborators.length,
          });
        }
      }),
    );
  }

  const snapshot = buildPortfolioRiskSnapshot({
    trackedFullNames: tracked.map((r) => r.full_name),
    summariesByRepo,
    collaboratorCounts,
    recentAuditRows: auditRows ?? [],
  });

  const githubTrackedForCustody = tracked.filter(
    (r) => r.repo_owner !== "gitlab",
  ).length;

  const custodyFetchNote =
    provider !== "gitlab" &&
    providerToken &&
    githubTrackedForCustody > MAX_GITHUB_COLLAB_FETCH
      ? `Collaborator counts load from GitHub for the ${MAX_GITHUB_COLLAB_FETCH} most recently added repositories. Add summaries for full diligence on every repo.`
      : null;

  const { data: reportPrefRow, error: reportPrefError } = await supabase
    .from("report_delivery_preferences")
    .select("enabled, cadence, destination_email, last_sent_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    reportPrefError &&
    !isReportDeliveryPreferencesTableMissing(reportPrefError)
  ) {
    console.error("report_delivery_preferences", reportPrefError.message);
  }

  const reportScheduleInitial: ReportScheduleInitial = reportPrefRow
    ? {
        enabled: Boolean(reportPrefRow.enabled),
        cadence:
          reportPrefRow.cadence === "monthly" ? "monthly" : "weekly",
        destination_email: String(reportPrefRow.destination_email ?? ""),
        last_sent_at: reportPrefRow.last_sent_at ?? null,
      }
    : {
        enabled: false,
        cadence: "weekly",
        destination_email: user.email ?? "",
        last_sent_at: null,
      };

  return (
    <>
      <OrganizationHashScroll />
      <OrganizationPageClient
        snapshot={snapshot}
        custodyFetchNote={custodyFetchNote}
        tracked={tracked}
        discoverableRepos={discoverableRepos}
        organizationTracked={organizationTracked}
        trackedLimit={usage.limits.maxTrackedRepos ?? 5}
        hasGitProvider={hasGitProvider}
        businessName={businessName}
        viewerEmail={user.email ?? null}
        reportScheduleInitial={reportScheduleInitial}
      />
    </>
  );
}
