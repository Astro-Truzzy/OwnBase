import { sanitizeAuthRedirect } from "@/lib/auth/redirects";
import { ensureTrialForNewAccount } from "@/lib/profiles/ensure-trial";
import { persistGitHubTokens } from "@/lib/supabase/github-token";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth / email-confirm callback. Session cookies must be written on the redirect
 * Response (Route Handlers cannot use cookies() from next/headers for set).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = sanitizeAuthRedirect(searchParams.get("next"));

  const successUrl = new URL(next, request.nextUrl.origin);
  const errorUrl = new URL("/login?error=auth", request.nextUrl.origin);

  if (!code) {
    return NextResponse.redirect(errorUrl);
  }

  const response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(errorUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(errorUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (
    session?.provider_token &&
    ((user.app_metadata?.provider as string) ?? "github") === "github"
  ) {
    await persistGitHubTokens(
      user.id,
      session.provider_token,
      session.provider_refresh_token,
    );
  }

  const fullName =
    (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? (user.user_metadata?.given_name as string) ?? null;
  const last =
    parts.length > 1
      ? parts.slice(1).join(" ")
      : (user.user_metadata?.family_name as string) ?? parts[0] ?? null;

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      first_name: first,
      last_name: last,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  await ensureTrialForNewAccount(user.id, user.created_at);

  return response;
}
