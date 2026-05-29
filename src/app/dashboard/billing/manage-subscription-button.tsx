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
        className="dash-btn-secondary inline-flex w-fit items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Opening…" : "Open Paystack subscription management →"}
      </button>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
