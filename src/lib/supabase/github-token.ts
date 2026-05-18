import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServiceClient } from "./admin";

/**
 * Resolves a GitHub API access token for the current user.
 * Order: session provider_token → refresh session → stored integration → env fallback.
 */
export async function getGitHubAccessToken(
  supabase: SupabaseClient,
  user: User,
): Promise<string | null> {
  const provider = (user.app_metadata?.provider as string) ?? "github";

  const { data: sessionData } = await supabase.auth.getSession();
  let token = sessionData.session?.provider_token?.trim() || null;

  if (!token) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    token = refreshed.session?.provider_token?.trim() || null;
  }

  if (!token && provider === "github") {
    token = await loadStoredGitHubToken(user.id);
  }

  if (!token) {
    token = process.env.GITHUB_TOKEN?.trim() || null;
  }

  return token;
}

async function loadStoredGitHubToken(userId: string): Promise<string | null> {
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("user_github_tokens")
      .select("access_token")
      .eq("user_id", userId)
      .maybeSingle();
    return data?.access_token?.trim() || null;
  } catch {
    return null;
  }
}

export async function persistGitHubTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string | null,
): Promise<void> {
  try {
    const admin = createServiceClient();
    await admin.from("user_github_tokens").upsert(
      {
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch {
    // Non-fatal if service role or table is unavailable.
  }
}
