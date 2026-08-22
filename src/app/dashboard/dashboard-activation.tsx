"use client";

import Link from "next/link";
import { useTransition } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";
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
  showChecklist: boolean;
}

export function DashboardActivation({
  usage,
  onboardingSteps,
  showChecklist,
}: DashboardActivationProps) {
  const [pending, startTransition] = useTransition();
  const showLimitBanner = usage.anyAtHardLimit || usage.anyNearSoftLimit;

  if (!showLimitBanner && !showChecklist) {
    return null;
  }

  return (
    <div className="space-y-8">
      {showLimitBanner && (
        <div className="border-y border-border py-4">
          <p className="text-sm font-medium text-foreground">
            {usage.anyAtHardLimit
              ? "You have reached a plan limit"
              : "You are close to a plan limit"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {usage.anyAtHardLimit
              ? "Upgrade to keep tracking repos, uploading projects, and generating summaries."
              : "Consider upgrading soon to avoid interruptions."}{" "}
            <Link
              href="/dashboard/billing"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Billing
            </Link>
            <span aria-hidden> · </span>
            <Link
              href="/pricing"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              View plans
            </Link>
          </p>
        </div>
      )}

      {showChecklist && (
        <section
          data-tour="onboarding-checklist"
          aria-labelledby="onboarding-heading"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2
              id="onboarding-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              Get started
            </h2>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await dismissOnboardingChecklistAction();
                })
              }
              disabled={pending}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Dismiss checklist"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {onboardingSteps.map((step) => (
              <li key={step.id} className="list-none">
                <Link
                  href={step.href}
                  className="flex items-start gap-3 py-2.5 transition hover:bg-muted/60 sm:px-2"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center ${
                      step.done
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    <IconCheck className="h-4 w-4" aria-hidden />
                    <span className="sr-only">
                      {step.done ? "Done" : "Not done"}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
