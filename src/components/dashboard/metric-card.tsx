import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MetricTone = "default" | "success" | "warning" | "danger" | "ai";

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  stroke?: number;
}>;

const ICON_TONE: Record<MetricTone, string> = {
  default: "border-border bg-muted/40 text-muted-foreground",
  success: "border-success-border bg-success-subtle text-success",
  warning: "border-warning-border bg-warning-subtle text-warning",
  danger: "border-danger-border bg-danger-subtle text-danger",
  ai: "border-accent-ai-border bg-accent-ai-subtle text-accent-ai",
};

type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: IconComponent;
  tone?: MetricTone;
  /** Optional slot rendered under the value (e.g. a StatusPill or trend). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Shared metric tile — replaces the ad-hoc `Stat` / `.dash-stat-card` blocks
 * scattered across the dashboard. Uses the existing `.dash-stat-card` surface
 * so it stays visually consistent in both themes.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  footer,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "dash-stat-card flex flex-col gap-3 rounded-xl p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
              ICON_TONE[tone],
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {footer ? <div className="mt-auto pt-1">{footer}</div> : null}
    </div>
  );
}
