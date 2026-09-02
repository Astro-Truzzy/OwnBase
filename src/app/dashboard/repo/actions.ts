"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";
import { fetchRelevantRepoContent } from "../../../lib/github/fetch-repo-content";
import { fetchRepoCollaborators } from "../../../lib/github/fetch-collaborators";
import { generateExecutiveSummary } from "../../../lib/ai/generate-summary";
import {
  addRepoCollaborator,
  removeRepoCollaborator,
  type GitHubCollaboratorPermission,
} from "../../../lib/github/manage-collaborators";
import { getAccessLevelLabel } from "../../../lib/github/types";
import { requireTrackedRepo } from "@/lib/dashboard/require-tracked-repo";
import { logActivity } from "../../../lib/activity-log";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import { countLiveAdmins } from "@/lib/access/access-matrix";
import {
  githubPermissionToLevel,
  levelToGithubPermission,
  type AccessLevel,
  type OrgRole,
} from "@/lib/access/levels";
import type { ExecutiveSummary } from "../../../lib/db/types";
import type { ActivityLogRow } from "../../../lib/db/types";
import {
  formatLimit,
  getEffectiveLimits,
} from "../../../lib/plan-limits";
import { verifyFeatureAccess } from "../../../lib/subscription-access";

/** Options for persisting Ownbase-native access metadata alongside a GitHub grant. */
export type AccessGrantOptions = {
  orgRole?: OrgRole;
  expiresAt?: string | null;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
  grantedBy?: string | null;
};

const normalizeLogin = (username: string) => username.trim().replace(/^@/, "");

/**
 * True if adding `login` to org_members would consume a new seat — i.e. no
 * row exists for them yet, or their only row is status "removed". Seats
 * include the owner, so the count query only looks at other roster rows.
 */
async function isNewSeat(
  supabase: SupabaseClient,
  userId: string,
  provider: string,
  login: string,
): Promise<boolean> {
  const { data: existingMember } = await supabase
    .from("org_members")
    .select("status")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("login", login)
    .maybeSingle();
  return !existingMember || existingMember.status === "removed";
}

/**
 * Enforces the plan's seat cap (owner + roster, including any active seats
 * add-on) before a new member is added. Mirrors the tracked-repo cap check
 * below: blocks new adds once at/over the limit, never removes anyone
 * already over it.
 */
async function checkSeatCap(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { plan, limits } = await getEffectiveLimits(supabase, userId);
  const { count, error } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "removed");

  if (error) {
    return "Could not verify seat limits. Please try again.";
  }

  const seatsUsed = 1 + (count ?? 0); // +1 for the owner
  if (seatsUsed >= limits.maxSeats) {
    return `You've reached your seat limit (${limits.maxSeats}) for the ${plan} plan. Upgrade to add more team members.`;
  }
  return null;
}

/**
 * Best-effort persistence of the owner-native access model (org_members +
 * repo_access) after a successful GitHub mutation. GitHub remains the source of
 * truth, so a DB failure here never fails the action — the matrix simply falls
 * back to the live-GitHub view.
 */
