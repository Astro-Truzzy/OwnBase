"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { OverviewMetrics } from "@/lib/admin/metrics";
import { formatNgn } from "@/lib/admin/metrics";

interface KpiCardProps {
  label: string;
  value: number | string;
  sub?: string;
  tone?: "default" | "green" | "amber" | "red" | "cyan" | "violet";
  format?: "number" | "currency" | "percent" | "raw";
  animate?: boolean;
}

function KpiCard({ label, value, sub, tone = "default", format = "number", animate = true }: KpiCardProps) {
  const numericValue = typeof value === "number" ? value : Number(value);
  const canAnimate = animate && Number.isFinite(numericValue);
  const [display, setDisplay] = useState(canAnimate ? 0 : numericValue);

  useEffect(() => {
    if (!canAnimate) {
      setDisplay(numericValue);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDisplay(numericValue); return; }
    let frame = 0;
    let start = 0;
    const duration = 800;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(numericValue * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numericValue, canAnimate]);

  const toneClass = {
    default: "border-border bg-card",
    green: "border-emerald-400/25 bg-emerald-500/5",
    amber: "border-amber-400/25 bg-amber-500/5",
    red: "border-red-400/25 bg-red-500/5",
    cyan: "border-cyan-400/25 bg-cyan-500/5",
    violet: "border-violet-400/25 bg-violet-500/5",
  }[tone];

  const valueTone = {
    default: "text-foreground",
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    cyan: "text-accent",
    violet: "text-violet-600 dark:text-violet-400",
  }[tone];

  function displayValue(): string {
    if (format === "raw") return String(value);
    if (format === "currency") return formatNgn(typeof value === "number" ? value : numericValue);
    if (format === "percent") return `${display}%`;
    return display.toLocaleString();
  }

  return (
    <div className={cn("rounded-xl border p-4 transition-all", toneClass)}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", valueTone)}>
        {displayValue()}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function KpiGrid({ metrics }: { metrics: OverviewMetrics }) {
  const conversionRate =
    metrics.total_users > 0
      ? Math.round((metrics.paying_users / metrics.total_users) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Row 1: Growth */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Growth
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Users" value={metrics.total_users} tone="cyan" />
          <KpiCard label="New (7d)" value={metrics.new_7d} sub="signups" />
          <KpiCard label="New (30d)" value={metrics.new_30d} sub="signups" />
          <KpiCard label="Active (30d)" value={metrics.active_30d} sub="MAU" tone="cyan" />
        </div>
      </div>

      {/* Row 2: Revenue */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Revenue
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="Est. MRR"
            value={metrics.estimated_mrr_ngn}
            format="currency"
            tone={metrics.estimated_mrr_ngn > 0 ? "green" : "default"}
            animate={false}
          />
          <KpiCard label="Paying Users" value={metrics.paying_users} tone="green" />
          <KpiCard label="Starter Plan" value={metrics.plan_starter} sub="₦6,500/mo" />
          <KpiCard label="Pro Plan" value={metrics.plan_pro} sub="₦15,000/mo" tone="violet" />
        </div>
      </div>

      {/* Row 3: Engagement / Trials */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Engagement & Trials
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="On Trial" value={metrics.plan_trial} sub="free tier" tone="amber" />
          <KpiCard
            label="Expiring (7d)"
            value={metrics.trials_expiring_7d}
            sub="trials"
            tone={metrics.trials_expiring_7d > 0 ? "amber" : "default"}
          />
          <KpiCard label="Conversion" value={conversionRate} format="percent" tone={conversionRate > 10 ? "green" : "amber"} />
          <KpiCard label="Active (7d)" value={metrics.active_7d} sub="WAU" />
        </div>
      </div>

      {/* Row 4: Product */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Product
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Repos" value={metrics.repos_total} />
          <KpiCard label="Uploads" value={metrics.uploads_total} />
          <KpiCard label="AI Summaries" value={metrics.summaries_month} sub="this month" />
          <KpiCard
            label="Webhook Pending"
            value={metrics.webhook_pending_7d}
            sub="last 7d"
            tone={metrics.webhook_pending_7d > 0 ? "red" : "default"}
          />
        </div>
      </div>
    </div>
  );
}
