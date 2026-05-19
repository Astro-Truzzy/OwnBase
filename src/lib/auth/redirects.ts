/** Default path after a successful sign-in or sign-up. */
export const DEFAULT_POST_AUTH_PATH = "/dashboard";

/** Where users set a new password after clicking the reset email link. */
export const PASSWORD_RESET_PATH = "/reset-password";

/**
 * Only allow same-origin relative paths (prevents open redirects).
 */
export function sanitizeAuthRedirect(path: string | null | undefined): string {
  if (!path || typeof path !== "string") return DEFAULT_POST_AUTH_PATH;

  let decoded = path.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (decoded.includes("://") || decoded.includes("\\")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return decoded;
}

/**
 * Canonical app origin for OAuth and email links.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://ownbase.com).
 */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    // Always use the page origin for OAuth so local dev works when NEXT_PUBLIC_APP_URL is production.
    return window.location.origin;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl) return appUrl;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/** Supabase OAuth / magic-link callback (must be allowlisted in Supabase Dashboard). */
export function getAuthCallbackUrl(next?: string | null): string {
  const safeNext = sanitizeAuthRedirect(next);
  return `${getSiteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Password recovery email → `/auth/callback` → `/reset-password`. */
export function getPasswordResetCallbackUrl(): string {
  return getAuthCallbackUrl(PASSWORD_RESET_PATH);
}

export function loginPath(options?: {
  redirectTo?: string | null;
  error?: string;
  signedOut?: boolean;
}): string {
  const params = new URLSearchParams();
  if (options?.redirectTo) {
    params.set("redirectTo", sanitizeAuthRedirect(options.redirectTo));
  }
  if (options?.error) params.set("error", options.error);
  if (options?.signedOut) params.set("signedOut", "1");
  const q = params.toString();
  return q ? `/login?${q}` : "/login";
}

/** Redirect URLs to add under Supabase → Authentication → URL Configuration. */
export function getSupabaseRedirectAllowlist(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    getSiteOrigin(),
  ]);

  const list: string[] = [];
  for (const origin of origins) {
    list.push(`${origin}/auth/callback`);
  }
  return list;
}
