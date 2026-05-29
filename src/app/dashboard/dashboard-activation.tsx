"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  IconChartBar,
  IconCheck,
  IconFolder,
  IconUpload,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import type { UsageSnapshot } from "@/lib/usage-stats";
import { dismissOnboardingChecklistAction } from "./onboarding-actions";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
}

interface DashboardActivationProps {
  usage: UsageSnapshot;
  onboardingSteps: OnboardingStep[];
  onboardingDismissed: boolean;
  allOnboardingDone: boolean;
}

function Meter({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number | null;
}) {
  const ratio =
    max == null || max <= 0 ? null : Math.min(100, (used / max) * 100);
  const toneClass =
    ratio == null
      ? ""
      : ratio >= 100
        ? "bg-red-500"
        : ratio >= 80
          ? "bg-amber-500"
          : "bg-linear-to-r from-cyan-400 to-violet-400";

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 tabular-nums text-foreground/85">
          {max == null ? `${used} (unlimited)` : `${used} / ${max}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/80">
        {ratio != null && (
          <div
            className={`h-full rounded-full transition-all ${toneClass}`}
            style={{ width: `${Math.min(100, ratio)}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function DashboardActivation({
  usage,
  onboardingSteps,
  onboardingDismissed,
  allOnboardingDone,
}: DashboardActivationProps) {
  const [pending, startTransition] = useTransition();

  const showChecklist =
    !onboardingDismissed && !allOnboardingDone && onboardingSteps.length > 0;

  return (
    <div className="mb-8 space-y-4">
      {(usage.anyAtHardLimit || usage.anyNearSoftLimit) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            usage.anyAtHardLimit
              ? "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200"
              : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
          }`}
        >
          <p className="font-medium text-foreground">
            {usage.anyAtHardLimit
              ? "You have reached a plan limit"
              : "You are close to a plan limit"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {usage.anyAtHardLimit
              ? "Upgrade to continue tracking repos, uploading projects, or generating AI summaries at full capacity."
              : "Consider upgrading soon to avoid interruptions."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/dashboard/billing"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 hover:no-underline"
            >
              Billing
            </Link>
            <Link
              href="/pricing"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 hover:no-underline"
            >
              View plans
            </Link>
          </div>
        </div>
      )}

      <div className="dash-usage-panel rounded-xl p-4 backdrop-blur-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <IconChartBar className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">
            Plan usage ({usage.plan})
          </h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <Meter
            label="Tracked repos"
            used={usage.trackedRepos}
            max={usage.limits.maxTrackedRepos}
          />
          <Meter
            label="Uploads"
            used={usage.uploads}
            max={usage.limits.maxUploads}
          />
          <Meter
            label="AI summaries (this month)"
            used={usage.aiSummariesThisMonth}
            max={usage.limits.maxAiSummariesPerMonth}
          />
        </div>
      </div>

      {showChecklist && (
        <div className="dash-usage-panel rounded-xl p-4 backdrop-blur-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Get started
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Complete these steps to get value from Ownbase quickly.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await dismissOnboardingChecklistAction();
                })
              }
              disabled={pending}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Dismiss checklist"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {onboardingSteps.map((step) => (
              <li key={step.id}>
                <Link
                  href={step.href}
                  className={`flex gap-3 rounded-lg border p-3 transition-colors ${
                    step.done
                      ? "border-border bg-muted/40 hover:bg-muted/60"
                      : "border-primary/25 bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      step.done
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {step.done ? (
                      <IconCheck className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <span className="sr-only">Not done</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {step.id === "track" && (
                        <IconFolder className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      {step.id === "upload" && (
                        <IconUpload className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      {step.id === "summary" && (
                        <IconSparkles className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
