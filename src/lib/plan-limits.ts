import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanTier = "trial" | "starter" | "pro";

export interface PlanLimits {
  maxTrackedRepos: number;
  /** null means unlimited */
  maxUploads: number | null;
  maxAiSummariesPerMonth: number;
}

const STARTER_LIMITS: PlanLimits = {
  maxTrackedRepos: 5,
  maxUploads: 1,
  maxAiSummariesPerMonth: Number(process.env.STARTER_AI_SUMMARIES_PER_MONTH ?? 20),
};

const PRO_LIMITS: PlanLimits = {
  maxTrackedRepos: 25,
  maxUploads: null,
  maxAiSummariesPerMonth: Number(process.env.PRO_AI_SUMMARIES_PER_MONTH ?? 200),
};

const TRIAL_LIMITS: PlanLimits = { ...PRO_LIMITS };

export function normalizePlan(plan: string | null | undefined): PlanTier {
  if (plan === "starter" || plan === "pro" || plan === "trial") {
    return plan;
  }
  return "trial";
}

export function getLimitsForPlan(plan: PlanTier): PlanLimits {
  if (plan === "starter") return STARTER_LIMITS;
  if (plan === "pro") return PRO_LIMITS;
  return TRIAL_LIMITS;
}

export async function getUserPlanTier(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  return normalizePlan(profile?.plan);
}

export function formatLimit(value: number | null): string {
  return value == null ? "unlimited" : String(value);
}
