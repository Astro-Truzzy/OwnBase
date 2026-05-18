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
        className="rounded-lg border border-cyan-300/35 bg-linear-to-r from-cyan-500/90 to-violet-600/85 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(34,211,238,0.2)] transition hover:brightness-110 disabled:opacity-50"
      >
        {pending
          ? "Redirecting…"
          : (label ?? PLAN_LABELS[planId] ?? `Subscribe ${planId}`)}
      </button>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
