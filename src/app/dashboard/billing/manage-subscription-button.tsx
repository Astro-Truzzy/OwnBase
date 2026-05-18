"use client";

import { useState } from "react";
import { getManageLinkAction } from "./actions";

export function ManageSubscriptionButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    try {
      const result = await getManageLinkAction();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (result.link) {
        window.open(result.link, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-cyan-200/20 bg-[#050b16]/80 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e] disabled:opacity-50"
      >
        {pending ? "Opening…" : "Open Paystack subscription management →"}
      </button>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
