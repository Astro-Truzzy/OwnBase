import type { ActivityActionType } from "./db/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LogActivityParams {
  userId: string;
  repoOwner: string;
  repoName: string;
  fullName: string;
  actionType: ActivityActionType;
  details?: Record<string, unknown>;
}

/**
 * Append an activity log entry. Used for audit trail and "who touched what."
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: LogActivityParams
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("activity_log").insert({
    user_id: params.userId,
    repo_owner: params.repoOwner,
    repo_name: params.repoName,
    full_name: params.fullName,
    action_type: params.actionType,
    details: params.details ?? {},
  });
  return { error: error ? new Error(error.message) : null };
}
