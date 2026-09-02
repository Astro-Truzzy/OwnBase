"use client";

import { useState } from "react";
import { PLAN_DISPLAY } from "@/lib/plan-limits";
import type { PaystackPlanTier } from "@/lib/paystack-plans";
import { annualEffectiveMonthly, formatNgn, type BillingInterval } from "@/lib/pricing-tiers";
import { subscribeWithPaystackAction } from "./actions";

interface SubscribeButtonProps {
  planId: PaystackPlanTier;
  interval?: BillingInterval;
  label?: string;
  className?: string;
}

function defaultLabel(planId: PaystackPlanTier, interval: BillingInterval): string {
  const display = PLAN_DISPLAY[planId];
  if (!display) return `Subscribe ${planId}`;
  if (interval === "annual") {
    return `${display.name} — ${formatNgn(annualEffectiveMonthly(planId))}/mo billed yearly`;
  }
  return `${display.name} — ${display.priceLabel}`;
}

export function SubscribeButton({
  planId,
  interval = "monthly",
  label,
  className,
}: SubscribeButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    try {
      const result = await subscribeWithPaystackAction(planId, interval);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          className ??
          "rounded-lg border border-primary/40 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-50"
        }
      >
        {pending ? "Redirecting…" : (label ?? defaultLabel(planId, interval))}
      </button>
      {error && <p className="text-xs text-error-text">{error}</p>}
    </div>
  );
}
