/** OAuth / linkIdentity error codes returned by Supabase in the redirect URL. */
export type ConnectErrorCode =
  | "identity_already_exists"
  | "server_error"
  | "auth"
  | string;

export function getConnectErrorMessage(code: ConnectErrorCode | null): string | null {
  if (!code) return null;

  switch (code) {
    case "identity_already_exists":
      return (
        "This GitHub or GitLab account is already linked to another Ownbase account. " +
        "Sign in with that provider instead of email, or use a different account. " +
        "You can also upload a project zip without linking."
      );
    case "server_error":
      return "We could not complete the connection. Please try again or upload a project zip.";
    default:
      return "Connection failed. Please try again or choose another option.";
  }
}

/** Read OAuth error from query string or URL hash (Supabase may use either). */
export function readOAuthErrorFromUrl(url: string | URL): ConnectErrorCode | null {
  const parsed = typeof url === "string" ? new URL(url) : url;
  const fromQuery =
    parsed.searchParams.get("error_code") ??
    parsed.searchParams.get("error");
  if (fromQuery) return fromQuery;

  const hash = parsed.hash.replace(/^#/, "");
  if (!hash) return null;
  const hashParams = new URLSearchParams(hash);
  return (
    hashParams.get("error_code") ?? hashParams.get("error") ?? null
  );
}

export function buildConnectErrorRedirectPath(
  code: ConnectErrorCode,
  options: { signedIn: boolean },
): string {
  const base = options.signedIn ? "/dashboard" : "/login";
  const params = new URLSearchParams({ connect_error: code });
  if (!options.signedIn) {
    params.set("redirectTo", "/dashboard");
  }
  return `${base}?${params.toString()}`;
}
