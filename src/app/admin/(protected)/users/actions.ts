"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CompResult = { error: string } | { ok: true };

/** A comp is always a paid tier — Free/Trial are what accounts fall back to. */
const COMPABLE_TIERS = ["starter", "pro", "agency"] as const;
type CompableTier = (typeof COMPABLE_TIERS)[number];

const MAX_COMP_MONTHS = 60;

function isCompableTier(value: string): value is CompableTier {
  return (COMPABLE_TIERS as readonly string[]).includes(value);
}

/** Month maths done on the calendar rather than 30-day blocks. */
function addMonths(from: Date, months: number): Date {
  const result = new Date(from);
  result.setMonth(result.getMonth() + months);
  return result;
}

function revalidateAdminSurfaces(): void {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/revenue");
}

/**
 * Grants a paid tier without payment and flags the account as comped, so the
 * tier is real (full entitlements) but never counted as revenue.
 *
 * Writes through the service-role client because profiles' billing columns are
 * protected by the guard_profiles_billing_fields trigger — an ordinary
 * authenticated session cannot change plan / subscription_ends_at at all.
 */
export async function setCompAction(
  userId: string,
  tier: string,
  months: number
): Promise<CompResult> {
  // The /admin layout guard does NOT cover server actions — authorise here.
  await requireAdminUser();

  if (!isCompableTier(tier)) {
    return { error: "Unknown plan tier." };
  }
  if (!Number.isInteger(months) || months < 1 || months > MAX_COMP_MONTHS) {
    return { error: `Months must be a whole number between 1 and ${MAX_COMP_MONTHS}.` };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("trial_ends_at, subscription_ends_at, paystack_subscription_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    return { error: "That account has no profile row to update." };
  }

  // Refuse to comp a real subscriber: is_comp=true would hide revenue they are
  // actually paying, which is the opposite of what this flag is for. Cancel the
  // Paystack subscription first if the intent really is to make them free.
  const subscriptionLive =
    profile.subscription_ends_at != null &&
    new Date(profile.subscription_ends_at).getTime() > Date.now();
  if (profile.paystack_subscription_code != null || subscriptionLive) {
    return {
      error:
        "That account already has a Paystack subscription. Cancel it before comping, " +
        "otherwise their real revenue would be hidden.",
    };
  }

  const now = new Date();
  const { error } = await admin
    .from("profiles")
    .update({
      plan: tier,
      subscription_ends_at: addMonths(now, months).toISOString(),
      // Legacy accounts (trial_ends_at never set) short-circuit the subscription
      // check in resolveEffectivePlanTier and would keep the tier forever, so the
      // comp would never expire. Stamp one if absent; leave an existing one alone.
      trial_ends_at: profile.trial_ends_at ?? now.toISOString(),
      is_comp: true,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    return { error: `Could not comp that account: ${error.message}` };
  }

  revalidateAdminSurfaces();
  return { ok: true };
}

/**
 * Ends a comp. `plan` is deliberately left as-is — the same way a lapsed
 * Paystack subscription behaves — so the effective tier resolves down to
 * trial/free on its own without this action needing the prior state.
 */
export async function clearCompAction(userId: string): Promise<CompResult> {
  await requireAdminUser();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      is_comp: false,
      subscription_ends_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    return { error: `Could not end that comp: ${error.message}` };
  }

  revalidateAdminSurfaces();
  return { ok: true };
}
