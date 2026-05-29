"use client";

import { useEffect } from "react";
import {
  buildConnectErrorRedirectPath,
  readOAuthErrorFromUrl,
} from "@/lib/auth/connect-errors";
import {
  buildAuthCallbackFromCode,
  consumeAuthNext,
  hasOAuthSuccessParams,
} from "@/lib/auth/oauth-return";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase sometimes sends OAuth/link flows to Site URL (`/`) instead of
 * `/auth/callback`. Recover errors and successful returns (query `code` or hash tokens).
 */
export function OAuthErrorRecovery() {
  useEffect(() => {
    void (async () => {
      const href = window.location.href;
      const pathname = window.location.pathname;
      const onAuthCallback = pathname.startsWith("/auth/callback");

      const oauthError = readOAuthErrorFromUrl(href);
      if (oauthError) {
        const onDashboardOrAuth =
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/login") ||
          onAuthCallback;

        if (
          onDashboardOrAuth &&
          window.location.search.includes("connect_error")
        ) {
          return;
        }

        const signedIn = document.cookie.includes("sb-");
        window.location.replace(
          buildConnectErrorRedirectPath(oauthError, { signedIn }),
        );
        return;
      }

      if (onAuthCallback) return;

      const url = new URL(href);
      const queryCode = url.searchParams.get("code");
      if (queryCode && pathname !== "/") {
        const next = url.searchParams.get("next") ?? consumeAuthNext();
        window.location.replace(buildAuthCallbackFromCode(queryCode, next));
        return;
      }

      if (pathname !== "/" || !hasOAuthSuccessParams(url)) return;

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      window.location.replace(consumeAuthNext());
    })();
  }, []);

  return null;
}
