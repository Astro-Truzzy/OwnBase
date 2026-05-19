import { sanitizeAuthRedirect } from "@/lib/auth/redirects";
import {
  applyAiRateLimit,
  applyAuthRateLimit,
  isAiRateLimitPath,
  isAuthRateLimitPath,
} from "@/lib/security/rate-limit";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { computeAccessStatus } from "../subscription-access";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isAuthRateLimitPath(pathname)) {
    const limited = await applyAuthRateLimit(request);
    if (!limited.ok) return limited.response;
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAiRateLimitPath(pathname)) {
    const limited = await applyAiRateLimit(request, user?.id ?? null);
    if (!limited.ok) return limited.response;
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isBillingPage = pathname.startsWith("/dashboard/billing");

  if (isDashboard && !user && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = sanitizeAuthRedirect(request.nextUrl.searchParams.get("redirectTo"));
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isDashboard && !isBillingPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, trial_ends_at, subscription_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const accessStatus = computeAccessStatus(profile ?? {});
    if (accessStatus.trialExpired && !accessStatus.hasLegacyUnlimitedAccess) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/billing";
      url.searchParams.set("reason", "trial_expired");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
