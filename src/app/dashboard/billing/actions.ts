"use server";

import { createClient } from "@/lib/supabase/server";
import { initializeSubscription } from "@/lib/paystack";

const PLAN_CODES: Record<string, string> = {
  starter: process.env.PAYSTACK_PLAN_STARTER ?? "",
  pro: process.env.PAYSTACK_PLAN_PRO ?? "",
};

export type SubscribeResult = { error: string } | { redirectUrl: string };

/**
 * Start Paystack subscription flow for the current user.
 * Redirects to Paystack checkout; on success, webhook updates profile.
 */
export async function subscribeWithPaystackAction(planId: string): Promise<SubscribeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "You must be signed in to subscribe." };
  }

  const planCode = PLAN_CODES[planId] || process.env.PAYSTACK_PLAN_STARTER;
  if (!planCode) {
    return {
      error:
        "Subscription plans are not configured. Please add PAYSTACK_PLAN_STARTER (and optionally PAYSTACK_PLAN_PRO) to your environment.",
    };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const callbackUrl = `${origin.startsWith("http") ? origin : `https://${origin}`}/dashboard/billing?success=1`;

  const result = await initializeSubscription({
    email: user.email,
    planCode,
    callbackUrl,
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
