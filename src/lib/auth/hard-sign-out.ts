/**
 * Server route that revokes the Supabase session (global) and clears auth cookies.
 * Uses POST to avoid cross-site logout (CSRF).
 */
export const AUTH_SIGN_OUT_PATH = "/auth/sign-out";

export function navigateToServerSignOut(): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = AUTH_SIGN_OUT_PATH;
  form.style.display = "none";
  document.body.appendChild(form);
  form.submit();
}
