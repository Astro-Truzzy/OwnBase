import type { Metadata } from "next";
import {
  getAdminOverview,
  getPlanHistory,
  getWebhookEvents,
  PLAN_PRICE_NGN,
  formatNgn,
} from "@/lib/admin/metrics";

export const metadata: Metadata = { title: "Revenue" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminRevenuePage() {
  const [metrics, planHistory, webhookEvents] = await Promise.all([
    getAdminOverview(),
    getPlanHistory(6),
    getWebhookEvents(20),
  ]);

  const mrrNgn = metrics.estimated_mrr_ngn;
  const subscriptionEvents = webhookEvents.filter((e) =>
    e.event_type.startsWith("subscription"),
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Revenue</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Billing health, plan mix, and Paystack events
        </p>
      </div>

      {/* MRR summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Estimated MRR
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatNgn(mrrNgn)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Display-only estimate · excludes trials
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Paying Users
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-foreground">
            {metrics.paying_users}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {metrics.plan_starter} starter · {metrics.plan_pro} pro
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trials Active
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-amber-600 dark:text-amber-400">
            {metrics.plan_trial}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {metrics.trials_expiring_7d} expiring in 7 days
          </p>
        </div>
      </div>

      {/* Plan pricing reference */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Plan Pricing</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium text-foreground">Starter</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">
                {formatNgn(PLAN_PRICE_NGN.starter)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">/mo</span>
              <p className="text-xs text-muted-foreground">
                {metrics.plan_starter} users ={" "}
                {formatNgn(metrics.plan_starter * PLAN_PRICE_NGN.starter)}/mo
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-violet-400/25 bg-violet-500/5 px-4 py-3">
            <span className="text-sm font-medium text-foreground">Pro</span>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">
                {formatNgn(PLAN_PRICE_NGN.pro)}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">/mo</span>
              <p className="text-xs text-muted-foreground">
                {metrics.plan_pro} users ={" "}
                {formatNgn(metrics.plan_pro * PLAN_PRICE_NGN.pro)}/mo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan cohort history */}
      {planHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Signup Cohorts by Month</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Grouped by signup month · showing current plan for each cohort
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Month</th>
                  <th className="px-5 py-3 text-right font-medium text-amber-600 dark:text-amber-400">Trial</th>
                  <th className="px-5 py-3 text-right font-medium text-accent">Starter</th>
                  <th className="px-5 py-3 text-right font-medium text-violet-600 dark:text-violet-400">Pro</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {planHistory.map((row) => {
                  const total = row.trial_count + row.starter_count + row.pro_count;
                  return (
                    <tr key={row.month} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-5 py-3 font-medium text-foreground">
                        {new Date(row.month).toLocaleDateString("en-NG", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {row.trial_count}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-accent">
                        {row.starter_count}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-violet-600 dark:text-violet-400">
                        {row.pro_count}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-foreground font-medium">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Paystack subscription events */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Subscription Events</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Paystack webhook events · subscription type
          </p>
        </div>
        {subscriptionEvents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No subscription webhook events yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Event type</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Received</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Processed</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono text-xs text-foreground">{ev.event_type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          ev.processed
                            ? "text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                            : "text-amber-600 dark:text-amber-400 text-xs font-medium"
                        }
                      >
                        {ev.processed ? "Processed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDate(ev.received_at)}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {ev.processed_at ? formatDate(ev.processed_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
