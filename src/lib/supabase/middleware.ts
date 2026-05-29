import { AUTH_NEXT_COOKIE, readAuthNextFromCookie } from "@/lib/auth/oauth-return";
import {
  DEFAULT_POST_AUTH_PATH,
  sanitizeAuthRedirect,
} from "@/lib/auth/redirects";
import {
  applyAiRateLimit,
  applyAuthRateLimit,
  isAiRateLimitPath,
  isAuthRateLimitPath,
} from "@/lib/security/rate-limit";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_LOOKUP_TIMEOUT_MS = 2000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const acceptHeader = request.headers.get("accept") ?? "";
  const isHtmlNavigation =
    request.method === "GET" && acceptHeader.includes("text/html");

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

  let user: { id: string } | null = null;
  try {
    const {
      data: { user: authUser },
    } = await withTimeout(supabase.auth.getUser(), AUTH_LOOKUP_TIMEOUT_MS);
    user = authUser;
  } catch (error) {
    // Keep middleware non-fatal during transient Supabase/network failures.
    console.error("[middleware] supabase.auth.getUser failed", error);
  }

  if (isAiRateLimitPath(pathname)) {
    const limited = await applyAiRateLimit(request, user?.id ?? null);
    if (!limited.ok) return limited.response;
  }

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isAuthRoute = pathname.startsWith("/auth/");
  const isHome = pathname === "/";

  if (user && isHtmlNavigation && !isDashboard && !isAuthRoute) {
    // Security policy: leaving dashboard ends the current authenticated session.
    await supabase.auth.signOut();
    user = null;
  }

  const oauthErrorCode =
    request.nextUrl.searchParams.get("error_code") ??
    request.nextUrl.searchParams.get("error");

  if (isHome && oauthErrorCode) {
    const url = request.nextUrl.clone();
    if (user) {
      url.pathname = "/dashboard";
      url.searchParams.set("connect_error", oauthErrorCode);
    } else {
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("connect_error", oauthErrorCode);
      url.searchParams.set("redirectTo", "/dashboard");
    }
    return NextResponse.redirect(url);
  }

  const authCode = request.nextUrl.searchParams.get("code");
  if (isHome && authCode && !oauthErrorCode) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.get("next")) {
      const nextFromCookie = readAuthNextFromCookie(request.headers.get("cookie"));
      url.searchParams.set(
        "next",
        nextFromCookie ?? DEFAULT_POST_AUTH_PATH,
      );
    }
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_NEXT_COOKIE);
    return response;
  }

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

  return supabaseResponse;
}
