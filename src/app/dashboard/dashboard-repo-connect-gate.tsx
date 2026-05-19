"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getConnectErrorMessage } from "@/lib/auth/connect-errors";
import { DashboardRepoConnectPrompt } from "./dashboard-repo-connect-prompt";

const SETUP_PATH_PREFIXES = ["/dashboard/upload", "/dashboard/organization"];

function isSetupPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return SETUP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

interface DashboardRepoConnectGateProps {
  hasConnectedRepo: boolean;
  walkthroughCompleted: boolean;
}

export function DashboardRepoConnectGate({
  hasConnectedRepo,
  walkthroughCompleted,
}: DashboardRepoConnectGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deferredReady, setDeferredReady] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("connect_error");
    if (!code) return;

    setOauthError(getConnectErrorMessage(code));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("connect_error");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (!walkthroughCompleted || hasConnectedRepo) return;
    const t = window.setTimeout(() => setDeferredReady(true), 400);
    return () => window.clearTimeout(t);
  }, [walkthroughCompleted, hasConnectedRepo]);

  const shouldShow =
    !hasConnectedRepo && walkthroughCompleted && deferredReady;

  return (
    <DashboardRepoConnectPrompt
      open={shouldShow}
      variant={isSetupPath(pathname) ? "banner" : "modal"}
      oauthError={oauthError}
    />
  );
}
