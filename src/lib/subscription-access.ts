import type { SupabaseClient } from "@supabase/supabase-js";

export interface AccessStatus {
  hasActiveSubscription: boolean;
  onTrial: boolean;
  trialExpired: boolean;
  hasLegacyUnlimitedAccess: boolean;
  plan: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

export interface FeatureGateResult {
  allowed: boolean;
  error?: string;
  status: AccessStatus;
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeAccessStatus(profile: {
  plan?: string | null;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
}): AccessStatus {
  const now = new Date();
  const trialEndsAtDate = toDate(profile.trial_ends_at);
  const subscriptionEndsAtDate = toDate(profile.subscription_ends_at);
  const hasActiveSubscription =
    subscriptionEndsAtDate != null && subscriptionEndsAtDate > now;
  const onTrial = trialEndsAtDate != null && trialEndsAtDate > now;
  const hasLegacyUnlimitedAccess = trialEndsAtDate == null;
  const trialExpired =
    trialEndsAtDate != null && trialEndsAtDate <= now && !hasActiveSubscription;

  return {
    hasActiveSubscription,
    onTrial,
    trialExpired,
    hasLegacyUnlimitedAccess,
    plan: profile.plan ?? "trial",
    trialEndsAt: profile.trial_ends_at ?? null,
    subscriptionEndsAt: profile.subscription_ends_at ?? null,
  };
}

export async function verifyFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  featureLabel: string
): Promise<FeatureGateResult> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, subscription_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      allowed: false,
      error: "Could not verify subscription status. Please try again.",
      status: computeAccessStatus({}),
    };
  }

  const status = computeAccessStatus(profile ?? {});
  if (
    status.hasActiveSubscription ||
    status.onTrial ||
    status.hasLegacyUnlimitedAccess
  ) {
    return { allowed: true, status };
  }

  return {
    allowed: false,
    error: `Your free trial has ended. Subscribe to continue using ${featureLabel}.`,
    status,
  };
}
