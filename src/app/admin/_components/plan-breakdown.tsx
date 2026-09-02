import type { PlanHistoryRow } from "@/lib/admin/metrics";
import { PLAN_PRICE_NGN, formatNgn } from "@/lib/admin/metrics";

interface PlanBreakdownProps {
  history: PlanHistoryRow[];
  trialCount: number;
  starterCount: number;
  proCount: number;
  agencyCount: number;
  freeCount: number;
}

function PlanBar({
  label,
  count,
  total,
  color,
  price,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  price: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {count} users
          {price > 0 && <span className="ml-2 text-xs">({formatNgn(count * price)}/mo)</span>}
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
}: PlanBreakdownProps) {
  const total = trialCount + starterCount + proCount + agencyCount + freeCount;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-sm font-semibold text-foreground">Plan Distribution</p>
      <div className="space-y-4">
        <PlanBar
          label="Agency"
          count={agencyCount}
          total={total}
          color="bg-fuchsia-500"
          price={PLAN_PRICE_NGN.agency}
        />
        <PlanBar
          label="Pro"
          count={proCount}
          total={total}
          color="bg-violet-500"
          price={PLAN_PRICE_NGN.pro}
        />
        <PlanBar
          label="Starter"
          count={starterCount}
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
        </p>
      )}
    </div>
  );
}
