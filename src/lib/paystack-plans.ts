import type { BillingInterval } from "./pricing-tiers";
import type { AddonType } from "./plan-limits";

export type PaystackPlanTier = "starter" | "pro" | "agency";

/**
 * Current-price Paystack plan codes (Pricing Redesign Spec v1). New
 * checkouts always use these. Existing subscribers on the old-price plan
 * codes below are left alone — they are not migrated onto these codes.
 */
export const PAYSTACK_PLAN_CODES: Record<
  PaystackPlanTier,
  Record<BillingInterval, string | undefined>
> = {
  starter: {
    monthly: process.env.PAYSTACK_PLAN_STARTER_MONTHLY,
    annual: process.env.PAYSTACK_PLAN_STARTER_ANNUAL,
  },
  pro: {
    monthly: process.env.PAYSTACK_PLAN_PRO_MONTHLY,
    annual: process.env.PAYSTACK_PLAN_PRO_ANNUAL,
  },
  agency: {
    monthly: process.env.PAYSTACK_PLAN_AGENCY_MONTHLY,
    annual: process.env.PAYSTACK_PLAN_AGENCY_ANNUAL,
  },
};

/**
 * Old-price plan codes, kept only so the webhook can still classify
 * renewal events for subscribers grandfathered at the pre-redesign price
 * (₦6,500 Starter / ₦15,000 Pro). Never used to start a new checkout.
 */
export const LEGACY_PAYSTACK_PLAN_CODES: Partial<Record<"starter" | "pro", string>> = {
  starter: process.env.PAYSTACK_PLAN_STARTER,
  pro: process.env.PAYSTACK_PLAN_PRO,
};

export function getPaystackPlanCode(
  tier: PaystackPlanTier,
  interval: BillingInterval
): string | undefined {
  return PAYSTACK_PLAN_CODES[tier][interval];
}

/** Reverse lookup used by the webhook to classify a plan_code it receives back from Paystack. */
export function resolveTierFromPlanCode(
  planCode: string | null | undefined
): PaystackPlanTier | null {
  if (!planCode) return null;
  for (const tier of ["starter", "pro", "agency"] as const) {
    const codes = PAYSTACK_PLAN_CODES[tier];
    if (planCode === codes.monthly || planCode === codes.annual) return tier;
  }
  if (planCode === LEGACY_PAYSTACK_PLAN_CODES.starter) return "starter";
  if (planCode === LEGACY_PAYSTACK_PLAN_CODES.pro) return "pro";
  return null;
}

/**
 * Add-on plan codes (+5 repos, +2 seats — see ADDONS in pricing-tiers.ts).
 * Monthly-only, single toggle per type; independent Paystack subscriptions
 * layered on top of a base-plan subscription, never used to start a checkout
 * by themselves.
 */
export const PAYSTACK_ADDON_PLAN_CODES: Record<AddonType, string | undefined> = {
  repos: process.env.PAYSTACK_PLAN_ADDON_REPOS,
  seats: process.env.PAYSTACK_PLAN_ADDON_SEATS,
};

export function getAddonPlanCode(addonType: AddonType): string | undefined {
  return PAYSTACK_ADDON_PLAN_CODES[addonType];
}

/** Reverse lookup used by the webhook to tell an add-on event apart from a base-plan event. */
export function resolveAddonTypeFromPlanCode(
  planCode: string | null | undefined
): AddonType | null {
  if (!planCode) return null;
  if (planCode === PAYSTACK_ADDON_PLAN_CODES.repos) return "repos";
  if (planCode === PAYSTACK_ADDON_PLAN_CODES.seats) return "seats";
  return null;
}
