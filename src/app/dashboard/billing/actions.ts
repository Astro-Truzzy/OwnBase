"use server";

import { createClient } from "@/lib/supabase/server";
import { initializeSubscription } from "@/lib/paystack";
import {
  getAddonPlanCode,
  getPaystackPlanCode,
  type PaystackPlanTier,
} from "@/lib/paystack-plans";
import {
  getEffectiveLimits,
  isPlanEligibleForAddon,
  type AddonType,
} from "@/lib/plan-limits";
import type { BillingInterval } from "@/lib/pricing-tiers";

export type SubscribeResult = { error: string } | { redirectUrl: string };

function billingCallbackUrl(): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  return `${origin.startsWith("http") ? origin : `https://${origin}`}/dashboard/billing?success=1`;
}

/**
 * Start Paystack subscription flow for the current user.
 * Redirects to Paystack checkout; on success, webhook updates profile.
 */
export async function subscribeWithPaystackAction(
  planId: PaystackPlanTier,
  interval: BillingInterval = "monthly"
): Promise<SubscribeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "You must be signed in to subscribe." };
  }

  const planCode = getPaystackPlanCode(planId, interval);
  if (!planCode) {
    return {
      error: `The ${planId} (${interval}) plan isn't configured yet. Please add its Paystack plan code to your environment.`,
    };
  }

  const result = await initializeSubscription({
    email: user.email,
    planCode,
    callbackUrl: billingCallbackUrl(),
    metadata: { user_id: user.id, plan_id: planId, plan_code: planCode },
  });

  if ("error" in result) {
    return { error: result.error };
  }

  return { redirectUrl: result.authorizationUrl };
}

/**
 * Get Paystack subscription manage link (update card, cancel). Opens in new tab.
 */
export async function getManageLinkAction(): Promise<{ link: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("paystack_subscription_code")
    .eq("user_id", user.id)
    .single();

  const code = profile?.paystack_subscription_code;
  if (!code) return { error: "No active subscription" };

  const { getSubscriptionManageLink } = await import("@/lib/paystack");
  return getSubscriptionManageLink(code);
}

const ADDON_LABEL: Record<AddonType, string> = {
  repos: "+5 repositories",
  seats: "+2 seats",
};

/**
 * Start the Paystack checkout for an add-on (independent recurring
 * subscription layered on top of the base plan). On success, the webhook
 * writes the addon_subscriptions row.
 */
export async function subscribeAddonAction(addonType: AddonType): Promise<SubscribeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "You must be signed in to subscribe." };
  }

  const { plan, activeAddons } = await getEffectiveLimits(supabase, user.id);
  if (!isPlanEligibleForAddon(plan, addonType)) {
    return {
      error: `${ADDON_LABEL[addonType]} isn't available on your current plan.`,
    };
  }
  if (activeAddons.includes(addonType)) {
    return { error: `You already have ${ADDON_LABEL[addonType]} active.` };
  }

  const planCode = getAddonPlanCode(addonType);
  if (!planCode) {
    return {
      error: `${ADDON_LABEL[addonType]} isn't configured yet. Please add its Paystack plan code to your environment.`,
    };
  }

  const result = await initializeSubscription({
    email: user.email,
    planCode,
    callbackUrl: billingCallbackUrl(),
    metadata: { user_id: user.id, addon_type: addonType, plan_code: planCode },
  });

  if ("error" in result) {
    return { error: result.error };
  }

  return { redirectUrl: result.authorizationUrl };
}

/** Get Paystack manage link (update card, cancel) for an active add-on subscription. */
export async function getAddonManageLinkAction(
  addonType: AddonType
): Promise<{ link: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: addon } = await supabase
    .from("addon_subscriptions")
    .select("paystack_subscription_code, status")
    .eq("user_id", user.id)
    .eq("addon_type", addonType)
    .maybeSingle();

  const code = addon?.status === "active" ? addon.paystack_subscription_code : null;
  if (!code) return { error: "No active add-on subscription" };

  const { getSubscriptionManageLink } = await import("@/lib/paystack");
  return getSubscriptionManageLink(code);
}