async function persistAccessGrant(
  supabase: SupabaseClient,
  userId: string,
  params: {
    fullName: string;
    login: string;
    level: AccessLevel;
    orgRole?: OrgRole;
    expiresAt?: string | null;
    grantedBy?: string | null;
    email?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    htmlUrl?: string | null;
  },
): Promise<void> {
  const login = normalizeLogin(params.login);
  if (!login) return;
  try {
    const { data: member } = await supabase
      .from("org_members")
      .upsert(
        {
          user_id: userId,
          provider: "github",
          login,
          status: "active",
          ...(params.orgRole ? { org_role: params.orgRole } : {}),
          ...(params.email ? { email: params.email } : {}),
          ...(params.displayName ? { display_name: params.displayName } : {}),
          ...(params.avatarUrl ? { avatar_url: params.avatarUrl } : {}),
          ...(params.htmlUrl ? { html_url: params.htmlUrl } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider,login" },
      )
      .select("id")
      .maybeSingle();

    await supabase.from("repo_access").upsert(
      {
        user_id: userId,
        member_id: member?.id ?? null,
        full_name: params.fullName,
        provider: "github",
        login,
        access_level: params.level,
        granted_by: params.grantedBy ?? null,
        expires_at: params.expiresAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,full_name,login" },
    );
  } catch (error) {
    console.error("persistAccessGrant failed", error);
  }
}

/**
 * Guards against stranding a repo with no admin. Returns an error string if the
 * change would remove/downgrade the final live admin, else null. If live
 * collaborators can't be fetched we skip the guard (GitHub still enforces its own).
 */
async function checkLastAdminGuard(
  owner: string,
  repo: string,
  login: string,
  nextLevel: AccessLevel,
  providerToken: string,
): Promise<string | null> {
  if (nextLevel === "admin") return null;
  const { collaborators, error } = await fetchRepoCollaborators(
    owner,
    repo,
    providerToken,
  );
  if (error) return null;
  const normalized = normalizeLogin(login).toLowerCase();
  const target = collaborators.find(
    (c) => c.login.toLowerCase() === normalized,
  );
  const targetIsAdmin = target
    ? getAccessLevelLabel(target) === "Full access"
    : false;
  if (targetIsAdmin && countLiveAdmins(collaborators) <= 1) {
    return "You can’t remove the last admin of this repository. Assign another admin first.";
  }
  return null;
}

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

  const { plan, limits } = await getEffectiveLimits(supabase, user.id);
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

  // Best-effort: history is an append-only log for the diff view, never the
  // source of truth for "the current summary" — a failed insert here must not
  // fail the generate action, since repo_summaries above already succeeded.
  await supabase.from("repo_summary_history").insert({
    user_id: user.id,
    repo_id: repoId,
    full_name: fullName,
    summary_json: summary,
  });

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

export interface SummaryHistoryEntry {
  id: string;
  createdAt: string;
  summary: ExecutiveSummary;
}

/**
 * Past AI summaries for a repository, newest first, for the history/diff view.
 * Read-only — history rows are written only by `generateRepoSummary`.
 */
export async function getRepoSummaryHistory(
  fullName: string,
  limit = 20
): Promise<{ data: SummaryHistoryEntry[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "You must be signed in." };

  const { data, error } = await supabase
    .from("repo_summary_history")
    .select("id, summary_json, created_at")
    .eq("user_id", user.id)
    .eq("full_name", fullName)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // 42P01 = undefined_table: the repo_summary_history migration hasn't been
    // applied yet. Reads as "no history yet" rather than a DB error, matching
    // how the access matrix degrades before its own migration is applied.
    if (error.code === "42P01") return { data: [] };
    return { data: [], error: error.message };
  }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      createdAt: row.created_at as string,
      summary: row.summary_json as ExecutiveSummary,
    })),
  };
}

export interface ManageAccessResult {
  success: boolean;
  error?: string;
}

/**
 * Grant access to a GitHub user on the repo. No redirect to GitHub; all in-app.
 * Also records the grant in the owner-native access model (best-effort).
 */
