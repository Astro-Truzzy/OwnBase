import { IconSparkles } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { cn } from "@/lib/utils";

type AiSummaryCardProps = {
  /**
   * Markdown body. Rendered on a dark "AI console" well because the shared
   * `MarkdownContent` renderer is hardcoded for a cyan-on-near-black surface.
   * Ignored when `children` is provided.
   */
  content?: string;
  /**
   * Structured body (e.g. `ExecutiveSummaryBody`). When present the card uses
   * ordinary theme surfaces so the content is legible in light and dark.
   */
  children?: ReactNode;
  title?: string;
  /** Small meta line under the title, e.g. "Generated 2h ago · gpt-4o-mini". */
  meta?: ReactNode;
  /** Action slot in the header, e.g. a regenerate button. */
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Teal-accented shell for AI-generated codebase summaries.
 *
 * AI-Teal is used only as accent chrome (border, header, icon) — the spec's
 * intended distinct treatment for AI surfaces. Always carries an explicit
 * "AI-generated" label + a verify disclosure so provenance is unambiguous.
 *
 * Two body modes: pass `content` for markdown (dark console well, needed by
 * `MarkdownContent`), or `children` for structured sections on the normal card
 * surface. The chrome is identical either way.
 */
export function AiSummaryCard({
  content,
  children,
  title = "AI codebase summary",
  meta,
  actions,
  className,
  contentClassName,
}: AiSummaryCardProps) {
  const isConsole = children === undefined;
  /** Chip/pill fill: matches whichever body surface is in use. */
  const chipSurface = isConsole ? "bg-[#060a12]" : "bg-card";

  return (
    <section
      aria-label={title}
      className={cn(
        "overflow-hidden rounded-xl border border-accent-ai-border shadow-sm",
        isConsole ? "bg-[#060a12]" : "bg-card",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-accent-ai-border/60 bg-accent-ai-subtle px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-ai-border text-accent-ai",
              chipSurface,
            )}
          >
            <IconSparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-accent-ai">
              {title}
            </span>
            {meta ? (
              <span className="truncate text-xs text-accent-ai/70">{meta}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-accent-ai-border px-2 py-0.5 text-[11px] font-medium text-accent-ai",
              chipSurface,
            )}
          >
            <IconSparkles className="h-3 w-3" aria-hidden />
            AI-generated
          </span>
          {actions}
        </div>
      </header>
      <div className={cn("px-4 py-4 sm:px-5", contentClassName)}>
        {isConsole ? <MarkdownContent content={content ?? ""} /> : children}
        <p
          className={cn(
            "mt-4 border-t pt-3 text-xs",
            isConsole
              ? "border-cyan-200/10 text-cyan-100/50"
              : "border-border/60 text-muted-foreground",
          )}
        >
          AI-generated summary — verify against the source before relying on it
          for access or security decisions.
        </p>
      </div>
    </section>
  );
}
