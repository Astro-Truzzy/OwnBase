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

const LOCAL_DEV_ORIGIN = "http://localhost:3000";
const AUTH_NEXT_COOKIE = "ownbase_auth_next";
const AUTH_NEXT_STORAGE_KEY = "ownbase_auth_next";

function isLocalDevOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function persistClientAuthNext(path: string) {
  if (typeof document === "undefined") return;
  const safe = sanitizeAuthRedirect(path);
  try {
    sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, safe);
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=600; SameSite=Lax`;
  } catch {
    /* private mode / quota */
  }
}

/**
 * Canonical app origin for OAuth and email links.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://ownbase.com).
 * `next dev` never uses a hosted APP_URL — that would send sign-in to production.
 */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (process.env.NODE_ENV !== "production") {
    if (appUrl && isLocalDevOrigin(appUrl)) return appUrl;
    return LOCAL_DEV_ORIGIN;
  }

  if (appUrl) return appUrl;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return LOCAL_DEV_ORIGIN;
}

/** Supabase OAuth / magic-link callback (must be allowlisted in Supabase Dashboard). */
export function getAuthCallbackUrl(next?: string | null): string {
  const safeNext = sanitizeAuthRedirect(next);
  persistClientAuthNext(safeNext);
  const origin = getSiteOrigin();
  // Client OAuth omits `?next=` so the URL matches exact Redirect URL allowlist
  // entries. `/auth/callback` recovers `next` from the cookie set above.
  if (typeof window !== "undefined") {
    return `${origin}/auth/callback`;
  }
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Password recovery email → `/auth/callback` → `/reset-password`. */
export function getPasswordResetCallbackUrl(): string {
  return getAuthCallbackUrl(PASSWORD_RESET_PATH);
}
