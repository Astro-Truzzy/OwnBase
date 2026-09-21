import type { PlanHistoryRow } from "@/lib/admin/metrics";
import { PLAN_PRICE_NGN, formatNgn } from "@/lib/admin/metrics";

interface PlanBreakdownProps {
  history: PlanHistoryRow[];
  trialCount: number;
  starterCount: number;
  proCount: number;
  agencyCount: number;
  freeCount: number;
  /**
   * Revenue-view counts for the paid tiers. Comps hold a paid tier but pay
   * nothing, so the money sublabel is derived from these rather than the
   * entitlement counts above.
   */
  payingStarter: number;
  payingPro: number;
  payingAgency: number;
  compedCount: number;
}

function PlanBar({
  label,
  count,
  payingCount,
  total,
  color,
  price,
}: {
  label: string;
  count: number;
  /** Paying subset of `count`. Defaults to `count` for tiers with no comps. */
  payingCount?: number;
  total: number;
  color: string;
  price: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const paying = payingCount ?? count;
  // The bar itself is the plan population (entitlement view); only the money
  // figure drops comps. When the two differ, say so rather than showing a
  // count and an amount that don't reconcile.
  const compedInTier = price > 0 ? count - paying : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {count} users
          {price > 0 && (
            <span className="ml-2 text-xs">
              {compedInTier > 0 && `${paying} paying · `}({formatNgn(paying * price)}/mo)
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-muted-foreground">{pct}% of total</p>
    </div>
  );
}

export function PlanBreakdown({
  trialCount,
  starterCount,
  proCount,
  agencyCount,
  freeCount,
  payingStarter,
  payingPro,
  payingAgency,
  compedCount,
}: PlanBreakdownProps) {
  const total = trialCount + starterCount + proCount + agencyCount + freeCount;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-sm font-semibold text-foreground">Plan Distribution</p>
      <div className="space-y-4">
        <PlanBar
          label="Agency"
          count={agencyCount}
          payingCount={payingAgency}
          total={total}
          color="bg-fuchsia-500"
          price={PLAN_PRICE_NGN.agency}
        />
        <PlanBar
          label="Pro"
          count={proCount}
          payingCount={payingPro}
          total={total}
          color="bg-violet-500"
          price={PLAN_PRICE_NGN.pro}
        />
        <PlanBar
          label="Starter"
          count={starterCount}
          payingCount={payingStarter}
          total={total}
          color="bg-accent"
          price={PLAN_PRICE_NGN.starter}
        />
        <PlanBar
          label="Trial"
          count={trialCount}
          total={total}
          color="bg-amber-400"
          price={0}
        />
        <PlanBar
          label="Free"
          count={freeCount}
          total={total}
          color="bg-muted-foreground/40"
          price={0}
        />
      </div>
      {total > 0 && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {total} total accounts
          {/* Comps stay inside their tier's bar, so they are called out here
              instead of as a sixth bar — which would double-count them. */}
          {compedCount > 0 && ` · ${compedCount} comped`}
        </p>
      )}
    </div>
  );
}
