import type { SupabaseClient } from "@supabase/supabase-js";
import { formatNgn, TIER_MONTHLY_PRICE_NGN } from "./pricing-tiers";
import { computeAccessStatus } from "./subscription-access";

export type PlanTier = "free" | "trial" | "starter" | "pro" | "agency";

export interface PlanLimits {
  maxTrackedRepos: number;
  /** null means unlimited */
  maxUploads: number | null;
  maxAiSummariesPerMonth: number;
  /** Total seats including the owner (matches the "Up to N seats" pricing copy). */
  maxSeats: number;
}

const STARTER_LIMITS: PlanLimits = {
  maxTrackedRepos: 5,
  maxUploads: 1,
  maxAiSummariesPerMonth: Number(process.env.STARTER_AI_SUMMARIES_PER_MONTH ?? 20),
  maxSeats: 3,
};

const PRO_LIMITS: PlanLimits = {
  maxTrackedRepos: 25,
  maxUploads: null,
  maxAiSummariesPerMonth: Number(process.env.PRO_AI_SUMMARIES_PER_MONTH ?? 200),
  maxSeats: 10,
};

const AGENCY_LIMITS: PlanLimits = {
  maxTrackedRepos: 60,
  maxUploads: null,
  maxAiSummariesPerMonth: Number(process.env.AGENCY_AI_SUMMARIES_PER_MONTH ?? 500),
  maxSeats: 25,
};

const TRIAL_LIMITS: PlanLimits = { ...PRO_LIMITS };

/** Permanent tier for accounts with no active trial or subscription. */
const FREE_LIMITS: PlanLimits = {
  maxTrackedRepos: 1,
  maxUploads: 0,
  maxAiSummariesPerMonth: 1,
  maxSeats: 1,
};

export function normalizePlan(plan: string | null | undefined): PlanTier {
  if (
    plan === "free" ||
    plan === "starter" ||
    plan === "pro" ||
    plan === "agency" ||
    plan === "trial"
  ) {
    return plan;
  }
  return "trial";
}

export function getLimitsForPlan(plan: PlanTier): PlanLimits {
  if (plan === "free") return FREE_LIMITS;
  if (plan === "starter") return STARTER_LIMITS;
  if (plan === "pro") return PRO_LIMITS;
  if (plan === "agency") return AGENCY_LIMITS;
  return TRIAL_LIMITS;
}

/**
 * The tier actually used for limits. An active paid subscription or a live
 * trial keep their stored plan; everyone else (trial ended, subscription
 * lapsed/canceled) falls back to the permanent Free tier instead of being
 * locked out. Legacy accounts predating the trial column (`trial_ends_at`
 * never set) keep their historical unrestricted access.
 */
export function resolveEffectivePlanTier(
  profile: {
    plan?: string | null;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
  } | null
): PlanTier {
  const status = computeAccessStatus(profile ?? {});
  if (status.hasActiveSubscription) return normalizePlan(profile?.plan);
  if (status.onTrial) return "trial";
  if (status.hasLegacyUnlimitedAccess) return normalizePlan(profile?.plan);
  return "free";
}

export async function getUserPlanTier(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, subscription_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  return resolveEffectivePlanTier(profile);
}

/** Purchasable capacity boosts (see ADDONS in pricing-tiers.ts). Single on/off toggle each, not stackable. */
export type AddonType = "repos" | "seats";

export const ADDON_BONUS: Record<AddonType, number> = {
  repos: 5,
  seats: 2,
};

/** Tiers eligible to benefit from each add-on — matches ADDONS[].appliesTo in pricing-tiers.ts. */
const ADDON_ELIGIBLE_PLANS: Record<AddonType, readonly PlanTier[]> = {
  repos: ["starter", "pro"],
  seats: ["starter", "pro", "agency"],
};

export function isPlanEligibleForAddon(plan: PlanTier, addonType: AddonType): boolean {
  return ADDON_ELIGIBLE_PLANS[addonType].includes(plan);
}

export async function getActiveAddonTypes(
  supabase: SupabaseClient,
  userId: string
): Promise<AddonType[]> {
  const { data } = await supabase
    .from("addon_subscriptions")
    .select("addon_type")
    .eq("user_id", userId)
    .eq("status", "active");

  return (data ?? []).map((row) => row.addon_type as AddonType);
}

/**
 * Base plan limits plus any active add-on the current effective plan is
 * still eligible for. An add-on purchased on a since-lapsed or ineligible
 * plan (e.g. subscription canceled, or downgraded off Starter/Pro) simply
 * stops applying — its Paystack subscription isn't auto-canceled, so the
 * Billing page surfaces it as active-but-not-applying for the owner to cancel.
 */
export async function getEffectiveLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plan: PlanTier; limits: PlanLimits; activeAddons: AddonType[] }> {
  const plan = await getUserPlanTier(supabase, userId);
  const activeAddons = await getActiveAddonTypes(supabase, userId);
  const limits = { ...getLimitsForPlan(plan) };

  for (const addonType of activeAddons) {
    if (isPlanEligibleForAddon(plan, addonType)) {
      if (addonType === "repos") limits.maxTrackedRepos += ADDON_BONUS.repos;
      if (addonType === "seats") limits.maxSeats += ADDON_BONUS.seats;
    }
  }

  return { plan, limits, activeAddons };
}

export function formatLimit(value: number | null): string {
  return value == null ? "unlimited" : String(value);
}

export interface PlanDisplay {
  name: string;
  priceLabel: string;
}

/** Paid tiers only — "trial" has no price of its own, it mirrors Pro limits. */
export const PLAN_DISPLAY: Record<"starter" | "pro" | "agency", PlanDisplay> = {
  starter: { name: "Starter", priceLabel: `${formatNgn(TIER_MONTHLY_PRICE_NGN.starter)}/mo` },
  pro: { name: "Pro", priceLabel: `${formatNgn(TIER_MONTHLY_PRICE_NGN.pro)}/mo` },
  agency: { name: "Agency", priceLabel: `${formatNgn(TIER_MONTHLY_PRICE_NGN.agency)}/mo` },
};
