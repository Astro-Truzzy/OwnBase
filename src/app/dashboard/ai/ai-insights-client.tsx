"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconClock,
  IconLoader2,
  IconMessageCircle,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { AiSummaryCard } from "@/components/dashboard/ai-summary-card";
import { ExecutiveSummaryBody } from "@/components/dashboard/executive-summary-body";
import { FeatureLockedNotice } from "@/components/dashboard/feature-lock";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SummaryFreshnessPill } from "@/components/dashboard/summary-freshness-pill";
import { SummaryHistoryPanel } from "@/components/dashboard/summary-history-panel";
import type {
  AiInsightRepo,
  AiInsightsOverview,
  SummaryFreshness,
} from "@/lib/ai/insights-overview";
import type { ExecutiveSummary } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { useAccessStatus } from "../access-status-context";
import { generateSummaryForTrackedRepo } from "./actions";
import { AiAssistantClient } from "./ai-assistant-client";

type TrackedRepoRow = {
  full_name: string;
  repo_name: string;
  repo_owner: string;
};

/** A summary generated in this session, shown before the server data refreshes. */
type LocalResult = { summary: ExecutiveSummary; updatedAt: string };

interface AiInsightsClientProps {
  overview: AiInsightsOverview;
  chatRepos: TrackedRepoRow[];
}

export function AiInsightsClient({ overview, chatRepos }: AiInsightsClientProps) {
  const router = useRouter();
  const locked = useAccessStatus().trialExpired;
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, LocalResult>>({});

  const quotaReached = overview.atMonthlyLimit;

  async function handleGenerate(repo: AiInsightRepo) {
    if (locked || !repo.generatable || busy) return;
    setBusy(repo.fullName);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[repo.fullName];
      return next;
    });
    try {
      const result = await generateSummaryForTrackedRepo(repo.fullName);
      if (result.success && result.summary) {
        setResults((prev) => ({
          ...prev,
          [repo.fullName]: {
            summary: result.summary as ExecutiveSummary,
            updatedAt: new Date().toISOString(),
          },
        }));
        setExpanded(repo.fullName);
        startTransition(() => router.refresh());
      } else {
        setErrors((prev) => ({
          ...prev,
          [repo.fullName]: result.error ?? "Failed to generate summary.",
        }));
      }
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [repo.fullName]:
          e instanceof Error ? e.message : "Something went wrong.",
      }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      <section aria-label="Summary coverage" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Summary coverage"
            value={
              overview.summarizableCount === 0
                ? "—"
                : `${overview.summarizedCount}/${overview.summarizableCount}`
            }
            hint={
              overview.coveragePct === null
                ? "No GitHub repositories tracked yet."
                : `${overview.coveragePct}% of tracked GitHub repos summarized.`
            }
            icon={IconSparkles}
            tone="ai"
          />
          <MetricCard
            label="Needs refresh"
            value={overview.needsRefreshCount}
            hint="Summaries older than 90 days."
            icon={IconClock}
            tone={overview.needsRefreshCount > 0 ? "warning" : "default"}
          />
          <MetricCard
            label="No summary yet"
            value={overview.missingCount}
            hint="Tracked repos with nothing on file."
            icon={IconAlertTriangle}
            tone={overview.missingCount > 0 ? "danger" : "default"}
          />
          <MetricCard
            label="Used this month"
            value={`${overview.usedThisMonth}/${overview.monthlyLimit}`}
            hint={
              quotaReached
                ? "Monthly limit reached on your plan."
                : `${overview.remainingThisMonth} left on your plan.`
            }
            icon={IconRefresh}
            tone={quotaReached ? "warning" : "default"}
            footer={
              quotaReached ? (
                <Link
                  href="/dashboard/billing"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Upgrade for more
                </Link>
              ) : null
            }
          />
        </div>
        <p className="text-sm text-muted-foreground">{overview.headline}</p>
      </section>

      <section aria-label="Repository insights" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Repository insights
          </h2>
          <Link
            href="/dashboard/organization"
            className="text-xs font-medium text-primary hover:underline"
          >
            Manage tracked repos
          </Link>
        </div>

        {locked && <FeatureLockedNotice feature="AI codebase summaries" />}

        {overview.repos.length === 0 ? (
          <p className="rounded-xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground">
            No repositories tracked yet. Add one under{" "}
            <Link
              href="/dashboard/organization"
              className="text-primary underline-offset-2 hover:underline"
            >
              Organization
            </Link>{" "}
            to generate codebase insights.
          </p>
        ) : (
          <ul className="space-y-3">
            {overview.repos.map((repo) => {
              const local = results[repo.fullName];
              const summary = local?.summary ?? repo.summary;
              const updatedAt = local?.updatedAt ?? repo.updatedAt;
              const freshness: SummaryFreshness = local
                ? "fresh"
                : repo.freshness;
              const ageDays = local ? 0 : repo.ageDays;
              const isOpen = expanded === repo.fullName;
              const isBusy = busy === repo.fullName;
              const error = errors[repo.fullName];
              const disabled =
                locked || !repo.generatable || isBusy || quotaReached;

              return (
                <li
                  key={repo.fullName}
                  className="rounded-xl border border-border/70 bg-card/90"
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                        <span className="truncate font-medium text-foreground">
                          {repo.label}
                        </span>
                        <SummaryFreshnessPill
                          freshness={freshness}
                          ageDays={ageDays}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {repo.unavailableReason
                          ? repo.unavailableReason
                          : updatedAt
                            ? `Last generated ${new Date(updatedAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}`
                            : "Generate a plain-language overview of what this project does, its main parts, and what to watch."}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {summary && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(isOpen ? null : repo.fullName)
                          }
                          aria-expanded={isOpen}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <IconChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isOpen && "rotate-180",
                            )}
                            aria-hidden
                          />
                          {isOpen ? "Hide summary" : "View summary"}
                        </button>
                      )}
                      {repo.generatable ? (
                        <button
                          type="button"
                          onClick={() => void handleGenerate(repo)}
                          disabled={disabled}
                          title={
                            quotaReached
                              ? "Monthly AI summary limit reached on your plan."
                              : undefined
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-ai-border bg-accent-ai-subtle px-3 py-2 text-sm font-semibold text-accent-ai transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {isBusy ? (
                            <IconLoader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <IconSparkles className="h-4 w-4" aria-hidden />
                          )}
                          {isBusy
                            ? "Generating…"
                            : summary
                              ? "Regenerate"
                              : "Generate"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="border-t border-border/60 px-4 py-3 text-sm text-error-text sm:px-5"
                    >
                      {error}
                    </p>
                  )}

                  {isOpen && summary && (
                    <div className="space-y-3 border-t border-border/60 p-4 sm:p-5">
                      <SummaryHistoryPanel fullName={repo.fullName} />
                      <AiSummaryCard
                        title={`${repo.label} — codebase summary`}
                        meta={
                          updatedAt
                            ? `Generated ${new Date(updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}`
                            : undefined
                        }
                        actions={
                          <Link
                            href={`/dashboard/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}#summary`}
                            className="text-xs font-medium text-accent-ai hover:underline"
                          >
                            Open repo
                          </Link>
                        }
                      >
                        <ExecutiveSummaryBody summary={summary} showExtended />
                      </AiSummaryCard>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Ask AI" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <IconMessageCircle className="h-5 w-5 text-accent-ai" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">
            Ask about a codebase
          </h2>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse files in a tracked repository and ask questions with the files
          you pick as context. Grounded in the files you attach — not the
          summaries above.
        </p>
        <AiAssistantClient initialRepos={chatRepos} />
      </section>
    </div>
  );
}
