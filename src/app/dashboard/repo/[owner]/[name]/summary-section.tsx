"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRepoSummary } from "../../actions";
import type { ExecutiveSummary } from "../../../../../lib/db/types";

interface SummarySectionProps {
  repoId: number;
  fullName: string;
  owner: string;
  name: string;
  initialSummary: ExecutiveSummary | null;
  summaryUpdatedAt: string | null;
}

export function SummarySection({
  repoId,
  fullName,
  owner,
  name,
  initialSummary,
  summaryUpdatedAt,
}: SummarySectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(initialSummary);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateRepoSummary(repoId, fullName);
      if (result.success && result.summary) {
        setSummary(result.summary);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to generate summary.");
        if (result.summary) setSummary(result.summary);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateHandoffBrief() {
    if (!summary) return;
    setHandoffLoading(true);
    try {
      const res = await fetch(`/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/handoff-brief`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to generate handoff brief.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `handoff-brief-${owner}-${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download PDF.");
    } finally {
      setHandoffLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">
          Overview
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {summary && (
            <button
              type="button"
              onClick={handleGenerateHandoffBrief}
              disabled={handoffLoading}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              {handoffLoading ? "Generating PDF…" : "Export handoff brief"}
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            {loading ? "Generating…" : summary ? "Regenerate" : "Generate overview"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mt-6 rounded-lg border p-4"
          style={{
            borderColor: "var(--error-border)",
            backgroundColor: "var(--error-bg)",
          }}
        >
          <p className="text-sm text-error-text">{error}</p>
        </div>
      )}

      {loading && !summary && (
        <div className="mt-8 space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-border" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-border" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-border" />
          <div className="pt-4">
            <div className="h-4 w-32 animate-pulse rounded bg-border" />
            <ul className="mt-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="h-4 w-full max-w-md animate-pulse rounded bg-border"
                />
              ))}
            </ul>
          </div>
        </div>
      )}

      {!loading && summary && (
        <div className="mt-8 space-y-8 text-sm">
          <div>
            <p className="text-foreground leading-relaxed">
              {summary.summary}
            </p>
            {summaryUpdatedAt && (
              <p className="mt-3 text-xs text-muted">
                Last updated{" "}
                {new Date(summaryUpdatedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>

          {summary.keyComponents.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground">
                Main parts
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {summary.keyComponents.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.paymentIntegrations.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground">
                Payments
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {summary.paymentIntegrations.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.authentication.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground">
                Sign-in & access
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {summary.authentication.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.externalServices.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground">
                External services
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                {summary.externalServices.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.riskIndicators.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground">
                Things to watch
              </h3>
              <ul className="mt-2 list-disc space-y-1 text-amber-200/90">
                {summary.riskIndicators.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!loading && !summary && !error && (
        <p className="mt-6 text-sm text-muted leading-relaxed">
          Generate a plain-language overview of what this project does, its main
          parts, payments, access, and things to watch.
        </p>
      )}
    </section>
  );
}
