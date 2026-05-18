import { sanitizeAuthRedirect } from "@/lib/auth/redirects";
import { createClient } from "../../../lib/supabase/server";
import { persistGitHubTokens } from "../../../lib/supabase/github-token";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeAuthRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (
        user &&
        session?.provider_token &&
        ((user.app_metadata?.provider as string) ?? "github") === "github"
      ) {
        await persistGitHubTokens(
          user.id,
          session.provider_token,
          session.provider_refresh_token,
        );
      }
      if (user) {
        const fullName =
          (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? "";
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        const first = parts[0] ?? (user.user_metadata?.given_name as string) ?? null;
        const last =
          parts.length > 1
            ? parts.slice(1).join(" ")
            : (user.user_metadata?.family_name as string) ?? parts[0] ?? null;

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const isNewUser = !existingProfile;
        const trialEndsAt = isNewUser
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              first_name: first,
              last_name: last,
              updated_at: new Date().toISOString(),
              ...(isNewUser && {
                trial_ends_at: trialEndsAt,
                plan: "trial",
              }),
            },
            { onConflict: "user_id" }
          );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
