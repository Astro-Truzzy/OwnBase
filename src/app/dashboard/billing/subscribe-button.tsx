"use client";

import { useState } from "react";
import { PLAN_DISPLAY } from "@/lib/plan-limits";
import { subscribeWithPaystackAction } from "./actions";

interface SubscribeButtonProps {
  planId: string;
  label?: string;
}

function defaultLabel(planId: string): string {
  const display =
    planId === "starter" || planId === "pro" ? PLAN_DISPLAY[planId] : null;
  return display ? `${display.name} — ${display.priceLabel}` : `Subscribe ${planId}`;
}

export function SubscribeButton({ planId, label }: SubscribeButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    try {
      const result = await subscribeWithPaystackAction(planId);
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
        className="rounded-lg border border-primary/40 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-50"
      >
        {pending ? "Redirecting…" : (label ?? defaultLabel(planId))}
      </button>
      {error && <p className="text-xs text-error-text">{error}</p>}
    </div>
  );
}
