import { IconChartBar } from "@tabler/icons-react";
import type { UsageSnapshot } from "@/lib/usage-stats";

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
        ? "bg-danger"
        : ratio >= 80
          ? "bg-warning"
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

export function PlanUsageMeters({ usage }: { usage: UsageSnapshot }) {
  return (
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
  );
}
