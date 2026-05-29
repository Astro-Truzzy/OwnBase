"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";
import { fetchRelevantRepoContent } from "../../../lib/github/fetch-repo-content";
import { generateExecutiveSummary } from "../../../lib/ai/generate-summary";
import {
  addRepoCollaborator,
  removeRepoCollaborator,
  type GitHubCollaboratorPermission,
} from "../../../lib/github/manage-collaborators";
import { requireTrackedRepo } from "@/lib/dashboard/require-tracked-repo";
import { logActivity } from "../../../lib/activity-log";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import type { ExecutiveSummary } from "../../../lib/db/types";
import type { ActivityLogRow } from "../../../lib/db/types";
import {
  formatLimit,
  getLimitsForPlan,
  getUserPlanTier,
} from "../../../lib/plan-limits";
import { verifyFeatureAccess } from "../../../lib/subscription-access";

export interface GenerateSummaryResult {
  success: boolean;
  summary?: ExecutiveSummary;
  error?: string;
}

/**
 * Generates an AI executive summary for a repository and stores it in Supabase.
 * Uses the current user's GitHub token and only analyzes relevant files (README, manifests, root).
 */
export async function generateRepoSummary(
  repoId: number,
  fullName: string
): Promise<GenerateSummaryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "AI executive summaries"
  );
  if (!access.allowed) {
    return { success: false, error: access.error };
  }

  const providerToken = await getGitHubAccessToken(supabase, user);
  if (!providerToken) {
    return {
      success: false,
      error: "GitHub access required. Sign in again with GitHub to link your account.",
    };
  }

  const plan = await getUserPlanTier(supabase, user.id);
  const limits = getLimitsForPlan(plan);
  const now = new Date();
  const monthStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  ).toISOString();
  const { count: summaryCount, error: countError } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("action_type", "summary_generated")
    .gte("created_at", monthStartIso);

  if (countError) {
    return {
      success: false,
      error: "Could not verify your monthly summary limit. Please try again.",
    };
  }

  if ((summaryCount ?? 0) >= limits.maxAiSummariesPerMonth) {
    return {
      success: false,
      error: `You have reached your monthly AI summary limit (${limits.maxAiSummariesPerMonth}) for the ${plan} plan. Upgrade to continue.`,
    };
  }

  const { files, rootListing, error: fetchError } = await fetchRelevantRepoContent(
    fullName,
    providerToken
  );

  if (fetchError) {
    return { success: false, error: fetchError };
  }

  if (files.length === 0 && rootListing.length === 0) {
    return {
      success: false,
      error: "No readable content found in this repository (empty or no access).",
    };
  }

  const { summary, error: aiError } = await generateExecutiveSummary({
    fullName,
    files,
    rootListing,
  });

  if (aiError) {
    return {
      success: false,
      error: aiError,
      summary, // still return fallback summary for display if any
    };
  }

  const { error: dbError } = await supabase.from("repo_summaries").upsert(
    {
      user_id: user.id,
      repo_id: repoId,
      full_name: fullName,
      summary_json: summary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,repo_id" }
  );

  if (dbError) {
    return {
      success: false,
      error: "Failed to save summary: " + dbError.message,
      summary,
    };
  }

  await logActivity({
    userId: user.id,
    repoOwner: fullName.split("/")[0] ?? "",
    repoName: fullName.split("/").slice(1).join("/") || fullName,
    fullName,
    actionType: "summary_generated",
    details: { repo_id: repoId, plan },
  });

  return { success: true, summary };
}

export interface ManageAccessResult {
  success: boolean;
  error?: string;
}

/**
 * Grant access to a GitHub user on the repo. No redirect to GitHub; all in-app.
 */
export async function addCollaboratorAction(
  owner: string,
  repo: string,
  username: string,
  permission: GitHubCollaboratorPermission
): Promise<ManageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "collaborator management"
  );
  if (!access.allowed) {
    return { success: false, error: access.error };
  }

  const fullName = `${owner}/${repo}`;
  const tracked = await requireTrackedRepo(supabase, user.id, fullName);
  if (!tracked.ok) {
    return { success: false, error: tracked.error };
  }

  const githubToken = await getGitHubAccessToken(supabase, user);
  const providerToken = session?.provider_token ?? githubToken;
  if (!providerToken) {
    return {
      success: false,
      error: "GitHub is not connected. Sign in again with GitHub.",
    };
  }

  const result = await addRepoCollaborator(
    owner,
    repo,
    username,
    permission,
    providerToken
  );

  if (result.success) {
    await logActivity({
      userId: user.id,
      repoOwner: owner,
      repoName: repo,
      fullName: `${owner}/${repo}`,
      actionType: "collaborator_added",
      details: { username, permission },
    });
    revalidatePath(`/dashboard/repo/${owner}/${repo}`);
  }
  return result;
}

