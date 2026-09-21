import { createAdminClient } from "@/lib/supabase/admin";
import { TIER_MONTHLY_PRICE_NGN } from "@/lib/pricing-tiers";

// Current-price constants, sourced from pricing-tiers.ts (the single source
// of truth for what a plan costs). Note: subscribers grandfathered at the
// pre-redesign price (₦6,500 Starter / ₦15,000 Pro) still pay their old
// rate in Paystack, so estimated MRR below is approximate until they
// resubscribe at the current price.
export const PLAN_PRICE_NGN = {
  starter: TIER_MONTHLY_PRICE_NGN.starter,
  pro: TIER_MONTHLY_PRICE_NGN.pro,
  agency: TIER_MONTHLY_PRICE_NGN.agency,
  trial: 0,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OverviewMetrics {
  total_users: number;
  new_7d: number;
  new_30d: number;
  active_7d: number;
  active_30d: number;
  // Entitlement view — every account on that effective tier, comps included.
  plan_free: number;
  plan_trial: number;
  plan_starter: number;
  plan_pro: number;
  plan_agency: number;
  // Revenue view — same tiers excluding comped accounts.
  paying_starter: number;
  paying_pro: number;
  paying_agency: number;
  /** Paid tiers granted without payment. Visible, but never counted as revenue. */
  comped_users: number;
  trials_expiring_7d: number;
  repos_total: number;
  uploads_total: number;
  summaries_month: number;
  webhook_pending_7d: number;
  inactive_with_repos: number;
  // Derived
  paying_users: number;
  estimated_mrr_ngn: number;
}

export interface DaySeries {
  day: string; // ISO date "YYYY-MM-DD"
  value: number;
}

export interface AdminUser {
  user_id: string;
  email: string;
  plan: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  is_comp: boolean;
  tracked_repos_count: number;
  last_activity: string | null;
  created_at: string;
}

export interface PlanHistoryRow {
  month: string;
  trial_count: number;
  starter_count: number;
  pro_count: number;
  agency_count: number;
  free_count: number;
}

export interface WebhookEvent {
  id: string;
  event_key: string;
  event_type: string;
  processed: boolean;
  received_at: string;
  processed_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────────

interface RevenueBreakdown {
  payingStarter: number;
  payingPro: number;
  payingAgency: number;
  payingUsers: number;
  mrrNgn: number;
}

/**
 * Turns the raw RPC payload into the REVENUE view: who counts as paying, and
 * what that is worth per month.
 *
 * The entitlement buckets (`plan_*`) include comped accounts — a paid tier
 * granted without payment — so they must not be used to compute revenue.
 * The RPC exposes a parallel `paying_*` split with comps filtered out, which
 * is what this reads once the is_comp migration is applied.
 */
function deriveRevenue(raw: Record<string, number>): RevenueBreakdown {
  // The paying_* split ships with the is_comp migration, and migrations here are
  // applied by hand — so this code can run against an RPC that predates it.
  // Defaulting a missing key to 0 would render ₦0 MRR, which reads as "revenue
  // collapsed" rather than "migration pending". Fall back to the entitlement
  // counts instead: that is exactly the pre-migration behaviour, so the numbers
  // stay honest either way. The migration adds all three keys together or none.
  const hasPayingSplit = raw.paying_agency !== undefined;
  const payingFor = (tier: "starter" | "pro" | "agency") =>
    Number((hasPayingSplit ? raw[`paying_${tier}`] : raw[`plan_${tier}`]) ?? 0);

  const payingStarter = payingFor("starter");
  const payingPro = payingFor("pro");
  const payingAgency = payingFor("agency");

  return {
    payingStarter,
    payingPro,
    payingAgency,
    payingUsers: payingStarter + payingPro + payingAgency,
    mrrNgn:
      payingStarter * PLAN_PRICE_NGN.starter +
      payingPro * PLAN_PRICE_NGN.pro +
      payingAgency * PLAN_PRICE_NGN.agency,
  };
}

export async function getAdminOverview(): Promise<OverviewMetrics> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_admin_overview_metrics");
  if (error) throw new Error(`Admin overview metrics failed: ${error.message}`);

  const raw = data as Record<string, number>;
  const revenue = deriveRevenue(raw);

  return {
    total_users: Number(raw.total_users ?? 0),
    new_7d: Number(raw.new_7d ?? 0),
    new_30d: Number(raw.new_30d ?? 0),
    active_7d: Number(raw.active_7d ?? 0),
    active_30d: Number(raw.active_30d ?? 0),
    plan_free: Number(raw.plan_free ?? 0),
    plan_trial: Number(raw.plan_trial ?? 0),
    plan_starter: Number(raw.plan_starter ?? 0),
    plan_pro: Number(raw.plan_pro ?? 0),
    plan_agency: Number(raw.plan_agency ?? 0),
    paying_starter: revenue.payingStarter,
    paying_pro: revenue.payingPro,
    paying_agency: revenue.payingAgency,
    comped_users: Number(raw.comped_users ?? 0),
    trials_expiring_7d: Number(raw.trials_expiring_7d ?? 0),
    repos_total: Number(raw.repos_total ?? 0),
    uploads_total: Number(raw.uploads_total ?? 0),
    summaries_month: Number(raw.summaries_month ?? 0),
    webhook_pending_7d: Number(raw.webhook_pending_7d ?? 0),
    inactive_with_repos: Number(raw.inactive_with_repos ?? 0),
    paying_users: revenue.payingUsers,
    estimated_mrr_ngn: revenue.mrrNgn,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signup series
// ─────────────────────────────────────────────────────────────────────────────

export async function getSignupSeries(daysBack = 30): Promise<DaySeries[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_admin_signup_series", {
    days_back: daysBack,
  });
  if (error) throw new Error(`Signup series failed: ${error.message}`);
  return ((data as { day: string; signups: number }[]) ?? []).map((r) => ({
    day: r.day,
    value: Number(r.signups),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Active User series
// ─────────────────────────────────────────────────────────────────────────────

export async function getDauSeries(daysBack = 30): Promise<DaySeries[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_admin_dau_series", {
    days_back: daysBack,
  });
  if (error) throw new Error(`DAU series failed: ${error.message}`);
  return ((data as { day: string; active_users: number }[]) ?? []).map((r) => ({
    day: r.day,
    value: Number(r.active_users),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Users list
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminUsers(
  page = 0,
  limit = 25,
  search?: string,
): Promise<{ users: AdminUser[]; total: number }> {
  const admin = createAdminClient();
  const [usersRes, countRes] = await Promise.all([
    admin.rpc("get_admin_users_page", {
      page_limit: limit,
      page_offset: page * limit,
      search_email: search ?? null,
    }),
    admin.rpc("get_admin_users_count", {
      search_email: search ?? null,
    }),
  ]);

  if (usersRes.error) throw new Error(`Users page failed: ${usersRes.error.message}`);
  if (countRes.error) throw new Error(`Users count failed: ${countRes.error.message}`);

  return {
    // `is_comp` is absent from the RPC payload until the migration is applied —
    // normalise so the typed field is never a lie.
    users: ((usersRes.data as AdminUser[]) ?? []).map((u) => ({
      ...u,
      is_comp: Boolean(u.is_comp),
    })),
    total: Number(countRes.data ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan history
// ─────────────────────────────────────────────────────────────────────────────

export async function getPlanHistory(monthsBack = 6): Promise<PlanHistoryRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_admin_plan_history", {
    months_back: monthsBack,
  });
  if (error) throw new Error(`Plan history failed: ${error.message}`);
  return ((data as PlanHistoryRow[]) ?? []).map((r) => ({
    month: r.month,
    trial_count: Number(r.trial_count),
    starter_count: Number(r.starter_count),
    pro_count: Number(r.pro_count),
    agency_count: Number(r.agency_count),
    free_count: Number(r.free_count),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook events
// ─────────────────────────────────────────────────────────────────────────────

export async function getWebhookEvents(limit = 30): Promise<WebhookEvent[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_admin_webhook_events", {
    event_limit: limit,
  });
  if (error) throw new Error(`Webhook events failed: ${error.message}`);
  return (data as WebhookEvent[]) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format ₦ amount with thousands separator */
export function formatNgn(amount: number): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(1)}k`;
  }
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** Determine plan badge tone */
export function planTone(plan: string): "emerald" | "cyan" | "amber" | "violet" | "muted" {
  if (plan === "pro") return "emerald";
  if (plan === "agency") return "violet";
  if (plan === "starter") return "cyan";
  if (plan === "trial") return "amber";
  // "free" and anything unrecognized both fall through to muted.
  return "muted";
}

/** Returns "active" | "expiring" | "expired" for a trial or subscription */
export function subscriptionStatus(
  plan: string,
  trialEndsAt: string | null,
  subEndsAt: string | null,
): "active" | "expiring" | "expired" | "none" {
  const now = Date.now();
  if (plan === "pro" || plan === "starter" || plan === "agency") {
    if (!subEndsAt) return "active";
    const ends = new Date(subEndsAt).getTime();
    if (ends < now) return "expired";
    if (ends < now + 7 * 86_400_000) return "expiring";
    return "active";
  }
  if (plan === "trial") {
    if (!trialEndsAt) return "active";
    const ends = new Date(trialEndsAt).getTime();
    if (ends < now) return "expired";
    if (ends < now + 7 * 86_400_000) return "expiring";
    return "active";
  }
  // Free is a permanent resting state, not a lapsed trial/subscription — no urgency badge.
  if (plan === "free") return "active";
  return "none";
}
