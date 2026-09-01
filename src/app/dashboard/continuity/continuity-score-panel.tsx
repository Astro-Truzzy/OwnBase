"use client";

import { useState } from "react";
import {
  IconInfoCircle,
  IconShieldCheck,
  IconAlertTriangle,
  IconHelpCircle,
} from "@tabler/icons-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import type {
  ContinuityFactor,
  ContinuityScore,
} from "@/lib/continuity/continuity-score";
import { cn } from "@/lib/utils";

const BAND_META: Record<
  ContinuityScore["band"],
  { label: string; tone: "success" | "warning" | "danger"; ring: string }
> = {
  strong: { label: "Strong", tone: "success", ring: "text-success" },
  fair: { label: "Fair", tone: "warning", ring: "text-warning" },
  at_risk: { label: "At risk", tone: "danger", ring: "text-danger" },
};

/** Accessible ring gauge. The number is always rendered as text alongside it. */
function ScoreRing({
  score,
  band,
}: {
  score: number;
  band: ContinuityScore["band"];
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 128 128"
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-border"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          className={BAND_META[band].ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {score}
        </span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

function factorTone(factor: ContinuityFactor): "success" | "warning" | "danger" | "neutral" {
  if (!factor.measurable || factor.score === null) return "neutral";
  if (factor.score >= 80) return "success";
  if (factor.score >= 50) return "warning";
  return "danger";
}

export function ContinuityScorePanel({
  continuity,
}: {
  continuity: ContinuityScore;
}) {
  const [showMethod, setShowMethod] = useState(false);
  const band = BAND_META[continuity.band];
  const measuredPct = Math.round(continuity.measuredWeight * 100);
  const unmeasurable = continuity.factors.filter((f) => !f.measurable);

  return (
    <section
      aria-labelledby="continuity-score-heading"
      className="dash-panel p-5 sm:p-6"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ScoreRing score={continuity.score} band={continuity.band} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="continuity-score-heading"
              className="text-lg font-semibold text-foreground"
            >
              Continuity score
            </h2>
            <StatusPill
              tone={band.tone}
              icon={
                continuity.band === "strong" ? IconShieldCheck : IconAlertTriangle
              }
            >
              {band.label}
            </StatusPill>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {continuity.headline}
          </p>

          {continuity.recommendations.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {continuity.recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <IconInfoCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowMethod((v) => !v)}
            aria-expanded={showMethod}
            className="mt-4 inline-flex items-center gap-1.5 rounded text-xs font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <IconHelpCircle className="h-3.5 w-3.5" aria-hidden />
            {showMethod ? "Hide how this is calculated" : "How is this calculated?"}
          </button>

          {showMethod && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>
                Five factors are weighted:{" "}
                {continuity.factors
                  .map((f) => `${f.label} ${Math.round(f.weight * 100)}%`)
                  .join(" · ")}
                .
              </p>
              {unmeasurable.length > 0 && (
                <p className="mt-2">
                  {unmeasurable.map((f) => f.label).join(" and ")}{" "}
                  {unmeasurable.length === 1 ? "cannot" : "cannot"} be measured
                  from the data Ownbase can access, so{" "}
                  {unmeasurable.length === 1 ? "it is" : "they are"} excluded
                  rather than scored as a failure. Your score is calculated over
                  the remaining <strong>{measuredPct}%</strong> of weight and
                  scaled to 100, so a perfect result is still reachable.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto app-scrollbar">
        <table className="w-full min-w-md border-collapse text-sm">
          <caption className="sr-only">
            Continuity score factors with their weight, measured score, and
            contribution to the final number.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th
                scope="col"
                className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Factor
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Weight
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Score
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Contributes
              </th>
            </tr>
          </thead>
          <tbody>
            {continuity.factors.map((factor) => {
              const tone = factorTone(factor);
              return (
                <tr key={factor.key} className="border-b border-border last:border-0">
                  <th scope="row" className="py-3 pr-3 text-left font-normal align-top">
                    <span className="block font-medium text-foreground">
                      {factor.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {factor.detail}
                    </span>
                  </th>
                  <td className="px-3 py-3 align-top tabular-nums text-muted-foreground">
                    {Math.round(factor.weight * 100)}%
                  </td>
                  <td className="px-3 py-3 align-top">
                    {factor.measurable && factor.score !== null ? (
                      <StatusPill tone={tone}>{factor.score}/100</StatusPill>
                    ) : (
                      <StatusPill tone="neutral" icon={IconHelpCircle}>
                        Not measurable
                      </StatusPill>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3 align-top tabular-nums",
                      factor.measurable
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {factor.measurable && factor.score !== null
                      ? `${factor.contribution} pts`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
