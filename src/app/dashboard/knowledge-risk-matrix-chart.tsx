"use client";

import Link from "next/link";

export type KnowledgeRiskRepo = {
  id: string;
  name: string;
  fullName: string;
  detailHref: string;
  health: number;
  contributors: number;
  busFactor: number;
};

type Props = {
  repositories: KnowledgeRiskRepo[];
};

const W = 360;
const H = 220;
const PAD = { left: 52, right: 20, top: 20, bottom: 48 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const X_MAX = 8;
const Y_TICKS = [0, 25, 50, 75, 100] as const;
const X_TICKS = [0, 2, 4, 6, 8] as const;

function riskLevel(repo: KnowledgeRiskRepo): "critical" | "watch" | "healthy" {
  if (repo.busFactor <= 1) return "critical";
  if (repo.health < 85) return "watch";
  return "healthy";
}

const RISK_STYLE = {
  critical: {
    fill: "rgb(225 29 72)",
    stroke: "rgb(190 18 60)",
    label: "Single maintainer (≤1 collaborator)",
  },
  watch: {
    fill: "rgb(217 119 6)",
    stroke: "rgb(180 83 9)",
    label: "Lower health (<85)",
  },
  healthy: {
    fill: "rgb(5 150 105)",
    stroke: "rgb(4 120 87)",
    label: "Healthy spread",
  },
} as const;

function xPos(contributors: number): number {
  const capped = Math.min(Math.max(contributors, 0), X_MAX);
  return PAD.left + (capped / X_MAX) * CHART_W;
}

function yPos(health: number): number {
  const clamped = Math.max(0, Math.min(100, health));
  return PAD.top + CHART_H - (clamped / 100) * CHART_H;
}

export function KnowledgeRiskMatrixChart({ repositories }: Props) {
  const plotted = repositories.slice(0, 12);

  if (plotted.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Track repositories to map contributor spread against repo health.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Each dot is a tracked repository.{" "}
        <span className="text-foreground/90">Horizontal</span> = how many
        collaborators have access;{" "}
        <span className="text-foreground/90">vertical</span> = activity-based
        health score. Repos in the{" "}
        <span className="font-medium text-foreground">bottom-left</span> have
        fewer people and lower health — the highest knowledge-risk pocket.
      </p>

      <div className="relative rounded-lg border border-border/50 bg-muted/20 p-2 dark:bg-black/20">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-h-[280px]"
          role="img"
          aria-labelledby="knowledge-risk-matrix-title knowledge-risk-matrix-desc"
        >
          <title id="knowledge-risk-matrix-title">Knowledge risk matrix</title>
          <desc id="knowledge-risk-matrix-desc">
            Scatter plot of repositories by collaborator count and health score
          </desc>

          {/* Quadrant hints */}
          <text
            x={PAD.left + 4}
            y={PAD.top + CHART_H - 6}
            fill="var(--muted-foreground)"
            opacity={0.45}
            fontSize={9}
          >
            Higher knowledge risk
          </text>
          <text
            x={PAD.left + CHART_W - 4}
            y={PAD.top + 12}
            textAnchor="end"
            fill="var(--muted-foreground)"
            opacity={0.45}
            fontSize={9}
          >
            More resilient
          </text>

          {/* Grid */}
          {Y_TICKS.map((tick) => {
            const y = yPos(tick);
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + CHART_W}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={tick === 0 ? undefined : "4 4"}
                  opacity={tick === 0 ? 1 : 0.65}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--muted-foreground)"
                  fontSize={10}
                >
                  {tick}
                </text>
              </g>
            );
          })}
          {X_TICKS.map((tick) => {
            const x = xPos(tick);
            return (
              <g key={`x-${tick}`}>
                <line
                  x1={x}
                  y1={PAD.top}
                  x2={x}
                  y2={PAD.top + CHART_H}
                  stroke="var(--border)"
                  strokeDasharray={tick === 0 ? undefined : "4 4"}
                  opacity={0.5}
                />
                <text
                  x={x}
                  y={PAD.top + CHART_H + 16}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize={10}
                >
                  {tick === X_MAX ? "8+" : tick}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={PAD.left}
            y1={PAD.top + CHART_H}
            x2={PAD.left + CHART_W}
            y2={PAD.top + CHART_H}
            stroke="var(--foreground)"
            strokeOpacity={0.25}
          />
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={PAD.top + CHART_H}
            stroke="var(--foreground)"
            strokeOpacity={0.25}
          />

          {/* Axis titles */}
          <text
            x={PAD.left + CHART_W / 2}
            y={H - 6}
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize={11}
            fontWeight={600}
          >
            Active collaborators
          </text>
          <text
            x={14}
            y={PAD.top + CHART_H / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${PAD.top + CHART_H / 2})`}
            fill="var(--foreground)"
            fontSize={11}
            fontWeight={600}
          >
            Health score
          </text>

          {/* Points */}
          {plotted.map((repo, i) => {
            const level = riskLevel(repo);
            const style = RISK_STYLE[level];
            const cx = xPos(repo.contributors);
            const cy = yPos(repo.health);
            const custody =
              repo.busFactor <= 1
                ? "Single maintainer"
                : repo.busFactor === 2
                  ? "Thin team (2)"
                  : "Distributed team";
            return (
              <g key={`${repo.id}-${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={1.5}
                  opacity={0.92}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="transparent"
                  className="cursor-pointer"
                >
                  <title>
                    {repo.fullName}
                    {"\n"}Health: {repo.health}/100
                    {"\n"}Collaborators: {repo.contributors}
                    {"\n"}Custody: {custody}
                  </title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {(Object.keys(RISK_STYLE) as Array<keyof typeof RISK_STYLE>).map(
          (key) => (
            <li key={key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: RISK_STYLE[key].fill }}
                aria-hidden
              />
              {RISK_STYLE[key].label}
            </li>
          ),
        )}
      </ul>

      <ul className="divide-y divide-border/50 rounded-lg border border-border/50 bg-card/50">
        {plotted.map((repo) => {
          const level = riskLevel(repo);
          const style = RISK_STYLE[level];
          return (
            <li
              key={repo.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <Link
                href={repo.detailHref}
                className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground hover:text-primary"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: style.fill }}
                  aria-hidden
                />
                <span className="truncate">{repo.name}</span>
              </Link>
              <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                {repo.contributors} collaborator
                {repo.contributors === 1 ? "" : "s"} · {repo.health}/100 health
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
