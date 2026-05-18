"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-muted">
          Something went wrong loading this page.
        </p>
      </div>
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: "var(--error-border)",
          backgroundColor: "var(--error-bg)",
        }}
      >
        <h2 className="text-base font-medium text-error-text">Error</h2>
        <p className="mt-2 text-sm text-error-text/90">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-cyan-200/20 bg-[#08101f]/90 px-4 py-2.5 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
