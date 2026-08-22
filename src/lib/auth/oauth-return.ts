import { DEFAULT_POST_AUTH_PATH, sanitizeAuthRedirect } from "@/lib/auth/redirects";

const AUTH_NEXT_STORAGE_KEY = "ownbase_auth_next";
export const AUTH_NEXT_COOKIE = "ownbase_auth_next";

/** Remember post-OAuth destination when the provider returns to Site URL (`/`). */
export function stashAuthNext(path: string): void {
  if (typeof window === "undefined") return;
  const safe = sanitizeAuthRedirect(path);
  try {
    sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, safe);
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=600; SameSite=Lax`;
  } catch {
    /* private mode / quota */
  }
}

/**
 * Open a Supabase authorize URL, forcing `redirect_to` to this origin.
 * Prevents `NEXT_PUBLIC_APP_URL=https://ownbase.cloud` from sending local
 * sign-in to the hosted dashboard.
 */
export function launchOAuthAuthorizeUrl(url: string): void {
  const callback = `${window.location.origin}/auth/callback`;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("redirect_to", callback);
    window.location.assign(parsed.toString());
  } catch {
    window.location.assign(url);
  }
}

export function consumeAuthNext(): string {
  if (typeof window === "undefined") return DEFAULT_POST_AUTH_PATH;
  try {
    const stored = sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
    document.cookie = `${AUTH_NEXT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return sanitizeAuthRedirect(stored);
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }
}

export function readAuthNextFromCookie(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${AUTH_NEXT_COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return sanitizeAuthRedirect(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function hasOAuthSuccessParams(url: string | URL): boolean {
  const parsed = typeof url === "string" ? new URL(url) : url;
  if (parsed.searchParams.get("code")) return true;

  const hash = parsed.hash.replace(/^#/, "");
  if (!hash) return false;
  const hashParams = new URLSearchParams(hash);
  return Boolean(
    hashParams.get("access_token") ||
      hashParams.get("code") ||
      hashParams.get("refresh_token"),
  );
}

export function buildAuthCallbackFromCode(
  code: string,
  next?: string | null,
): string {
  const params = new URLSearchParams({
    code,
    next: sanitizeAuthRedirect(next),
  });
  return `/auth/callback?${params.toString()}`;
}
