import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconMinus,
} from "@tabler/icons-react";
import {
  freshnessLabel,
  type SummaryFreshness,
} from "@/lib/ai/insights-overview";
import { StatusPill, type StatusTone } from "./status-pill";

/**
 * Freshness of a stored AI summary, as a status pill. Single definition so the
 * repository detail page and the AI Insights hub never drift on what "stale"
 * looks like. Colour is always paired with an icon and text.
 */

const STYLE: Record<
  SummaryFreshness,
  { tone: StatusTone; icon: typeof IconCircleCheck }
> = {
  fresh: { tone: "success", icon: IconCircleCheck },
  aging: { tone: "warning", icon: IconClock },
  stale: { tone: "danger", icon: IconAlertTriangle },
  missing: { tone: "neutral", icon: IconMinus },
  unsupported: { tone: "neutral", icon: IconMinus },
};

export function SummaryFreshnessPill({
  freshness,
  ageDays,
  className,
}: {
  freshness: SummaryFreshness;
  ageDays: number | null;
  className?: string;
}) {
  const { tone, icon } = STYLE[freshness];
  return (
    <StatusPill tone={tone} icon={icon} className={className}>
      {freshnessLabel(freshness, ageDays)}
    </StatusPill>
  );
}
