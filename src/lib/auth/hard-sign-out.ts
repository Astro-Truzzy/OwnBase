/**
 * Server route that revokes the Supabase session (global) and clears auth cookies.
 * Use a full navigation so Next.js and the browser drop cached auth state reliably.
 */
export const AUTH_SIGN_OUT_PATH = "/auth/sign-out";

export function navigateToServerSignOut(): void {
  window.location.assign(AUTH_SIGN_OUT_PATH);
}
