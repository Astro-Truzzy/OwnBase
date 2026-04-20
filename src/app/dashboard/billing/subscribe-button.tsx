"use client";

import { useState } from "react";
import { subscribeWithPaystackAction } from "./actions";

interface SubscribeButtonProps {
  planId: string;
  label?: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter — ₦9,999/mo",
  pro: "Pro — ₦24,999/mo",
};

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
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {pending ? "Redirecting…" : label ?? PLAN_LABELS[planId] ?? `Subscribe ${planId}`}
      </button>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
