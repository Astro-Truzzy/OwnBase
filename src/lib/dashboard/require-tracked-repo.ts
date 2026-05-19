import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the signed-in user has tracked this repository before GitHub/GitLab API calls.
 */
export async function requireTrackedRepo(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("tracked_repos")
    .select("id")
    .eq("user_id", userId)
    .eq("full_name", fullName)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not verify repository access." };
  }

  if (!data) {
    return {
      ok: false,
      error: "Repository is not in your organization.",
    };
  }

  return { ok: true };
}
