import type { ExecutiveSummary } from "@/lib/db/types";
import { ModuleMap } from "@/components/dashboard/module-map";
import { cn } from "@/lib/utils";

/**
 * Renders a stored `ExecutiveSummary` as structured sections.
 *
 * Shared by the repository detail page and the AI Insights hub so the same
 * summary reads identically in both places. Presentation only — it never fetches
 * or generates, and every section is omitted when the AI returned nothing for it.
 *
 * `showExtended` adds the handover-oriented sections (stack, flows, next steps,
 * local setup). The repo detail page keeps them off; the insights hub turns them
 * on, since that screen exists to surface exactly that depth.
 */

type ExecutiveSummaryBodyProps = {
  summary: ExecutiveSummary;
  showExtended?: boolean;
  className?: string;
};

function BulletSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "warning";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-medium text-foreground">{title}</h3>
      <ul
        className={cn(
          "mt-2 space-y-1 pl-5",
          tone === "warning" ? "list-disc text-warning" : "list-disc text-muted-foreground",
        )}
      >
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ExecutiveSummaryBody({
  summary,
  showExtended = false,
  className,
}: ExecutiveSummaryBodyProps) {
  const extended = showExtended
    ? {
        techStack: summary.techStackOverview?.trim() ?? "",
        flows: summary.operationalFlows ?? [],
        nextSteps: summary.handoffNextSteps ?? [],
        localSetup: summary.localSetup?.trim() ?? "",
      }
    : null;

  return (
    <div className={cn("space-y-8 text-sm", className)}>
      <p className="leading-relaxed text-foreground">{summary.summary}</p>

      {extended?.techStack ? (
        <div>
          <h3 className="font-medium text-foreground">Tech stack</h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {extended.techStack}
          </p>
        </div>
      ) : null}

      <BulletSection title="Main parts" items={summary.keyComponents} />
      <BulletSection title="Payments" items={summary.paymentIntegrations} />
      <BulletSection title="Sign-in & access" items={summary.authentication} />
      <BulletSection title="External services" items={summary.externalServices} />

      <ModuleMap entries={summary.moduleMap ?? []} />

      {extended ? (
        <>
          <BulletSection title="Main flows" items={extended.flows} />
          <BulletSection title="Handover next steps" items={extended.nextSteps} />
        </>
      ) : null}

      <BulletSection
        title="Things to watch"
        items={summary.riskIndicators}
        tone="warning"
      />

      {extended?.localSetup ? (
        <details className="group rounded-lg border border-border/70 bg-muted/25 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-muted-foreground">
            Running it locally
          </summary>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {extended.localSetup}
          </p>
        </details>
      ) : null}
    </div>
  );
}
