import type { Metadata } from "next";
import { getAdminOverview, getDauSeries, getSignupSeries } from "@/lib/admin/metrics";
import { AlertStrip } from "../_components/alert-strip";
import { KpiGrid } from "../_components/kpi-grid";
import { PlanBreakdown } from "../_components/plan-breakdown";
import { TrendChart } from "../_components/trend-chart";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const [metrics, signups, dau] = await Promise.all([
    getAdminOverview(),
    getSignupSeries(30),
    getDauSeries(30),
  ]);

  const now = new Date();
  const refreshedAt = now.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Business Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Live snapshot · Refreshed at {refreshedAt}
          </p>
        </div>
      </div>

      <AlertStrip metrics={metrics} />
      <KpiGrid metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <TrendChart
            title="Daily Signups (last 30 days)"
            series={signups}
            color="cyan"
            emptyMessage="No signups recorded yet."
          />
          <TrendChart
            title="Daily Active Users (last 30 days)"
            series={dau}
            color="violet"
            emptyMessage="No user activity recorded yet."
          />
        </div>
        <div className="space-y-4">
          <PlanBreakdown
            history={[]}
            trialCount={metrics.plan_trial}
            starterCount={metrics.plan_starter}
            proCount={metrics.plan_pro}
            agencyCount={metrics.plan_agency}
            freeCount={metrics.plan_free}
            payingStarter={metrics.paying_starter}
            payingPro={metrics.paying_pro}
            payingAgency={metrics.paying_agency}
            compedCount={metrics.comped_users}
          />
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Quick Stats</p>
            <StatRow label="Estimated MRR" value={`₦${metrics.estimated_mrr_ngn.toLocaleString("en-NG")}`} />
            <StatRow
              label="Conversion rate"
              value={`${metrics.total_users > 0 ? Math.round((metrics.paying_users / metrics.total_users) * 100) : 0}%`}
            />
            <StatRow
              label="Avg. repos / user"
              value={metrics.total_users > 0 ? (metrics.repos_total / metrics.total_users).toFixed(1) : "0"}
            />
            <StatRow label="AI summaries this month" value={metrics.summaries_month.toLocaleString()} />
            <StatRow
              label="Inactive 30d w/ repos"
              value={metrics.inactive_with_repos.toLocaleString()}
              highlight={metrics.inactive_with_repos > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "font-medium text-amber-600 dark:text-amber-400"
            : "font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
