import { createServiceClient } from "@/lib/supabase/admin";

const TRIAL_MS = 30 * 24 * 60 * 60 * 1000;
/** Only auto-start trial for accounts created within this window (avoids legacy null-trial users). */
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Starts a 30-day trial for new accounts. Uses service role (billing columns are protected).
 * Skips users who already have trial_ends_at, subscription, or an older account.
 */
export async function ensureTrialForNewAccount(
  userId: string,
  userCreatedAt: string,
): Promise<void> {
  const createdMs = new Date(userCreatedAt).getTime();
  if (Number.isNaN(createdMs) || Date.now() - createdMs > NEW_ACCOUNT_WINDOW_MS) {
    return;
  }

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("trial_ends_at, subscription_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile || profile.trial_ends_at != null || profile.subscription_ends_at != null) {
    return;
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_MS).toISOString();
  await admin
    .from("profiles")
    .update({
      trial_ends_at: trialEndsAt,
      plan: "trial",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}