/**
 * Revoke a user's access to the repo. No redirect to GitHub; all in-app.
 */
export async function removeCollaboratorAction(
  owner: string,
  repo: string,
  username: string
): Promise<ManageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "collaborator management"
  );
  if (!access.allowed) {
    return { success: false, error: access.error };
  }

  const fullName = `${owner}/${repo}`;
  const tracked = await requireTrackedRepo(supabase, user.id, fullName);
  if (!tracked.ok) {
    return { success: false, error: tracked.error };
  }

  const githubToken = await getGitHubAccessToken(supabase, user);
  const providerToken = session?.provider_token ?? githubToken;
  if (!providerToken) {
    return {
      success: false,
      error: "GitHub is not connected. Sign in again with GitHub.",
    };
  }

  const result = await removeRepoCollaborator(
    owner,
    repo,
    username,
    providerToken
  );

  if (result.success) {
    await logActivity({
      userId: user.id,
      repoOwner: owner,
      repoName: repo,
      fullName: `${owner}/${repo}`,
      actionType: "collaborator_removed",
      details: { username },
    });
    revalidatePath(`/dashboard/repo/${owner}/${repo}`);
  }
  return result;
}

/** Add repo to user's organization (tracked repos). */
export async function addTrackedRepoAction(
  owner: string,
  name: string
): Promise<ManageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "You must be signed in." };

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "repository tracking"
  );
  if (!access.allowed) {
    return { success: false, error: access.error };
  }

  const fullName = `${owner}/${name}`;
  const { data: existing } = await supabase
    .from("tracked_repos")
    .select("id")
    .eq("user_id", user.id)
    .eq("full_name", fullName)
    .maybeSingle();

  if (!existing) {
    const plan = await getUserPlanTier(supabase, user.id);
    const limits = getLimitsForPlan(plan);
    const { count: trackedCount, error: trackedCountError } = await supabase
      .from("tracked_repos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (trackedCountError) {
      return {
        success: false,
        error: "Could not verify repository limits. Please try again.",
      };
    }

    if ((trackedCount ?? 0) >= limits.maxTrackedRepos) {
      return {
        success: false,
        error: `You have reached your repository limit (${formatLimit(limits.maxTrackedRepos)}) for the ${plan} plan. Upgrade to add more repositories.`,
      };
    }
  } else {
    return { success: true };
  }

  const { error } = await supabase.from("tracked_repos").upsert(
    {
      user_id: user.id,
      repo_owner: owner,
      repo_name: name,
      full_name: fullName,
    },
    { onConflict: "user_id,full_name" }
  );

  if (error) return { success: false, error: error.message };

  await logActivity({
    userId: user.id,
    repoOwner: owner,
    repoName: name,
    fullName,
    actionType: "repo_tracked",
  });
  revalidatePath(`/dashboard/repo/${owner}/${name}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/organization");
  return { success: true };
}

/** Remove repo from user's organization. */
export async function removeTrackedRepoAction(
  owner: string,
  name: string
): Promise<ManageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "You must be signed in." };

  const fullName = `${owner}/${name}`;
  const { error } = await supabase
    .from("tracked_repos")
    .delete()
    .eq("user_id", user.id)
    .eq("full_name", fullName);

  if (error) return { success: false, error: error.message };

  await logActivity({
    userId: user.id,
    repoOwner: owner,
    repoName: name,
    fullName,
    actionType: "repo_untracked",
  });
  revalidatePath(`/dashboard/repo/${owner}/${name}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/organization");
  return { success: true };
}

/** Get activity log for a repo or for the user (dashboard). */
export async function getActivityLogAction(
  repoOwner?: string,
  repoName?: string
): Promise<{ data: ActivityLogRow[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], error: "You must be signed in." };

  let q = supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (repoOwner != null && repoName != null) {
    q = q.eq("repo_owner", repoOwner).eq("repo_name", repoName);
  }

  const { data, error } = await q;

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as ActivityLogRow[] };
}
