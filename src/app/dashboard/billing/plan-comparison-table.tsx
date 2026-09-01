import { IconCheck } from "@tabler/icons-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  formatLimit,
  getLimitsForPlan,
  PLAN_DISPLAY,
  type PlanTier,
} from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

const PAID_TIERS = ["starter", "pro"] as const;

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
}: {
  currentPlan: PlanTier;
}) {
  return (
    <div className="dash-panel p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-foreground">Compare plans</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every plan includes the full dashboard. Plans differ only in how much
        you can track and generate each month.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PAID_TIERS.map((tier) => {
          const limits = getLimitsForPlan(tier);
          const display = PLAN_DISPLAY[tier];
          const isCurrent = currentPlan === tier;

          return (
            <div
              key={tier}
              className={cn(
                "rounded-xl border p-5",
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
                {display.priceLabel}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
