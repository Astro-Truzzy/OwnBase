"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import { requireTrackedRepo } from "@/lib/dashboard/require-tracked-repo";
import { verifyFeatureAccess } from "@/lib/subscription-access";
import type { OffboardingStepKey } from "@/lib/continuity/offboarding";

export interface ContinuityActionResult {
  success: boolean;
  error?: string;
}

const normalizeLogin = (login: string) => login.trim().replace(/^@/, "");

/** Days added when the owner extends a grant from the expiry queue. */
const EXTENSION_DAYS = 30;

/**
 * Records that the owner has reviewed access across the organization. This
 * resets the Continuity Score's access-review clock and leaves an audit entry —
 * it changes no permissions.
 */
export async function markAccessReviewedAction(
  note?: string | null,
): Promise<ContinuityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "continuity reviews",
  );
  if (!access.allowed) return { success: false, error: access.error };

  const { error } = await logActivity({
    userId: user.id,
    repoOwner: "",
    repoName: "",
    fullName: "organization",
    actionType: "access_review_completed",
    details: { note: note?.trim() || null, reviewed_by: user.email ?? null },
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/continuity");
  revalidatePath("/dashboard/activity");
  return { success: true };
}

/**
 * Pushes a grant's expiry out by EXTENSION_DAYS. Owner-native metadata only —
 * the provider permission is untouched, so no GitHub call is made.
 */
export async function extendAccessExpiryAction(
  fullName: string,
  login: string,
  days: number = EXTENSION_DAYS,
): Promise<ContinuityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "collaborator management",
  );
  if (!access.allowed) return { success: false, error: access.error };

  const tracked = await requireTrackedRepo(supabase, user.id, fullName);
  if (!tracked.ok) return { success: false, error: tracked.error };

  const cleanLogin = normalizeLogin(login);
  if (!cleanLogin) return { success: false, error: "Missing developer login." };

  const safeDays = Math.min(Math.max(Math.round(days), 1), 365);

  const { data: existing, error: readError } = await supabase
    .from("repo_access")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("full_name", fullName)
    .ilike("login", cleanLogin)
    .maybeSingle();

  if (readError) return { success: false, error: readError.message };
  if (!existing) {
    return { success: false, error: "No recorded grant found for that developer." };
  }

  // Extend from today when the grant already lapsed, else from its current date.
  const current = existing.expires_at ? new Date(existing.expires_at) : null;
  const base =
    current && !Number.isNaN(current.getTime()) && current.getTime() > Date.now()
      ? current
      : new Date();
  const next = new Date(base.getTime() + safeDays * 24 * 60 * 60 * 1000);

  const { error: updateError } = await supabase
    .from("repo_access")
    .update({ expires_at: next.toISOString(), updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .eq("user_id", user.id);

  if (updateError) return { success: false, error: updateError.message };

  const [owner, ...rest] = fullName.split("/");
  await logActivity({
    userId: user.id,
    repoOwner: owner ?? "",
    repoName: rest.join("/") || fullName,
    fullName,
    actionType: "access_expiry_extended",
    details: {
      full_name: fullName,
      login: cleanLogin,
      days: safeDays,
      expires_at: next.toISOString(),
    },
  });

  revalidatePath("/dashboard/continuity");
  revalidatePath("/dashboard/devs");
  return { success: true };
}

/** Opens (or returns the existing) offboarding run for a developer. */
export async function startOffboardingAction(input: {
  login: string;
  memberId?: string | null;
}): Promise<ContinuityActionResult & { runId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "offboarding workflows",
  );
  if (!access.allowed) return { success: false, error: access.error };

  const cleanLogin = normalizeLogin(input.login);
  if (!cleanLogin) return { success: false, error: "Missing developer login." };

  const { data: open, error: readError } = await supabase
    .from("offboarding_runs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .ilike("login", cleanLogin)
    .maybeSingle();

  if (readError) return { success: false, error: readError.message };
  if (open) {
    revalidatePath("/dashboard/continuity");
    return { success: true, runId: open.id };
  }

  const { data: created, error: insertError } = await supabase
    .from("offboarding_runs")
    .insert({
      user_id: user.id,
      member_id: input.memberId ?? null,
      login: cleanLogin,
      status: "in_progress",
      steps: {},
    })
    .select("id")
    .maybeSingle();

  if (insertError) return { success: false, error: insertError.message };

  revalidatePath("/dashboard/continuity");
  return { success: true, runId: created?.id };
}

/** Ticks or clears one checklist step on an open run. */
export async function setOffboardingStepAction(
  runId: string,
  step: OffboardingStepKey,
  done: boolean,
): Promise<ContinuityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { data: run, error: readError } = await supabase
    .from("offboarding_runs")
    .select("id, steps, status")
    .eq("id", runId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) return { success: false, error: readError.message };
  if (!run) return { success: false, error: "Offboarding run not found." };
  if (run.status !== "in_progress") {
    return { success: false, error: "This offboarding run is already closed." };
  }

  const steps = {
    ...((run.steps as Record<string, boolean> | null) ?? {}),
    [step]: done,
  };

  const { error: updateError } = await supabase
    .from("offboarding_runs")
    .update({ steps, updated_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("user_id", user.id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/dashboard/continuity");
  return { success: true };
}

/** Closes an offboarding run as completed and stamps the audit trail. */
export async function completeOffboardingAction(
  runId: string,
): Promise<ContinuityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const access = await verifyFeatureAccess(
    supabase,
    user.id,
    "offboarding workflows",
  );
  if (!access.allowed) return { success: false, error: access.error };

  const completedAt = new Date().toISOString();
  const { data: run, error } = await supabase
    .from("offboarding_runs")
    .update({ status: "completed", completed_at: completedAt, updated_at: completedAt })
    .eq("id", runId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .select("login, steps")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!run) {
    return { success: false, error: "Offboarding run not found or already closed." };
  }

  await logActivity({
    userId: user.id,
    repoOwner: "",
    repoName: "",
    fullName: run.login,
    actionType: "member_offboarded",
    details: {
      login: run.login,
      username: run.login,
      completed_at: completedAt,
      steps: run.steps ?? {},
    },
  });

  revalidatePath("/dashboard/continuity");
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/devs");
  return { success: true };
}

/** Abandons an offboarding run without offboarding the developer. */
export async function cancelOffboardingAction(
  runId: string,
): Promise<ContinuityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("offboarding_runs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/continuity");
  return { success: true };
}
