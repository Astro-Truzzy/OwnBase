"use client";

import {
  IconAlertTriangle,
  IconClock,
  IconClockExclamation,
  IconClockX,
} from "@tabler/icons-react";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  ACCESS_LEVEL_META,
  ACCESS_LEVEL_OPTIONS,
  type AccessLevel,
  type AccessSource,
  type ExpiryState,
} from "@/lib/access/levels";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Deterministic, locale-independent date format to avoid hydration drift. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

type MatrixCellProps = {
  login: string;
  repoFullName: string;
  level: AccessLevel;
  /** Provenance of this grant — reserved for a future source indicator. */
  source?: AccessSource;
  /** Ownbase-recorded level differs from the live provider level. */
  drift?: boolean;
  driftLabel?: string;
  /** Recorded in Ownbase but not yet an accepted collaborator on the provider. */
  pending?: boolean;
  expiresAt?: string | null;
  /** Precomputed upstream (with a stable "now") to avoid time-based hydration drift. */
  expiryState?: ExpiryState;
  /** Static label instead of an editable dropdown (e.g. GitLab advisory rows). */
  readOnly?: boolean;
  disabled?: boolean;
  busy?: boolean;
  onChange?: (level: AccessLevel) => void;
  className?: string;
};

/**
 * A single people×repo access cell for the Team & Access matrix: an editable
 * level dropdown plus pending / drift / expiry flags. In a data-grid context the
 * dropdown is contextualized by the table's row/column headers; flags carry
 * icon + text so status is never conveyed by color alone.
 */
export function MatrixCell({
  login,
  repoFullName,
  level,
  drift = false,
  driftLabel,
  pending = false,
  expiresAt,
  expiryState,
  readOnly = false,
  disabled = false,
  busy = false,
  onChange,
  className,
}: MatrixCellProps) {
  const meta = ACCESS_LEVEL_META[level];

  const expiryTone =
    expiryState === "expired"
      ? "danger"
      : expiryState === "expiring"
        ? "warning"
        : "neutral";
  const ExpiryIcon =
    expiryState === "expired"
      ? IconClockX
      : expiryState === "expiring"
        ? IconClockExclamation
        : IconClock;

  const flags =
    pending || drift || expiresAt ? (
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {pending ? (
          <StatusPill tone="warning" icon={IconClock}>
            Pending
          </StatusPill>
        ) : null}
        {drift ? (
          <StatusPill
            tone="danger"
            icon={IconAlertTriangle}
            srLabel="Access drift between Ownbase and the provider"
          >
            {driftLabel ?? "Drift"}
          </StatusPill>
        ) : null}
        {expiresAt ? (
          <StatusPill tone={expiryTone} icon={ExpiryIcon}>
            {expiryState === "expired"
              ? `Expired ${formatDate(expiresAt)}`
              : `Expires ${formatDate(expiresAt)}`}
          </StatusPill>
        ) : null}
      </div>
    ) : null;

  if (readOnly) {
    return (
      <div className={cn("min-w-30", className)}>
        <span
          className={cn(
            "inline-flex items-center rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium",
            level === "none" ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span className="sr-only">
            {login} on {repoFullName}:{" "}
          </span>
          {meta.label}
        </span>
        {flags}
      </div>
    );
  }

  return (
    <div className={cn("min-w-30", className)}>
      <DashboardSelect
        size="compact"
        ariaLabel={`Access level for ${login} on ${repoFullName}`}
        value={level}
        onChange={(next) => onChange?.(next as AccessLevel)}
        options={ACCESS_LEVEL_OPTIONS}
        disabled={disabled || busy}
        triggerClassName={cn(
          level === "none" && "text-muted-foreground",
          drift && "border-danger-border ring-1 ring-danger/20",
        )}
      />
      {flags}
    </div>
  );
}
