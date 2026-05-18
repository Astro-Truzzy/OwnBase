"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconChartPie,
  IconCoin,
  IconLayoutGrid,
  IconUsers,
  IconPlug,
  IconShieldLock,
  IconSparkles,
} from "@tabler/icons-react";
import type {
  PortfolioRiskSnapshot,
  RepoRiskProfile,
  RepoRiskTier,
} from "@/lib/dashboard/org-risk-assessment";

function tierStyle(tier: RepoRiskProfile["tier"]): string {
  switch (tier) {
    case "critical":
      return "border-rose-400/35 bg-rose-500/10 text-rose-100";
    case "elevated":
      return "border-amber-400/35 bg-amber-500/10 text-amber-100";
    case "watch":
      return "border-cyan-400/35 bg-cyan-500/12 text-cyan-100";
    default:
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIER_BAR_BG: Record<RepoRiskTier, string> = {
  critical: "bg-rose-500/85",
  elevated: "bg-amber-500/80",
  watch: "bg-cyan-500/75",
  stable: "bg-emerald-500/70",
};

function ExposureDistributionStrip(props: {
  tierCounts: Record<RepoRiskTier, number>;
  trackedCount: number;
  compactPad: string;
}) {
  const { tierCounts, trackedCount, compactPad } = props;
  if (trackedCount === 0) return null;
  const order: RepoRiskTier[] = ["critical", "elevated", "watch", "stable"];
  return (
    <div
      className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${compactPad}`}
    >
      <h3 className="text-sm font-semibold text-cyan-50">
        Exposure distribution
      </h3>
      <p className="mt-0.5 text-[11px] text-cyan-100/55">
        Share of tracked repos by modeled exposure tier
      </p>
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-black/45 ring-1 ring-cyan-200/10">
        {order.map((tier) => {
          const n = tierCounts[tier];
          const pct = (n / trackedCount) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={tier}
              className={`${TIER_BAR_BG[tier]} min-w-0 transition-[width]`}
              style={{ width: `${pct}%` }}
              title={`${tier}: ${n}`}
            />
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-cyan-100/70">
        {order.map((tier) => (
          <li key={tier} className="flex items-center gap-1.5 capitalize">
            <span
              className={`h-2 w-2 shrink-0 rounded-sm ${TIER_BAR_BG[tier]}`}
              aria-hidden
            />
            {tier}{" "}
            <span className="tabular-nums text-cyan-200/90">
              ({tierCounts[tier]})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PortfolioRiskAggregates(props: {
  sortedRepos: RepoRiskProfile[];
  compactPad: string;
}) {
  const { sortedRepos, compactPad } = props;
  const totalAiFlags = sortedRepos.reduce(
    (acc, r) => acc + r.riskIndicators.length,
    0,
  );
  const missingSummary = sortedRepos.filter((r) => !r.hasSummary).length;
  const multiAuth = sortedRepos.filter((r) => r.authSurfaceCount >= 2).length;
  const thinCustody = sortedRepos.filter(
    (r) =>
      r.collaboratorCount != null && r.collaboratorCount > 0 && r.collaboratorCount <= 2,
  ).length;

  return (
    <div
      className={`grid gap-2.5 rounded-xl border border-cyan-200/15 bg-[#050b16]/85 sm:grid-cols-2 lg:grid-cols-4 ${compactPad}`}
    >
      <div className="rounded-lg border border-cyan-200/10 bg-black/30 px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/55">
          AI diligence flags
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
          {totalAiFlags}
        </p>
        <p className="text-[11px] text-cyan-100/50">Across all summaries</p>
      </div>
      <div className="rounded-lg border border-cyan-200/10 bg-black/30 px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/55">
          No summary baseline
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
          {missingSummary}
        </p>
        <p className="text-[11px] text-cyan-100/50">Repos missing overview</p>
      </div>
      <div className="rounded-lg border border-cyan-200/10 bg-black/30 px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/55">
          Thin access (≤2)
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
          {thinCustody}
        </p>
        <p className="text-[11px] text-cyan-100/50">Direct collaborator count</p>
      </div>
      <div className="rounded-lg border border-cyan-200/10 bg-black/30 px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/55">
          Multi auth pattern
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
          {multiAuth}
        </p>
        <p className="text-[11px] text-cyan-100/50">
          Repos with ≥2 auth surfaces
        </p>
      </div>
    </div>
  );
}

function RepoRiskSpotlightGrid(props: {
  repos: RepoRiskProfile[];
  repoDetailHref: (fullName: string) => string;
  compactPad: string;
}) {
  const { repos, repoDetailHref, compactPad } = props;
  if (repos.length === 0) return null;
  return (
    <div
      className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${compactPad}`}
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-50">
        <IconLayoutGrid className="h-4 w-4 text-cyan-300" aria-hidden />
        Repository spotlight
      </h3>
      <p className="mt-0.5 text-[11px] text-cyan-100/55">
        Ranked by exposure index — open a repo for summaries, access, and audit
        exports.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {repos.map((repo) => (
          <Link
            key={repo.fullName}
            href={repoDetailHref(repo.fullName)}
            className="group block rounded-lg border border-cyan-200/12 bg-black/35 p-3.5 transition-colors hover:border-cyan-300/35 hover:bg-[#0a1524]/95"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 break-all text-[13px] font-medium text-cyan-50 group-hover:text-cyan-100">
                {repo.fullName}
              </span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${tierStyle(repo.tier)}`}
              >
                {repo.tier}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/50">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-600/90 to-cyan-400/70"
                  style={{ width: `${repo.exposureScore}%` }}
                />
              </div>
              <span className="shrink-0 tabular-nums text-xs font-semibold text-white">
                {repo.exposureScore}
              </span>
            </div>
            <ul className="mt-2.5 space-y-1 text-[11px] leading-snug text-cyan-100/65">
              {(repo.signals.length > 0
                ? repo.signals.slice(0, 4)
                : [
                    repo.hasSummary
                      ? "No acute signals in model — keep summaries fresh."
                      : "Add an AI summary to unlock diligence flags.",
                  ]
              ).map((line, i) => (
                <li key={`${repo.fullName}-${i}-${line.slice(0, 48)}`} className="flex gap-1.5">
                  <span className="text-cyan-400/80">•</span>
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300/80">
              Open repo →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReportsQuickSection(props: {
  trackedCount: number;
  summarizedCount: number;
}) {
  const { trackedCount, summarizedCount } = props;

  return (
    <section
      id="reports"
      className="scroll-mt-[calc(64px+0.75rem)] sm:scroll-mt-[calc(56px+0.75rem)]"
    >
      <div className="dash-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-cyan-50">Reports</h2>
            <p className="mt-1 max-w-2xl text-sm text-cyan-100/65">
              Generate repository handoffs and AI executive summaries before
              investor or compliance conversations. Coverage:{" "}
              <strong className="text-cyan-100">
                {summarizedCount}/{trackedCount}
              </strong>{" "}
              tracked repos currently have summaries.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/dashboard/organization#reports"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/45 hover:bg-cyan-500/20"
            >
              Reports workspace
              <IconArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/35 hover:bg-cyan-400/15"
            >
              Open dashboard
              <IconArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RiskAssessmentSection(props: {
  snapshot: PortfolioRiskSnapshot;
  repoDetailHref: (fullName: string) => string;
  /** When set, informs that collaborator counts are partial (e.g. capped fetch). */
  custodyFetchNote?: string | null;
  /** Tighter layout for the dedicated #risk tab (more room for register + signals). */
  density?: "default" | "compact";
}) {
  const { snapshot, repoDetailHref, custodyFetchNote, density = "default" } = props;
  const compact = density === "compact";
  const kpiPad = compact ? "p-3.5 sm:p-4" : "p-5";
  const kpiValueCls = compact
    ? "mt-2 text-xl font-semibold tabular-nums text-white sm:text-2xl"
    : "mt-3 text-2xl font-semibold tabular-nums text-white";
  const kpiSpanCls = compact
    ? "text-sm font-normal text-cyan-100/55 sm:text-base"
    : "text-base font-normal text-cyan-100/55";
  const tdRepoCls = compact
    ? "px-3 py-2.5 align-top font-medium text-cyan-50 sm:px-4 sm:py-3"
    : "px-4 py-3.5 align-top font-medium text-cyan-50 sm:px-5";
  const tdStdCls = compact
    ? "px-2.5 py-2.5 align-top sm:px-3 sm:py-3"
    : "px-3 py-3.5 align-top";
  const tdActionsCls = compact
    ? "px-3 py-2 align-top text-xs sm:px-4 sm:py-2.5"
    : "px-4 py-3 align-top text-xs sm:px-5";

  const sortedRepos = [...snapshot.repos].sort(
    (a, b) => b.exposureScore - a.exposureScore,
  );

  const portfolioLabel =
    snapshot.avgExposure != null && snapshot.avgExposure >= 52
      ? "Elevated diligence"
      : snapshot.avgExposure != null && snapshot.avgExposure >= 32
        ? "Balanced oversight"
        : snapshot.trackedCount > 0
          ? "Within tolerance"
          : "No tracked repositories";

  if (snapshot.trackedCount === 0) {
    return (
      <section
        id="risk"
        className={`scroll-mt-[calc(64px+0.75rem)] sm:scroll-mt-[calc(56px+0.75rem)] w-full min-w-0${compact ? " max-w-none" : ""}`}
      >
        <div
          className={`dash-panel w-full min-w-0 border-dashed border-cyan-200/25 ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
        >
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
              <IconShieldLock className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-cyan-50">
                Risk assessment
              </h2>
              <p className="mt-2 max-w-xl text-sm text-cyan-100/65">
                Track at least one repository to unlock portfolio custody,
                summary coverage, and vendor-concentration signals derived from
                your AI summaries and GitHub collaborator lists.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 underline-offset-4 hover:text-cyan-50 hover:underline"
              >
                Connect and add repos
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="risk"
      className={`scroll-mt-[calc(64px+0.75rem)] sm:scroll-mt-[calc(56px+0.75rem)] w-full min-w-0${compact ? " max-w-none" : ""}`}
    >
      <div className="dash-panel w-full min-w-0 overflow-hidden p-0 sm:p-0">
        <div
          className={`border-b border-cyan-200/15 bg-[#061018]/80 ${compact ? "px-3.5 py-3 sm:px-5 sm:py-4" : "px-6 py-6 sm:px-8 sm:py-7"}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div
                className={`flex shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/15 text-cyan-100 ${compact ? "h-10 w-10 sm:h-11 sm:w-11" : "h-12 w-12"}`}
              >
                <IconShieldLock
                  className={compact ? "h-6 w-6" : "h-7 w-7"}
                  aria-hidden
                />
              </div>

              <div>
                <h2
                  className={
                    compact
                      ? "text-lg font-semibold tracking-tight text-white sm:text-xl"
                      : "text-xl font-semibold tracking-tight text-white sm:text-2xl"
                  }
                >
                  Risk assessment
                </h2>
                {compact ? (
                  <p className="mt-1 max-w-4xl text-[13px] leading-snug text-cyan-100/65 sm:text-sm">
                    Custody, AI summary flags, integrations, payments, and org
                    access — not a penetration test; use to steer ownership and
                    vendor reviews.
                  </p>
                ) : (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cyan-100/65">
                    Portfolio-level diligence built from tracked repositories:
                    collaborator custody, AI-flagged codebase notes from your
                    summaries, integrations, payment touchpoints, and recent org
                    access events.{" "}
                    <span className="text-cyan-100/50">
                      Not a penetration test — it highlights ownership and vendor
                      risk you should escalate internally.
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-100/55">
                Portfolio posture
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/35 bg-black/35 px-3 py-1 text-sm font-semibold text-cyan-50">
                  {portfolioLabel}
                </span>
                {snapshot.avgExposure != null ? (
                  <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-cyan-100/85">
                    Avg exposure index{" "}
                    <strong>{snapshot.avgExposure}</strong>/100
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`grid border-b border-cyan-200/12 sm:grid-cols-2 lg:grid-cols-4 ${compact ? "gap-2.5 p-3.5 sm:p-5 sm:pb-4" : "gap-4 p-6 sm:p-8 sm:pb-7"}`}
        >
          <div
            className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}
          >
            <div className="flex items-center gap-2 text-cyan-200/85">
              <IconSparkles className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Summary coverage
              </span>
            </div>
            <p className={kpiValueCls}>
              {snapshot.coveragePct}
              <span className={kpiSpanCls}>%</span>
            </p>
            <p className="mt-1 text-xs text-cyan-100/55">
              {snapshot.summarizedCount} of {snapshot.trackedCount} repos with AI
              overview
            </p>
          </div>
          <div className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}>
            <div className="flex items-center gap-2 text-cyan-200/85">
              <IconUsers className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Custody risk
              </span>
            </div>
            <p className={kpiValueCls}>
              {snapshot.custodyCritical}
              <span className={kpiSpanCls}> critical</span>
            </p>
            <p className="mt-1 text-xs text-cyan-100/55">
              Single maintainer • {snapshot.custodyElevated} repos with only two
              collaborators
            </p>
          </div>
          <div className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}>
            <div className="flex items-center gap-2 text-cyan-200/85">
              <IconCoin className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Payment surface
              </span>
            </div>
            <p className={kpiValueCls}>{snapshot.paymentRepos}</p>
            <p className="mt-1 text-xs text-cyan-100/55">
              Repos where summaries mention billing or payments
            </p>
          </div>
          <div className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}>
            <div className="flex items-center gap-2 text-cyan-200/85">
              <IconPlug className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Vendor load
              </span>
            </div>
            <p className={kpiValueCls}>{snapshot.highVendorRepos}</p>
            <p className="mt-1 text-xs text-cyan-100/55">
              Repos with deeper third-party footprints (≥8 integrations noted)
            </p>
          </div>
        </div>

        <div
          className={
            compact
              ? "flex flex-col gap-3 p-3.5 sm:flex-row sm:items-start sm:gap-4 sm:p-5"
              : "grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-start"
          }
        >
          <div
            className={
              compact
                ? "w-full space-y-2.5 sm:w-72 sm:shrink-0"
                : "space-y-4 lg:col-span-4"
            }
          >
            <div className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-50">
                <IconChartPie className="h-4 w-4 text-cyan-300" />
                Exposure mix
              </h3>
              <ul
                className={`${compact ? "mt-3 space-y-2" : "mt-4 space-y-2.5"} text-sm`}
              >
                {(
                  [
                    ["critical", snapshot.tierCounts.critical],
                    ["elevated", snapshot.tierCounts.elevated],
                    ["watch", snapshot.tierCounts.watch],
                    ["stable", snapshot.tierCounts.stable],
                  ] as const
                ).map(([label, count]) => (
                  <li
                    key={label}
                    className="flex justify-between gap-4 border-b border-cyan-200/10 py-2 last:border-0"
                  >
                    <span className="capitalize text-cyan-100/70">{label}</span>
                    <span className="font-medium tabular-nums text-cyan-50">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {snapshot.strategicNotes.length > 0 ? (
              <div
                className={`rounded-xl border border-amber-400/25 bg-amber-500/8 ${kpiPad}`}
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-50">
                  <IconAlertTriangle className="h-4 w-4 text-amber-300" />
                  What to do next
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-amber-100/85">
                  {snapshot.strategicNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/devs"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-100 underline-offset-4 hover:text-amber-50 hover:underline"
                >
                  Review team access patterns
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}

            {snapshot.indicatorThemes.length > 0 ? (
              <div
                className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}
              >
                <h3 className="text-sm font-semibold text-cyan-50">
                  Recurring AI risk themes
                </h3>
                <ul className={`${compact ? "mt-2 space-y-1.5" : "mt-3 space-y-2"} text-sm`}>
                  {snapshot.indicatorThemes.map((theme, i) => (
                    <li
                      key={`${theme.text}-${i}`}
                      className="flex justify-between gap-3 rounded-lg bg-black/35 px-3 py-2"
                    >
                      <span className="min-w-0 text-cyan-100/80">
                        {theme.text}
                      </span>
                      <span className="shrink-0 tabular-nums text-cyan-200/95">
                        ×{theme.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div
                className={`rounded-xl border border-dashed border-cyan-200/20 bg-[#050b16]/50 text-sm text-cyan-100/60 ${kpiPad}`}
              >
                Generate summaries on repos to populate AI-derived risk clues
                alongside custody metrics.
              </div>
            )}

            <div
              className={`rounded-xl border border-cyan-200/15 bg-[#050b16]/85 ${kpiPad}`}
            >
              <h3 className="text-sm font-semibold text-cyan-50">
                Recent access & custody events
              </h3>
              {snapshot.auditHighlights.length === 0 ? (
                <p className="mt-3 text-sm text-cyan-100/55">
                  No collaborator or tracking events recorded recently.
                </p>
              ) : (
                <ul
                  className={compact ? "mt-2 space-y-2" : "mt-3 space-y-2.5"}
                >
                  {snapshot.auditHighlights.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-cyan-200/12 bg-black/35 px-3 py-2"
                    >
                      <p className="text-[13px] font-medium text-cyan-50">
                        {entry.label}
                      </p>
                      <p className="text-xs text-cyan-100/65">
                        {entry.repo}{" "}
                        <span className="text-cyan-100/45">
                          · {formatShortDate(entry.at)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div
            className={
              compact
                ? "flex min-w-0 w-full flex-1 basis-0 flex-col gap-4"
                : "min-w-0 lg:col-span-8"
            }
          >
            {compact ? (
              <>
                <PortfolioRiskAggregates
                  sortedRepos={sortedRepos}
                  compactPad={kpiPad}
                />
                <ExposureDistributionStrip
                  tierCounts={snapshot.tierCounts}
                  trackedCount={snapshot.trackedCount}
                  compactPad={kpiPad}
                />
              </>
            ) : null}
            <div className="w-full min-w-0 overflow-hidden rounded-xl border border-cyan-200/18 bg-[#050b14]/92">
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b border-cyan-200/15 bg-[#07121e]/95 ${compact ? "px-3 py-3 sm:px-4" : "px-4 py-4 sm:px-5"}`}
              >
                <div>
                  <h3
                    className={
                      compact
                        ? "text-[15px] font-semibold text-cyan-50 sm:text-base"
                        : "text-base font-semibold text-cyan-50"
                    }
                  >
                    Repository exposure register
                  </h3>
                  <p
                    className={
                      compact ? "text-[11px] text-cyan-100/55" : "text-xs text-cyan-100/55"
                    }
                  >
                    Sorted by modeled exposure · Open a repo to refresh summary
                    or delegate access reviews
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/55 text-[11px] font-semibold uppercase tracking-wider text-cyan-100/65">
                    <tr>
                      <th
                        className={
                          compact ? "px-3 py-2.5 sm:px-4" : "px-4 py-3 sm:px-5"
                        }
                      >
                        Repository
                      </th>
                      <th className={compact ? "px-2.5 py-2.5" : "px-3 py-3"}>
                        Exposure
                      </th>
                      <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 hidden sm:table-cell">
                        Custody
                      </th>
                      <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 hidden md:table-cell">
                        AI flags
                      </th>
                      <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 hidden lg:table-cell">
                        Vendors
                      </th>
                      <th className="px-2.5 py-2.5 sm:px-3 sm:py-3 hidden md:table-cell">
                        Billing
                      </th>
                      <th
                        className={
                          compact ? "px-3 py-2.5 sm:px-4" : "px-4 py-3 sm:px-5"
                        }
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRepos.map((repo) => (
                      <tr
                        key={repo.fullName}
                        className="border-t border-cyan-200/10 transition hover:bg-cyan-500/5"
                      >
                        <td className={tdRepoCls}>
                          <Link
                            href={repoDetailHref(repo.fullName)}
                            className="inline-flex flex-col gap-0.5 underline-offset-2 hover:text-cyan-100 hover:underline"
                          >
                            {repo.fullName}
                            {!repo.hasSummary ? (
                              <span className="text-[11px] font-normal uppercase tracking-wide text-amber-200/95">
                                No summary
                              </span>
                            ) : null}
                          </Link>
                        </td>
                        <td className={tdStdCls}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="tabular-nums font-semibold text-white">
                              {repo.exposureScore}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${tierStyle(repo.tier)}`}
                            >
                              {repo.tier}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`${tdStdCls} hidden sm:table-cell text-cyan-100/85`}
                        >
                          {repo.collaboratorCount != null ? (
                            <>
                              <span className="tabular-nums font-medium">
                                {repo.collaboratorCount}
                              </span>{" "}
                              collaborators
                            </>
                          ) : (
                            <span className="text-cyan-100/55 text-xs">
                              {repo.collaboratorError ??
                                "Not available"}
                            </span>
                          )}
                        </td>
                        <td
                          className={`${tdStdCls} hidden md:table-cell text-cyan-100/85 tabular-nums`}
                        >
                          {repo.riskIndicators.length}
                        </td>
                        <td
                          className={`${tdStdCls} hidden lg:table-cell text-cyan-100/85 tabular-nums`}
                        >
                          {repo.externalServicesCount}
                        </td>
                        <td className={`${tdStdCls} hidden md:table-cell`}>
                          {repo.paymentTouches ? (
                            <span className="text-emerald-200">Yes</span>
                          ) : (
                            <span className="text-cyan-100/55">No</span>
                          )}
                        </td>
                        <td className={tdActionsCls}>
                          <Link
                            href={`${repoDetailHref(repo.fullName)}#summary`}
                            className="mr-3 inline-block border-b border-cyan-400/55 pb-px text-cyan-100 transition hover:text-white"
                          >
                            Summary
                          </Link>
                          <Link
                            href={`${repoDetailHref(repo.fullName)}#access`}
                            className="inline-block border-b border-cyan-400/55 pb-px text-cyan-100 transition hover:text-white"
                          >
                            Access
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sortedRepos.filter((r) => r.signals.length > 0).length > 0 ? (
                <div
                  className={`border-t border-cyan-200/12 text-xs text-cyan-100/70 ${compact ? "px-3.5 py-3 sm:px-4" : "px-5 py-4"}`}
                >
                  <p
                    className={`font-semibold uppercase tracking-wide text-cyan-100/80 ${compact ? "mb-2" : "mb-3"}`}
                  >
                    Highest exposure — briefing notes
                  </p>
                  <div
                    className={compact ? "grid gap-3 sm:grid-cols-2" : "space-y-4"}
                  >
                    {sortedRepos
                      .filter((r) => r.signals.length > 0)
                      .slice(0, 3)
                      .map((repo) => (
                        <div
                          key={repo.fullName}
                          className={
                            compact
                              ? "rounded-lg border border-cyan-200/10 bg-black/25 p-3"
                              : ""
                          }
                        >
                          <p className="text-[13px] font-medium text-cyan-50">
                            {repo.fullName}
                            <span className="ml-2 font-normal text-cyan-100/55">
                              ({repo.exposureScore} index)
                            </span>
                          </p>
                          <ul
                            className={
                              compact
                                ? "mt-1.5 space-y-0.5 leading-snug"
                                : "mt-1.5 space-y-1 leading-relaxed"
                            }
                          >
                            {repo.signals.map((s) => (
                              <li key={s}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
              {custodyFetchNote ? (
                <p className="border-t border-cyan-200/12 px-5 py-3 text-center text-[11px] text-cyan-100/55">
                  {custodyFetchNote}
                </p>
              ) : null}
            </div>
            {compact ? (
              <RepoRiskSpotlightGrid
                repos={sortedRepos}
                repoDetailHref={repoDetailHref}
                compactPad={kpiPad}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
