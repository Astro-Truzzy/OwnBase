import {
  IconActivity,
  IconClockExclamation,
  IconClockPlus,
  IconFolderMinus,
  IconFolderPlus,
  IconGitCommit,
  IconShieldCheck,
  IconSparkles,
  IconUserCog,
  IconUserMinus,
  IconUserPlus,
} from "@tabler/icons-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  stroke?: number;
}>;

type CategoryMeta = { icon: IconComponent; tone: string; label: string };

/**
 * Visual mapping for activity categories. Keys mirror the `ActivityActionType`
 * union in the DB layer; unknown categories fall back to a neutral dot.
 */
const CATEGORY_META: Record<string, CategoryMeta> = {
  collaborator_added: {
    icon: IconUserPlus,
    tone: "border-success-border bg-success-subtle text-success",
    label: "Collaborator added",
  },
  collaborator_removed: {
    icon: IconUserMinus,
    tone: "border-danger-border bg-danger-subtle text-danger",
    label: "Collaborator removed",
  },
  collaborator_access_changed: {
    icon: IconUserCog,
    tone: "border-primary/30 bg-primary/10 text-primary",
    label: "Access level changed",
  },
  member_role_changed: {
    icon: IconUserCog,
    tone: "border-primary/30 bg-primary/10 text-primary",
    label: "Member role changed",
  },
  repo_tracked: {
    icon: IconFolderPlus,
    tone: "border-success-border bg-success-subtle text-success",
    label: "Repository tracked",
  },
  repo_untracked: {
    icon: IconFolderMinus,
    tone: "border-warning-border bg-warning-subtle text-warning",
    label: "Repository untracked",
  },
  summary_generated: {
    icon: IconSparkles,
    tone: "border-accent-ai-border bg-accent-ai-subtle text-accent-ai",
    label: "AI summary generated",
  },
  access_review_completed: {
    icon: IconShieldCheck,
    tone: "border-success-border bg-success-subtle text-success",
    label: "Access review completed",
  },
  member_offboarded: {
    icon: IconUserMinus,
    tone: "border-warning-border bg-warning-subtle text-warning",
    label: "Developer offboarded",
  },
  access_expiry_extended: {
    icon: IconClockPlus,
    tone: "border-primary/30 bg-primary/10 text-primary",
    label: "Access expiry extended",
  },
  access_expiry_notified: {
    icon: IconClockExclamation,
    tone: "border-warning-border bg-warning-subtle text-warning",
    label: "Expiring access notice sent",
  },
  commit: {
    icon: IconGitCommit,
    tone: "border-border bg-muted/40 text-foreground",
    label: "Commit",
  },
  default: {
    icon: IconActivity,
    tone: "border-border bg-muted/40 text-muted-foreground",
    label: "Activity",
  },
};

type TimelineRowProps = {
  /** Who performed the action (rendered bold). */
  actor?: ReactNode;
  /** What happened (rendered muted). */
  action: ReactNode;
  /** The object of the action, e.g. a repo or collaborator (rendered bold). */
  target?: ReactNode;
  /** Preformatted time label. Kept as a node to avoid server/client hydration drift. */
  at?: ReactNode;
  /** ISO timestamp for the semantic <time> element. */
  dateTime?: string;
  /** Activity category key — drives the icon + tone. */
  category?: string;
  className?: string;
};

/**
 * One entry in an activity timeline. Renders an <li>, so callers must wrap a
 * set of rows in a <ul>. The category icon carries an sr-only label so the
 * meaning is not conveyed by color alone.
 */
export function TimelineRow({
  actor,
  action,
  target,
  at,
  dateTime,
  category = "default",
  className,
}: TimelineRowProps) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.default;
  const Icon = meta.icon;

  return (
    <li className={cn("flex items-start gap-3 py-2.5", className)}>
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
          meta.tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{meta.label}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          {actor ? (
            <span className="font-medium text-foreground">{actor} </span>
          ) : null}
          <span className="text-muted-foreground">{action}</span>
          {target ? (
            <span className="font-medium text-foreground"> {target}</span>
          ) : null}
        </p>
        {at ? (
          dateTime ? (
            <time
              dateTime={dateTime}
              className="mt-0.5 block text-xs text-muted-foreground"
            >
              {at}
            </time>
          ) : (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {at}
            </span>
          )
        ) : null}
      </div>
    </li>
  );
}
