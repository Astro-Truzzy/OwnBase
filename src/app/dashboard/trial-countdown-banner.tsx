"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  IconAlertTriangle,
  IconClock,
  IconLock,
  IconX,
} from "@tabler/icons-react";
import {
  computeAccessCountdown,
  type AccessCountdown,
  type AccessPhase,
} from "@/lib/subscription-access";
import { cn } from "@/lib/utils";
import { useAccessStatus } from "./access-status-context";

const STORAGE_KEY = "ownbase:access-banner-dismissed";

/** How long a dismissal sticks before the banner reappears, per phase. */
const REAPPEAR_MS: Partial<Record<AccessPhase, number>> = {
  reminder: 24 * 60 * 60 * 1000,
  warning: 6 * 60 * 60 * 1000,
};

type Dismissal = { phase: AccessPhase; at: number };

function readDismissal(): Dismissal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Dismissal;
    if (
      parsed &&
      typeof parsed.at === "number" &&
      typeof parsed.phase === "string"
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "3d 04h 12m" for multi-day, "04h 12m 09s" on the final day. */
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

type Tone = {
  container: string;
  icon: string;
  cta: string;
};

const TONES: Record<Exclude<AccessPhase, "active">, Tone> = {
  reminder: {
    container: "border-primary/30 bg-primary/10 text-foreground",
    icon: "text-primary",
    cta: "font-semibold text-primary underline underline-offset-2 hover:text-primary/80",
  },
  warning: {
    container:
      "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    cta: "font-semibold text-amber-800 underline underline-offset-2 hover:opacity-80 dark:text-amber-200",
  },
  urgent: {
    container:
      "border-red-500/50 bg-red-500/12 text-red-900 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    cta: "rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-500",
  },
  expired: {
    container:
      "border-red-500/60 bg-red-600/15 text-red-900 dark:text-red-100",
    icon: "text-red-600 dark:text-red-400",
    cta: "rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-500",
  },
};

function buildMessage(countdown: AccessCountdown): {
  lead: string;
  sub?: string;
} {
  const noun = countdown.kind === "subscription" ? "subscription" : "free trial";
  switch (countdown.phase) {
    case "reminder":
    case "warning": {
      const days = countdown.daysRemaining ?? 0;
      return {
        lead: `Your ${noun} ends in ${days} day${days === 1 ? "" : "s"}.`,
        sub: "Subscribe to keep full access.",
      };
    }
    case "urgent":
      return {
        lead: `Your ${noun} ends in ${formatCountdown(countdown.msRemaining ?? 0)}.`,
        sub: "Subscribe now to avoid losing access.",
      };
    case "expired":
      return {
        lead: "Your free trial has ended — you're now on the Free plan.",
        sub: "Upgrade for more repos, seats, and AI summaries.",
      };
    default:
      return { lead: "" };
  }
}

/**
 * Global escalating banner shown as the trial/subscription boundary approaches.
 * Consumes the layout-seeded access status, re-evaluates the phase on a live
 * client clock, and grows louder as expiry nears (calm reminder → amber warning
 * → red live countdown on the last day → persistent red "locked" state).
 */
export function TrialCountdownBanner() {
  const status = useAccessStatus();
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState<Date | null>(null);
  const [dismissal, setDismissal] = useState<Dismissal | null>(null);

  // Defer the clock to the client so we never flash a banner during SSR/hydration.
  useEffect(() => {
    setNow(new Date());
    setDismissal(readDismissal());
  }, []);

  const countdown = now ? computeAccessCountdown(status, now) : null;
  const phase = countdown?.phase ?? "active";
  const tickMs = phase === "urgent" ? 1000 : 30000;

  // Re-tick so the phase escalates and the final-day counter stays live.
  useEffect(() => {
    if (phase === "active") return;
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [phase, tickMs]);

  const dismiss = useCallback(() => {
    if (!phase || phase === "active") return;
    const record: Dismissal = { phase, at: new Date().getTime() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // ignore storage failures — banner just stays visible
    }
    setDismissal(record);
  }, [phase]);

  if (!countdown || phase === "active") return null;

  const canDismiss = phase === "reminder" || phase === "warning";
  const suppressed =
    canDismiss &&
    dismissal?.phase === phase &&
    now != null &&
    now.getTime() - dismissal.at < (REAPPEAR_MS[phase] ?? 0);
  if (suppressed) return null;

  const tone = TONES[phase];
  const message = buildMessage(countdown);
  const Icon =
    phase === "expired"
      ? IconLock
      : phase === "reminder"
        ? IconClock
        : IconAlertTriangle;
  const assertive = phase === "urgent" || phase === "expired";

  return (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className={cn("border-b px-4 py-2 text-sm", tone.container)}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2 text-center">
          {phase === "urgent" && !reduceMotion && (
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
          <Icon className={cn("h-4 w-4 shrink-0", tone.icon)} aria-hidden />
          <span className="tabular-nums">
            <span className="font-semibold">{message.lead}</span>
            {message.sub && (
              <span className="ml-1 opacity-90">{message.sub}</span>
            )}
          </span>
        </span>
        <Link
          href="/dashboard/billing"
          className={cn("inline-flex items-center transition", tone.cta)}
        >
          Subscribe now
        </Link>
        {canDismiss && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss reminder"
            className="rounded p-1 opacity-70 transition hover:opacity-100"
          >
            <IconX className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
