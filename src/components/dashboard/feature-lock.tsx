import Link from "next/link";
import { type ReactNode } from "react";
import { IconCreditCard, IconLock } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Shared "blocked feature" primitives shown after a trial/subscription lapses.
 * These are presentation only — the real enforcement stays server-side in
 * `verifyFeatureAccess`. Callers pass a `locked` boolean derived from
 * `useAccessStatus().trialExpired`.
 */

/** Solid red call-to-action that routes to billing. */
export function SubscribeCta({
  className,
  label = "Subscribe",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href="/dashboard/billing"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <IconCreditCard className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

/** Inline red callout placed at the top of a locked section. */
export function FeatureLockedNotice({
  feature,
  className,
}: {
  feature: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <IconLock
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden
        />
        <p className="text-red-700 dark:text-red-300">
          <span className="font-semibold">{feature} — locked.</span> Your trial
          has ended. Subscribe to restore access.
        </p>
      </div>
      <SubscribeCta className="sm:self-center" />
    </div>
  );
}

/** Tiny red "Locked" pill for nav items and section headers. */
export function FeatureLockedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-300",
        className,
      )}
    >
      <IconLock className="h-3 w-3" aria-hidden />
      Locked
    </span>
  );
}

/**
 * Wraps interactive content. When `locked`, the content is dimmed, blurred and
 * made fully inert (React 19 `inert` — not focusable or interactive), with a
 * red lock card overlaid on top. When unlocked, children render untouched.
 */
export function FeatureLockOverlay({
  locked,
  feature,
  children,
  className,
}: {
  locked: boolean;
  feature: string;
  children: ReactNode;
  className?: string;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div
        inert={true}
        className="pointer-events-none select-none opacity-40 blur-[2px]"
      >
        {children}
      </div>
      <div
        role="alert"
        className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-500/5 p-4"
      >
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-red-500/40 bg-background/95 p-5 text-center shadow-lg backdrop-blur-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/40 bg-red-500/12 text-red-600 dark:text-red-400">
            <IconLock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {feature} locked
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your trial has ended. Subscribe to restore access.
            </p>
          </div>
          <SubscribeCta />
        </div>
      </div>
    </div>
  );
}
