import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import { getConnectErrorMessage } from "@/lib/auth/connect-errors";
import { launchOAuthAuthorizeUrl, stashAuthNext } from "@/lib/auth/oauth-return";
import { createClient } from "@/lib/supabase/client";

const POST_CONNECT_PATH = "/dashboard/organization";

function providerNotEnabledMessage(
  provider: "GitHub" | "GitLab",
  err: Error,
): string {
  return err.message.includes("not enabled")
    ? `${provider} is not enabled. Enable it in Supabase Dashboard → Authentication → Providers → ${provider}, or upload a project zip instead.`
    : err.message;
}

function mapLinkError(err: Error): string {
  const msg = err.message.toLowerCase();
  if (msg.includes("already linked") || msg.includes("identity_already_exists")) {
    return getConnectErrorMessage("identity_already_exists") ?? err.message;
  }
  return err.message;
}

function hasProviderIdentity(
  identities: { provider: string }[] | undefined,
  provider: "github" | "gitlab",
): boolean {
  return identities?.some((i) => i.provider === provider) ?? false;
}

/**
 * Links GitHub to the signed-in user — same scopes and redirect pattern as sign-in.
 */
export async function connectGitHubAccount(): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to connect GitHub." };
  }

  if (hasProviderIdentity(user.identities, "github")) {
    window.location.assign(POST_CONNECT_PATH);
    return {};
  }

  const redirectTo = getAuthCallbackUrl(POST_CONNECT_PATH);

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "github",
    options: {
      redirectTo,
      scopes: "repo",
      queryParams: { prompt: "select_account" },
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: mapLinkError(error) };
  }

  if (data?.url) {
    stashAuthNext(POST_CONNECT_PATH);
    launchOAuthAuthorizeUrl(data.url);
  }

  return {};
}

/**
 * Links GitLab to the signed-in user — same scopes and redirect pattern as sign-in.
 */
export async function connectGitLabAccount(): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to connect GitLab." };
  }

  if (hasProviderIdentity(user.identities, "gitlab")) {
    window.location.assign(POST_CONNECT_PATH);
    return {};
  }

  const redirectTo = getAuthCallbackUrl(POST_CONNECT_PATH);

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "gitlab",
    options: {
      redirectTo,
      scopes: "read_api read_repository",
      queryParams: { prompt: "login" },
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: mapLinkError(error) };
  }

  if (data?.url) {
    stashAuthNext(POST_CONNECT_PATH);
    launchOAuthAuthorizeUrl(data.url);
  }

  return {};
}

/**
 * Use when the GitHub account already belongs to another Ownbase user —
 * signs in with GitHub (same as the login page) instead of linking.
 */
export async function signInWithGitHubAccount(): Promise<{ error?: string }> {
  const supabase = createClient();
  const redirectTo = getAuthCallbackUrl(POST_CONNECT_PATH);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo,
      scopes: "repo",
      queryParams: { prompt: "select_account" },
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: providerNotEnabledMessage("GitHub", error) };
  }

  if (data?.url) {
    stashAuthNext(POST_CONNECT_PATH);
    launchOAuthAuthorizeUrl(data.url);
  }

  return {};
}
