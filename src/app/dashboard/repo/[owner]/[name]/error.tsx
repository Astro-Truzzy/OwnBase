"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RepoDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Repo detail error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-muted hover:text-foreground transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded px-1 -ml-1"
      >
        ← Back to dashboard
      </Link>
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: "var(--error-border)",
          backgroundColor: "var(--error-bg)",
        }}
      >
        <h2 className="text-base font-medium text-error-text">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-error-text/90">
          {error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
