import type { Metadata } from "next";
import { getAdminOverview, getDauSeries, getSignupSeries } from "@/lib/admin/metrics";
import { TrendChart } from "../../_components/trend-chart";

export const metadata: Metadata = { title: "Product" };

function FeatureCard({
  title,
  value,
  sub,
  hint,
}: {
  title: string;
  value: string | number;
  sub?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold tabular-nums text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {hint && (
        <p className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

export default async function AdminProductPage() {
  const [metrics, signups, dau] = await Promise.all([
    getAdminOverview(),
    getSignupSeries(30),
    getDauSeries(30),
  ]);

  const avgReposPerUser =
    metrics.total_users > 0
      ? (metrics.repos_total / metrics.total_users).toFixed(1)
      : "0";

  const avgUploadsPerUser =
    metrics.total_users > 0
      ? (metrics.uploads_total / metrics.total_users).toFixed(1)
      : "0";

  const activationRate =
    metrics.total_users > 0
      ? Math.round(((metrics.total_users - metrics.inactive_with_repos) / metrics.total_users) * 100)
      : 0;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Product</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Feature adoption and engagement metrics</p>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Core feature usage
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="Tracked Repos"
            value={metrics.repos_total}
            sub={`avg ${avgReposPerUser} per user`}
            hint="Primary activation signal — users who track ≥1 repo are 3× more likely to convert."
          />
          <FeatureCard title="Project Uploads" value={metrics.uploads_total} sub={`avg ${avgUploadsPerUser} per user`} />
          <FeatureCard
            title="AI Summaries"
            value={metrics.summaries_month}
            sub="this calendar month"
            hint="High summary volume = high engagement. Low = users may not know the feature exists."
          />
          <FeatureCard title="Active (7d)" value={metrics.active_7d} sub="weekly active users" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Retention signals
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Activation Rate</p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground">{activationRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Users with repos who have been active (30d)</p>
          </div>
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/5 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Inactive w/ Repos</p>
            <p className="mt-1.5 text-2xl font-semibold text-amber-600 dark:text-amber-400">{metrics.inactive_with_repos}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tracked repos but no activity in 30 days</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">MAU / Total</p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground">
              {metrics.total_users > 0 ? Math.round((metrics.active_30d / metrics.total_users) * 100) : 0}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.active_30d} active of {metrics.total_users} total
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Growth trends (30 days)
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TrendChart title="Daily Signups" series={signups} color="cyan" emptyMessage="No signups in this window." />
          <TrendChart title="Daily Active Users" series={dau} color="violet" emptyMessage="No activity events in this window." />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Improvement signals</h2>
        <ImprovementRow
          label="AI summary adoption"
          good={metrics.summaries_month > metrics.active_30d * 0.5}
          goodMsg="More than half of active users generated a summary this month."
          badMsg="Less than half of active users used AI summaries — consider in-app prompts."
        />
        <ImprovementRow
          label="Repo activation"
          good={Number(avgReposPerUser) >= 1}
          goodMsg="Average user has at least one tracked repo — core activation achieved."
          badMsg="Average user has fewer than one tracked repo — onboarding may be unclear."
        />
        <ImprovementRow
          label="Weekly retention"
          good={metrics.active_7d >= metrics.active_30d * 0.35}
          goodMsg="WAU is ≥35% of MAU — healthy weekly retention."
          badMsg="WAU is <35% of MAU — users sign in infrequently. Consider digest emails or push."
        />
        <ImprovementRow
          label="Trial conversion"
          good={metrics.paying_users > metrics.plan_trial * 0.2}
          goodMsg="Conversion rate looks healthy relative to trial volume."
          badMsg="Low conversion vs trial volume — review trial UX and upgrade prompts."
        />
      </div>
    </div>
  );
}

function ImprovementRow({ label, good, goodMsg, badMsg }: { label: string; good: boolean; goodMsg: string; badMsg: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${good ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
        {good ? "✓" : "!"}
      </span>
      <div>
        <span className="font-medium text-foreground">{label}</span>
        <p className="text-muted-foreground">{good ? goodMsg : badMsg}</p>
      </div>
    </div>
  );
}
