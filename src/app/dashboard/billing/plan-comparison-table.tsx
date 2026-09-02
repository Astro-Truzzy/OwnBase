"use client";

import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  formatLimit,
  getLimitsForPlan,
  PLAN_DISPLAY,
  type PlanTier,
} from "@/lib/plan-limits";
import {
  annualEffectiveMonthly,
  formatNgn,
  TIER_ANNUAL_PRICE_NGN,
  ENTERPRISE_CONTACT_HREF,
  type BillingInterval,
} from "@/lib/pricing-tiers";
import { cn } from "@/lib/utils";
import { SubscribeButton } from "./subscribe-button";

const PAID_TIERS = ["starter", "pro", "agency"] as const;

/**
 * Every plan gets the full dashboard — Team & Access, Continuity, the
 * unified Activity Log, and AI Codebase Insights are not tier-gated in this
 * codebase, only their usage quotas are. Listed here so the comparison isn't
 * just three numbers with nothing else to look at.
 */
const SHARED_FEATURES = [
  "Team & Access permission matrix",
  "Continuity & Offboarding Center",
  "Unified Activity & Audit Log",
  "AI Codebase Insights — summaries, Q&A, and version history",
];

export function PlanComparisonTable({
  currentPlan,
  canSubscribe,
}: {
  currentPlan: PlanTier;
  canSubscribe: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div className="dash-panel p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Compare plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every plan includes the full dashboard. Plans differ only in how much
            you can track and generate each month.
          </p>
        </div>
        <div
          role="group"
          aria-label="Billing interval"
          className="inline-flex shrink-0 rounded-lg border border-border/70 bg-card/60 p-0.5"
        >
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              interval === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              interval === "annual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Annual — save 2 months
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PAID_TIERS.map((tier) => {
          const limits = getLimitsForPlan(tier);
          const display = PLAN_DISPLAY[tier];
          const isCurrent = currentPlan === tier;
          const priceLabel =
            interval === "annual"
              ? `${formatNgn(annualEffectiveMonthly(tier))}/mo`
              : display.priceLabel;
          const subLabel =
            interval === "annual"
              ? `${formatNgn(TIER_ANNUAL_PRICE_NGN[tier]!)}/yr billed upfront`
              : "billed monthly";

          return (
            <div
              key={tier}
              className={cn(
                "flex flex-col rounded-xl border p-5",
                isCurrent
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/70 bg-card/90",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">
                  {display.name}
                </h3>
                {isCurrent && <StatusPill tone="info">Current plan</StatusPill>}
              </div>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {priceLabel}
              </p>
              <p className="text-xs text-muted-foreground">{subLabel}</p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <IconCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  <span>{limits.maxTrackedRepos} tracked repositories</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  <span>{limits.maxSeats} seats</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  <span>{formatLimit(limits.maxUploads)} project uploads</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-success"
                    aria-hidden
                  />
                  <span>
                    {formatLimit(limits.maxAiSummariesPerMonth)} AI summaries /
                    month
                  </span>
                </li>
                {SHARED_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <IconCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && canSubscribe && (
                <div className="mt-5">
                  <SubscribeButton planId={tier} interval={interval} className="w-full rounded-lg border border-primary/40 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-50" />
                </div>
              )}
            </div>
          );
        })}

        {/* Enterprise — always contact sales, not a self-serve checkout */}
        <div className="flex flex-col rounded-xl border border-border/70 bg-card/90 p-5">
          <h3 className="font-semibold text-foreground">Enterprise</h3>
          <p className="mt-1 text-2xl font-semibold text-foreground">Custom</p>
          <p className="text-xs text-muted-foreground">
            Starting at {formatNgn(65_000)}/mo
          </p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <span>Unlimited repositories & seats</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <span>SSO & SAML</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <span>24/7 dedicated support + success manager</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <span>Guaranteed uptime & response-time SLA</span>
            </li>
          </ul>
          <a
            href={ENTERPRISE_CONTACT_HREF}
            className="mt-5 flex w-full items-center justify-center rounded-lg border border-border bg-background py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 dark:bg-surface/50"
          >
            Contact sales
          </a>
        </div>
      </div>
    </div>
  );
}
