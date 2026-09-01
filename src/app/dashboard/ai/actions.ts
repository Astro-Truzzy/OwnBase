"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import { fetchRepo } from "@/lib/github/fetch-repos";
import { requireTrackedRepo } from "@/lib/dashboard/require-tracked-repo";
import {
  generateRepoSummary,
  type GenerateSummaryResult,
} from "../repo/actions";

/**
 * Generates an AI summary for a tracked repository addressed by `full_name`.
 *
 * The AI Insights hub lists repos from `tracked_repos`, which stores only
 * `full_name` — but summaries are keyed by the **GitHub numeric repo id**
 * (`repo_summaries.repo_id`), which the repo detail page happens to already have
 * from its own `fetchRepo` call. This action resolves that id, then delegates to
 * the existing `generateRepoSummary` so plan limits, quota counting, activity
 * logging, and persistence stay in exactly one place.
 */
export async function generateSummaryForTrackedRepo(
  fullName: string,
): Promise<GenerateSummaryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const tracked = await requireTrackedRepo(supabase, user.id, fullName);
  if (!tracked.ok) {
    return { success: false, error: tracked.error };
  }

  if (fullName.startsWith("gitlab/")) {
    return {
      success: false,
      error:
        "AI summaries read repository content through GitHub, so GitLab repos are not covered yet.",
    };
  }

  const providerToken = await getGitHubAccessToken(supabase, user);
  if (!providerToken) {
    return {
      success: false,
      error:
        "GitHub access required. Sign in again with GitHub to link your account.",
    };
  }

  const [owner, ...nameParts] = fullName.split("/");
  const name = nameParts.join("/");
  if (!owner || !name) {
    return { success: false, error: "Could not read the repository name." };
  }

  const { repo, error: repoError } = await fetchRepo(owner, name, providerToken);
  if (!repo) {
    return {
      success: false,
      error: repoError ?? "Could not load this repository from GitHub.",
    };
  }

  const result = await generateRepoSummary(repo.id, fullName);
  if (result.success) {
    revalidatePath("/dashboard/ai");
  }
  return result;
}
