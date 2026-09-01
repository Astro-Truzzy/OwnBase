import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Semantic status tones, mapped to the additive design tokens in globals.css.
 * Status is always paired with an icon + text label, so color is never the
 * sole signal (accessibility requirement).
 */
export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "ai"
  | "neutral";

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  stroke?: number;
}>;

const TONE_STYLES: Record<StatusTone, string> = {
  success: "border-success-border bg-success-subtle text-success",
  warning: "border-warning-border bg-warning-subtle text-warning",
  danger: "border-danger-border bg-danger-subtle text-danger",
  info: "border-primary/30 bg-primary/10 text-primary",
  ai: "border-accent-ai-border bg-accent-ai-subtle text-accent-ai",
  neutral: "border-border bg-muted/40 text-muted-foreground",
};

type StatusPillProps = {
  tone?: StatusTone;
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
  /** Optional label announced to screen readers in place of the visible text. */
  srLabel?: string;
};

export function StatusPill({
  tone = "neutral",
  icon: Icon,
  children,
  className,
  srLabel,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
