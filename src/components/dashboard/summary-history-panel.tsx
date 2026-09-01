"use client";

import { useState, type ReactNode } from "react";
import { IconHistory, IconLoader2 } from "@tabler/icons-react";
import {
  getRepoSummaryHistory,
  type SummaryHistoryEntry,
} from "@/app/dashboard/repo/actions";
import {
  diffSummaries,
  type ListFieldDiff,
  type ModuleMapDiff,
  type TextFieldDiff,
} from "@/lib/ai/summary-diff";
import { cn } from "@/lib/utils";

/**
 * Lets the owner browse past AI summary versions for a repo and see what
 * changed between any two of them. Fetches lazily on first open — history can
 * be long-lived (append-only), so there's no reason to load it on page render
 * for repos nobody is currently comparing.
 */
export function SummaryHistoryPanel({ fullName }: { fullName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<SummaryHistoryEntry[] | null>(null);
  const [newerId, setNewerId] = useState("");
  const [olderId, setOlderId] = useState("");

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (!next || entries !== null) return;

    setLoading(true);
    setError(null);
    const result = await getRepoSummaryHistory(fullName);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setEntries(result.data);
    if (result.data.length >= 2) {
      setNewerId(result.data[0].id);
      setOlderId(result.data[1].id);
    }
  }

  const newer = entries?.find((e) => e.id === newerId) ?? null;
  const older = entries?.find((e) => e.id === olderId) ?? null;
  const diff = newer && older ? diffSummaries(older.summary, newer.summary) : null;

  return (
    <div className={cn(open && "w-full")}>
      <button
        type="button"
        onClick={() => void handleToggle()}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <IconHistory className="h-4 w-4" aria-hidden />
        {open ? "Hide history" : "History"}
      </button>

      {open && (
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-4">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading history…
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-error-text">
              {error}
            </p>
          )}

          {!loading && !error && entries?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No summary history yet — regenerate to start tracking changes over
              time.
            </p>
          )}

          {!loading && !error && entries?.length === 1 && (
            <p className="text-sm text-muted-foreground">
              Only one version recorded so far. Regenerate again to compare
              changes.
            </p>
          )}

          {!loading && !error && entries && entries.length >= 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  Compare
                  <select
                    value={olderId}
                    onChange={(e) => setOlderId(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                  >
                    {entries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {formatVersionLabel(e.createdAt)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  with
                  <select
                    value={newerId}
                    onChange={(e) => setNewerId(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                  >
                    {entries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {formatVersionLabel(e.createdAt)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {diff && !diff.hasChanges && (
                <p className="text-sm text-muted-foreground">
                  No differences between these two versions.
                </p>
              )}

              {diff && diff.hasChanges && (
                <div className="space-y-4 text-sm">
                  <TextDiff diff={diff.summary} label="Summary" />
                  <ListDiff diff={diff.keyComponents} label="Main parts" />
                  <ListDiff diff={diff.paymentIntegrations} label="Payments" />
                  <ListDiff
                    diff={diff.authentication}
                    label="Sign-in & access"
                  />
                  <ListDiff
                    diff={diff.externalServices}
                    label="External services"
                  />
                  <ModuleMapDiffView diff={diff.moduleMap} />
                  <ListDiff diff={diff.riskIndicators} label="Things to watch" />
                  <TextDiff diff={diff.techStackOverview} label="Tech stack" />
                  <ListDiff diff={diff.operationalFlows} label="Main flows" />
                  <ListDiff
                    diff={diff.handoffNextSteps}
                    label="Handover next steps"
                  />
                  <TextDiff diff={diff.localSetup} label="Running it locally" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatVersionLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  );
}

function TextDiff({
  diff,
  label,
}: {
  diff: TextFieldDiff | null;
  label: string;
}) {
  if (!diff || !diff.changed) return null;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <p className="mt-1.5 leading-relaxed text-foreground">
        {diff.tokens.map((t, i) => (
          <span
            key={i}
            className={cn(
              t.type === "added" && "rounded bg-success-subtle px-0.5 text-success",
              t.type === "removed" &&
                "rounded bg-danger-subtle px-0.5 text-danger line-through",
            )}
          >
            {t.text}
          </span>
        ))}
      </p>
    </div>
  );
}

function ListDiff({ diff, label }: { diff: ListFieldDiff; label: string }) {
  if (diff.added.length === 0 && diff.removed.length === 0) return null;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ul className="mt-1.5 space-y-1">
        {diff.added.map((item) => (
          <li
            key={`add-${item}`}
            className="rounded bg-success-subtle px-2 py-1 text-success"
          >
            + {item}
          </li>
        ))}
        {diff.removed.map((item) => (
          <li
            key={`rem-${item}`}
            className="rounded bg-danger-subtle px-2 py-1 text-danger line-through"
          >
            − {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModuleMapDiffView({ diff }: { diff: ModuleMapDiff }) {
  if (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.changed.length === 0
  ) {
    return null;
  }
  return (
    <div>
      <FieldLabel>Codebase map</FieldLabel>
      <ul className="mt-1.5 space-y-1">
        {diff.added.map((entry) => (
          <li
            key={`add-${entry.path}`}
            className="rounded bg-success-subtle px-2 py-1 text-success"
          >
            + <span className="font-mono text-xs">{entry.path}</span>{" "}
            {entry.description}
          </li>
        ))}
        {diff.removed.map((entry) => (
          <li
            key={`rem-${entry.path}`}
            className="rounded bg-danger-subtle px-2 py-1 text-danger line-through"
          >
            − <span className="font-mono text-xs">{entry.path}</span>{" "}
            {entry.description}
          </li>
        ))}
        {diff.changed.map((c) => (
          <li
            key={`chg-${c.path}`}
            className="rounded bg-warning-subtle px-2 py-1.5 text-warning"
          >
            <span className="font-mono text-xs text-foreground">{c.path}</span>
            <div className="mt-0.5 text-danger line-through">{c.before}</div>
            <div className="text-success">{c.after}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
