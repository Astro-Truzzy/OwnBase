"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AccessStatus } from "@/lib/subscription-access";

const AccessStatusContext = createContext<AccessStatus | null>(null);

/**
 * Seeds client components with the access state the dashboard layout already
 * computed server-side, so gated feature UIs can show locks/countdowns without
 * refetching the profile on every page.
 */
export function AccessStatusProvider({
  value,
  children,
}: {
  value: AccessStatus;
  children: ReactNode;
}) {
  return (
    <AccessStatusContext.Provider value={value}>
      {children}
    </AccessStatusContext.Provider>
  );
}

/**
 * Access state for the current user. Falls back to an unrestricted state when
 * used outside the provider so feature components never lock by accident.
 */
export function useAccessStatus(): AccessStatus {
  const ctx = useContext(AccessStatusContext);
  if (!ctx) {
    return {
      hasActiveSubscription: false,
      onTrial: false,
      trialExpired: false,
      hasLegacyUnlimitedAccess: true,
      plan: "trial",
      trialEndsAt: null,
      subscriptionEndsAt: null,
    };
  }
  return ctx;
}

/** Convenience: true when the trial/subscription has lapsed and gated features are blocked. */
export function useIsLocked(): boolean {
  return useAccessStatus().trialExpired;
}
