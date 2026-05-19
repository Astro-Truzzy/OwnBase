"use client";

import { useEffect } from "react";
import {
  buildConnectErrorRedirectPath,
  readOAuthErrorFromUrl,
} from "@/lib/auth/connect-errors";

/**
 * Supabase sends failed OAuth/link flows to Site URL (often `/`) with error params
 * in the query or hash. This moves users back to dashboard/login with a readable code.
 */
export function OAuthErrorRecovery() {
  useEffect(() => {
    const code = readOAuthErrorFromUrl(window.location.href);
    if (!code) return;

    const onDashboardOrAuth =
      window.location.pathname.startsWith("/dashboard") ||
      window.location.pathname.startsWith("/login") ||
      window.location.pathname.startsWith("/auth/callback");

    if (onDashboardOrAuth && window.location.search.includes("connect_error")) {
      return;
    }

    const signedIn = document.cookie.includes("sb-");
    const target = buildConnectErrorRedirectPath(code, { signedIn });
    window.location.replace(target);
  }, []);

  return null;
}
