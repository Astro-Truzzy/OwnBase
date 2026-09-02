import type { SupabaseClient } from "@supabase/supabase-js";

export interface AccessStatus {
  hasActiveSubscription: boolean;
  onTrial: boolean;
  trialExpired: boolean;
  hasLegacyUnlimitedAccess: boolean;
  plan: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

export interface FeatureGateResult {
  allowed: boolean;
  error?: string;
  status: AccessStatus;
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeAccessStatus(
  profile: {
    plan?: string | null;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
  },
  now: Date = new Date()
): AccessStatus {
  const trialEndsAtDate = toDate(profile.trial_ends_at);
  const subscriptionEndsAtDate = toDate(profile.subscription_ends_at);
  const hasActiveSubscription =
    subscriptionEndsAtDate != null && subscriptionEndsAtDate > now;
  const onTrial = trialEndsAtDate != null && trialEndsAtDate > now;
  const hasLegacyUnlimitedAccess = trialEndsAtDate == null;
  const trialExpired =
    trialEndsAtDate != null && trialEndsAtDate <= now && !hasActiveSubscription;

  return {
    hasActiveSubscription,
    onTrial,
    trialExpired,
    hasLegacyUnlimitedAccess,
    plan: profile.plan ?? "trial",
    trialEndsAt: profile.trial_ends_at ?? null,
    subscriptionEndsAt: profile.subscription_ends_at ?? null,
  };
}

/**
 * Confirms the profile is readable and returns its access status. Every
 * account has at least the permanent Free tier, so this no longer blocks on
 * trial/subscription expiry — per-resource caps (repos, seats, uploads, AI
 * summaries; see plan-limits.ts) are what actually gate a Free-tier account.
 * `featureLabel` is accepted for API stability with existing call sites.
 */
export async function verifyFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  featureLabel: string
): Promise<FeatureGateResult> {
  void featureLabel;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at, subscription_ends_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      allowed: false,
      error: "Could not verify subscription status. Please try again.",
      status: computeAccessStatus({}),
    };
  }

  return { allowed: true, status: computeAccessStatus(profile ?? {}) };
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** Reminder appears at/under this much time remaining. */
export const REMINDER_WINDOW_MS = 7 * DAY_MS;
/** Amber "warning" tone at/under this much time remaining. */
export const WARNING_WINDOW_MS = 3 * DAY_MS;
/** Red "urgent" live countdown at/under this much time remaining (final day). */
export const URGENT_WINDOW_MS = 1 * DAY_MS;

/**
 * Escalating urgency for the access countdown:
 * - active:   > 7 days left (or legacy-unlimited) — nothing shown
 * - reminder: 3–7 days left
 * - warning:  1–3 days left
 * - urgent:   final day (live countdown)
 * - expired:  access has lapsed (features locked)
 */
export type AccessPhase =
  | "active"
  | "reminder"
  | "warning"
  | "urgent"
  | "expired";

export interface AccessCountdown {
  phase: AccessPhase;
  /** Which boundary the countdown targets, or null when nothing is shown. */
  kind: "trial" | "subscription" | null;
  /** ISO date of the relevant boundary, or null. */
  expiresAt: string | null;
  /** Milliseconds until the boundary (0 once reached), or null when not shown. */
  msRemaining: number | null;
  /** Whole days remaining, rounded up, or null. */
  daysRemaining: number | null;
  /** Whole hours remaining, rounded up, or null. */
  hoursRemaining: number | null;
}

/**
 * Pure: turns an AccessStatus into an escalating countdown for the UI.
 * `now` is injected so this stays deterministic and testable, and so the
 * countdown banner can re-evaluate on a live client clock.
 *
 * Counts down to the paid subscription period end when subscribed, otherwise
 * to the trial end. Legacy-unlimited users (no trial ever set) always resolve
 * to "active" so they are never reminded or locked.
 */
export function computeAccessCountdown(
  status: AccessStatus,
  now: Date = new Date()
): AccessCountdown {
  const none: AccessCountdown = {
    phase: "active",
    kind: null,
    expiresAt: null,
    msRemaining: null,
    daysRemaining: null,
    hoursRemaining: null,
  };

  if (status.hasLegacyUnlimitedAccess) return none;

  if (status.trialExpired) {
    return {
      phase: "expired",
      kind: "trial",
      expiresAt: status.trialEndsAt,
      msRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
    };
  }

  const kind: "trial" | "subscription" | null = status.hasActiveSubscription
    ? "subscription"
    : status.onTrial
      ? "trial"
      : null;
  const boundaryIso = status.hasActiveSubscription
    ? status.subscriptionEndsAt
    : status.onTrial
      ? status.trialEndsAt
      : null;

  if (!kind || !boundaryIso) return none;

  const boundary = toDate(boundaryIso);
  if (!boundary) return none;

  const msRemaining = boundary.getTime() - now.getTime();

  // Boundary just crossed on the live client clock but the server-computed
  // status hasn't refreshed yet — show the urgent state rather than lock early.
  if (msRemaining <= 0) {
    return {
      phase: "urgent",
      kind,
      expiresAt: boundaryIso,
      msRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
    };
  }

  let phase: AccessPhase;
  if (msRemaining > REMINDER_WINDOW_MS) phase = "active";
  else if (msRemaining > WARNING_WINDOW_MS) phase = "reminder";
  else if (msRemaining > URGENT_WINDOW_MS) phase = "warning";
  else phase = "urgent";

  return {
    phase,
    kind,
    expiresAt: boundaryIso,
    msRemaining,
    daysRemaining: Math.ceil(msRemaining / DAY_MS),
    hoursRemaining: Math.ceil(msRemaining / HOUR_MS),
  };
}
