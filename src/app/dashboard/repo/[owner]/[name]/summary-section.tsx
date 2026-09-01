"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiSummaryCard } from "@/components/dashboard/ai-summary-card";
import { ExecutiveSummaryBody } from "@/components/dashboard/executive-summary-body";
import { FeatureLockedNotice } from "@/components/dashboard/feature-lock";
import { SummaryFreshnessPill } from "@/components/dashboard/summary-freshness-pill";
import { SummaryHistoryPanel } from "@/components/dashboard/summary-history-panel";
import type { SummaryFreshness } from "@/lib/ai/insights-overview";
import { useAccessStatus } from "../../../access-status-context";
import { generateRepoSummary } from "../../actions";
import type { ExecutiveSummary } from "../../../../../lib/db/types";

interface SummarySectionProps {
  repoId: number;
  fullName: string;
  owner: string;
  name: string;
  initialSummary: ExecutiveSummary | null;
  summaryUpdatedAt: string | null;
  /** Freshness band, computed on the server to stay hydration-safe. */
  summaryBand: SummaryFreshness;
  summaryAgeDays: number | null;
}

export function SummarySection({
  repoId,
  fullName,
  owner,
  name,
  initialSummary,
  summaryUpdatedAt,
  summaryBand,
  summaryAgeDays,
}: SummarySectionProps) {
  const router = useRouter();
  const locked = useAccessStatus().trialExpired;
  const [loading, setLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(
    initialSummary,
  );
  /** Set once regenerated in this session, so the pill and timestamp update. */
  const [regeneratedAt, setRegeneratedAt] = useState<string | null>(null);

  const updatedAt = regeneratedAt ?? summaryUpdatedAt;
  const band: SummaryFreshness = regeneratedAt ? "fresh" : summaryBand;
  const ageDays = regeneratedAt ? 0 : summaryAgeDays;

  async function handleGenerate() {
    if (locked) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateRepoSummary(repoId, fullName);
      if (result.success && result.summary) {
        setSummary(result.summary);
        setRegeneratedAt(new Date().toISOString());
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
      const res = await fetch(
        `/api/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/handoff-brief`,
      );
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
    <section
      id="summary"
      className="dash-panel scroll-mt-[calc(64px+0.75rem)] p-6 sm:scroll-mt-[calc(56px+0.75rem)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-medium text-foreground">Overview</h2>
          {summary && (
            <SummaryFreshnessPill freshness={band} ageDays={ageDays} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summary && <SummaryHistoryPanel fullName={fullName} />}
          {summary && (
            <button
              type="button"
              onClick={handleGenerateHandoffBrief}
              disabled={handoffLoading}
              className="rounded-lg border border-border dash-surface-inset px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              {handoffLoading ? "Generating PDF…" : "Export handoff brief"}
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || locked}
            className="rounded-lg border border-primary/35 bg-linear-to-r from-cyan-500/90 to-violet-600/85 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(34,211,238,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            {loading
              ? "Generating…"
              : summary
                ? "Regenerate"
                : "Generate overview"}
          </button>
        </div>
      </div>

      {locked && <FeatureLockedNotice feature="AI overview" className="mt-6" />}

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
          <div className="h-4 w-full animate-pulse rounded bg-cyan-200/10" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-cyan-200/10" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-cyan-200/10" />
          <div className="pt-4">
            <div className="h-4 w-32 animate-pulse rounded bg-cyan-200/10" />
            <ul className="mt-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="h-4 w-full max-w-md animate-pulse rounded bg-cyan-200/10"
                />
              ))}
            </ul>
          </div>
        </div>
      )}

      {!loading && summary && (
        <AiSummaryCard
          className="mt-8"
          title="Codebase overview"
          meta={
            updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}`
              : undefined
          }
        >
          <ExecutiveSummaryBody summary={summary} />
        </AiSummaryCard>
      )}

      {!loading && !summary && !error && (
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Generate a plain-language overview of what this project does, its main
          parts, payments, access, and things to watch.
        </p>
      )}
    </section>
  );
}