export async function addCollaboratorAction(
  owner: string,
  repo: string,
  username: string,
  permission: GitHubCollaboratorPermission,
  options?: AccessGrantOptions
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

  const normalizedLogin = normalizeLogin(username);
  if (await isNewSeat(supabase, user.id, "github", normalizedLogin)) {
    const seatError = await checkSeatCap(supabase, user.id);
    if (seatError) {
      return { success: false, error: seatError };
    }
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
    await persistAccessGrant(supabase, user.id, {
      fullName,
      login: username,
      level: githubPermissionToLevel(permission),
      orgRole: options?.orgRole,
      expiresAt: options?.expiresAt ?? null,
      grantedBy: options?.grantedBy ?? user.email ?? null,
      email: options?.email,
      displayName: options?.displayName,
      avatarUrl: options?.avatarUrl,
      htmlUrl: options?.htmlUrl,
    });
    await logActivity({
      userId: user.id,
      repoOwner: owner,
      repoName: repo,
      fullName,
      actionType: "collaborator_added",
      details: { username: normalizeLogin(username), permission },
    });
    revalidatePath(`/dashboard/repo/${owner}/${repo}`);
    revalidatePath("/dashboard/devs");
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

  const guardError = await checkLastAdminGuard(
    owner,
    repo,
    username,
    "none",
    providerToken
  );
  if (guardError) {
    return { success: false, error: guardError };
  }

  const result = await removeRepoCollaborator(
    owner,
    repo,
    username,
    providerToken
  );

  if (result.success) {
    await supabase
      .from("repo_access")
      .delete()
      .eq("user_id", user.id)
      .eq("full_name", fullName)
      .ilike("login", normalizeLogin(username));
    await logActivity({
      userId: user.id,
      repoOwner: owner,
      repoName: repo,
      fullName,
      actionType: "collaborator_removed",
      details: { username: normalizeLogin(username) },
    });
    revalidatePath(`/dashboard/repo/${owner}/${repo}`);
    revalidatePath("/dashboard/devs");
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
    const { plan, limits } = await getEffectiveLimits(supabase, user.id);
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

/**
 * Set a collaborator's access level on a repo in one step (the matrix's inline
 * re-level). Maps the 4-level model to a GitHub permission, applies the
 * last-admin guard, updates GitHub, and records the change in the native model.
 * Level "none" removes the collaborator.
 */
export async function setAccessLevelAction(
  owner: string,
  repo: string,
  login: string,
  level: AccessLevel,
  options?: AccessGrantOptions
): Promise<ManageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user) return { success: false, error: "You must be signed in." };

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "collaborator management"
  );
  if (!access.allowed) return { success: false, error: access.error };

  const fullName = `${owner}/${repo}`;
  const tracked = await requireTrackedRepo(supabase, user.id, fullName);
  if (!tracked.ok) return { success: false, error: tracked.error };

  const githubToken = await getGitHubAccessToken(supabase, user);
  const providerToken = session?.provider_token ?? githubToken;
  if (!providerToken) {
    return {
      success: false,
      error: "GitHub is not connected. Sign in again with GitHub.",
    };
  }

  const cleanLogin = normalizeLogin(login);
  if (!cleanLogin) return { success: false, error: "Enter a GitHub username." };

  const guardError = await checkLastAdminGuard(
    owner,
    repo,
    cleanLogin,
    level,
    providerToken
  );
  if (guardError) return { success: false, error: guardError };

  // Level "none" = revoke access entirely.
  if (level === "none") {
    const removal = await removeRepoCollaborator(
      owner,
      repo,
      cleanLogin,
      providerToken
    );
    if (!removal.success) return removal;
    await supabase
      .from("repo_access")
      .delete()
      .eq("user_id", user.id)
      .eq("full_name", fullName)
      .ilike("login", cleanLogin);
    await logActivity({
      userId: user.id,
      repoOwner: owner,
      repoName: repo,
      fullName,
      actionType: "collaborator_removed",
      details: { username: cleanLogin, via: "matrix" },
    });
    revalidatePath(`/dashboard/repo/${owner}/${repo}`);
    revalidatePath("/dashboard/devs");
    return { success: true };
  }

  const permission = levelToGithubPermission(level);
  if (!permission) return { success: false, error: "Invalid access level." };

  const result = await addRepoCollaborator(
    owner,
    repo,
    cleanLogin,
    permission,
    providerToken
  );
  if (!result.success) return result;

  await persistAccessGrant(supabase, user.id, {
    fullName,
    login: cleanLogin,
    level,
    orgRole: options?.orgRole,
    expiresAt: options?.expiresAt ?? null,
    grantedBy: options?.grantedBy ?? user.email ?? null,
    email: options?.email,
    displayName: options?.displayName,
    avatarUrl: options?.avatarUrl,
    htmlUrl: options?.htmlUrl,
  });
  await logActivity({
    userId: user.id,
    repoOwner: owner,
    repoName: repo,
    fullName,
    actionType: "collaborator_access_changed",
    details: { username: cleanLogin, level, permission },
  });
  revalidatePath(`/dashboard/repo/${owner}/${repo}`);
  revalidatePath("/dashboard/devs");
  return { success: true };
}

/**
 * Update an owner-managed member's org-level role. Owner record only — no
 * provider API call, no auth change.
 */
export async function setMemberRoleAction(
  memberId: string,
  role: OrgRole
): Promise<ManageAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { data: member, error } = await supabase
    .from("org_members")
    .update({ org_role: role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("user_id", user.id)
    .select("login, display_name")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!member) return { success: false, error: "Member not found." };

  await logActivity({
    userId: user.id,
    repoOwner: "",
    repoName: "",
    fullName: member.login || member.display_name || "member",
    actionType: "member_role_changed",
    details: { memberId, role, login: member.login },
  });
  revalidatePath("/dashboard/devs");
  return { success: true };
}

/**
 * Create or update an owner-managed member record (no provider call). Used for
 * org-level roster management — adding a member or editing role/notes/profile.
 */
export async function upsertMemberAction(input: {
  login?: string | null;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
  orgRole?: OrgRole;
  status?: "invited" | "active" | "removed";
  notes?: string | null;
  provider?: "github" | "gitlab" | "manual";
}): Promise<ManageAccessResult & { memberId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const login = input.login ? normalizeLogin(input.login) : null;
  const provider = input.provider ?? "github";

  if (!login && !input.email && !input.displayName) {
    return {
      success: false,
      error: "Provide a username, email, or name for the member.",
    };
  }

  if (login && (await isNewSeat(supabase, user.id, provider, login))) {
    const seatError = await checkSeatCap(supabase, user.id);
    if (seatError) {
      return { success: false, error: seatError };
    }
  }

  const { data: member, error } = await supabase
    .from("org_members")
    .upsert(
      {
        user_id: user.id,
        provider,
        login,
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.displayName !== undefined
          ? { display_name: input.displayName }
          : {}),
        ...(input.avatarUrl !== undefined
          ? { avatar_url: input.avatarUrl }
          : {}),
        ...(input.htmlUrl !== undefined ? { html_url: input.htmlUrl } : {}),
        ...(input.orgRole ? { org_role: input.orgRole } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider,login" }
    )
    .select("id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/devs");
  return { success: true, memberId: member?.id };
}
