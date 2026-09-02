import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getEffectiveLimits,
  type PlanLimits,
  type PlanTier,
} from "./plan-limits";

export interface UsageSnapshot {
  plan: PlanTier;
  limits: PlanLimits;
  trackedRepos: number;
  uploads: number;
  aiSummariesThisMonth: number;
  /** 0–1 ratio for capped resources; null if unlimited */
  trackedRatio: number | null;
  uploadRatio: number | null;
  summaryRatio: number | null;
  anyAtHardLimit: boolean;
  anyNearSoftLimit: boolean;
}

function ratio(used: number, max: number | null): number | null {
  if (max == null) return null;
  if (max <= 0) return 1;
  return Math.min(1, used / max);
}

export async function getUsageSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageSnapshot> {
  const { plan, limits } = await getEffectiveLimits(supabase, userId);

  const now = new Date();
  const monthStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  ).toISOString();

  const [trackedRes, uploadRes, summaryRes] = await Promise.all([
    supabase
      .from("tracked_repos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("uploaded_projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action_type", "summary_generated")
      .gte("created_at", monthStartIso),
  ]);

  const trackedRepos = trackedRes.count ?? 0;
  const uploads = uploadRes.count ?? 0;
  const aiSummariesThisMonth = summaryRes.count ?? 0;

  const trackedRatio = ratio(trackedRepos, limits.maxTrackedRepos);
  const uploadRatio = ratio(uploads, limits.maxUploads);
  const summaryRatio = ratio(
    aiSummariesThisMonth,
    limits.maxAiSummariesPerMonth
  );

  const soft = 0.8;
  const nearTracked =
    trackedRatio != null && trackedRatio >= soft && trackedRatio < 1;
  const nearUpload =
    uploadRatio != null && uploadRatio >= soft && uploadRatio < 1;
  const nearSummary =
    summaryRatio != null && summaryRatio >= soft && summaryRatio < 1;

  const hardTracked =
    trackedRatio != null && trackedRepos >= limits.maxTrackedRepos;
  const hardUpload =
    limits.maxUploads != null && uploads >= limits.maxUploads;
  const hardSummary =
    aiSummariesThisMonth >= limits.maxAiSummariesPerMonth;

  return {
    plan,
    limits,
    trackedRepos,
    uploads,
    aiSummariesThisMonth,
    trackedRatio,
    uploadRatio,
    summaryRatio,
    anyAtHardLimit: hardTracked || hardUpload || hardSummary,
    anyNearSoftLimit:
      (nearTracked || nearUpload || nearSummary) &&
      !(hardTracked || hardUpload || hardSummary),
  };
}
