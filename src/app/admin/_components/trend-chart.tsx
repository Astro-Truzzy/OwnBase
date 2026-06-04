"use client";

import { useMemo, useState } from "react";
import type { DaySeries } from "@/lib/admin/metrics";

const CHART_W = 480;
const CHART_H = 180;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function computeScale(values: number[]) {
  const active = values.filter((v) => v > 0);
  if (active.length === 0) return { min: 0, max: 5, ticks: [0, 1, 2, 3, 4, 5] };
  const maxV = Math.max(...active);
  const niceMax = Math.ceil(maxV * 1.2) || 5;
  const step = Math.max(1, Math.ceil(niceMax / 4));
  const ticks: number[] = [];
  for (let t = 0; t <= niceMax; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] < niceMax) ticks.push(ticks[ticks.length - 1] + step);
  return { min: 0, max: ticks[ticks.length - 1], ticks };
}

function toPoints(series: DaySeries[], yMin: number, yMax: number): string {
  if (series.length === 0) return "";
  const xStep = PLOT_W / Math.max(series.length - 1, 1);
  return series
    .map((d, i) => {
      const x = PAD.left + i * xStep;
      const y = PAD.top + PLOT_H - ((d.value - yMin) / (yMax - yMin || 1)) * PLOT_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function toAreaPath(series: DaySeries[], yMin: number, yMax: number): string {
  if (series.length === 0) return "";
  const xStep = PLOT_W / Math.max(series.length - 1, 1);
  const pts = series.map((d, i) => {
    const x = PAD.left + i * xStep;
    const y = PAD.top + PLOT_H - ((d.value - yMin) / (yMax - yMin || 1)) * PLOT_H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const baseline = (PAD.top + PLOT_H).toFixed(1);
  const firstX = PAD.left.toFixed(1);
  const lastX = (PAD.left + (series.length - 1) * xStep).toFixed(1);
  return `M ${firstX},${baseline} L ${pts.join(" L ")} L ${lastX},${baseline} Z`;
}

interface TrendChartProps {
  title: string;
  series: DaySeries[];
  color?: "cyan" | "violet" | "emerald";
  emptyMessage?: string;
}

export function TrendChart({
  title,
  series,
  color = "cyan",
  emptyMessage = "No data yet.",
}: TrendChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

  const colors = {
    cyan: { stroke: "var(--accent)", fill: "rgba(8,145,178,0.12)", dot: "var(--accent)" },
    violet: { stroke: "#7c3aed", fill: "rgba(124,58,237,0.12)", dot: "#7c3aed" },
    emerald: { stroke: "#059669", fill: "rgba(5,150,105,0.12)", dot: "#059669" },
  }[color];

  const { min, max, ticks } = useMemo(() => computeScale(series.map((d) => d.value)), [series]);
  const polylinePoints = useMemo(() => toPoints(series, min, max), [series, min, max]);
  const areaPath = useMemo(() => toAreaPath(series, min, max), [series, min, max]);

  const hasData = series.some((d) => d.value > 0);
  const xStep = PLOT_W / Math.max(series.length - 1, 1);

  function formatDay(iso: string) {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
  }

  // x-axis label interval to avoid crowding
  const labelEvery = Math.ceil(series.length / 6);

  return (
    <div className="dash-chart-panel rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      {!hasData ? (
        <div className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full"
            style={{ height: CHART_H }}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Gridlines */}
            {ticks.map((tick) => {
              const y = PAD.top + PLOT_H - ((tick - min) / (max - min || 1)) * PLOT_H;
              return (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + PLOT_W}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 6}
                    y={y + 4}
                    fontSize={10}
                    textAnchor="end"
                    fill="currentColor"
                    opacity={0.45}
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaPath} fill={colors.fill} />

            {/* Line */}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Data points & invisible hover targets */}
            {series.map((d, i) => {
              const x = PAD.left + i * xStep;
              const y = PAD.top + PLOT_H - ((d.value - min) / (max - min || 1)) * PLOT_H;
              return (
                <g key={d.day}>
                  <circle cx={x} cy={y} r={3} fill={colors.dot} />
                  <rect
                    x={x - 12}
                    y={PAD.top}
                    width={24}
                    height={PLOT_H}
                    fill="transparent"
                    onMouseEnter={() =>
                      setTooltip({ x, y, label: formatDay(d.day), value: d.value })
                    }
                  />
                </g>
              );
            })}

            {/* X-axis labels */}
            {series.map((d, i) => {
              if (i % labelEvery !== 0 && i !== series.length - 1) return null;
              const x = PAD.left + i * xStep;
              return (
                <text
                  key={d.day}
                  x={x}
                  y={CHART_H - 4}
                  fontSize={10}
                  textAnchor="middle"
                  fill="currentColor"
                  opacity={0.45}
                >
                  {formatDay(d.day)}
                </text>
              );
            })}

            {/* Tooltip */}
            {tooltip && (
              <g>
                <line
                  x1={tooltip.x}
                  x2={tooltip.x}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                  stroke={colors.stroke}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <rect
                  x={Math.min(tooltip.x + 8, CHART_W - 80)}
                  y={tooltip.y - 22}
                  width={72}
                  height={20}
                  rx={4}
                  fill="var(--card)"
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={Math.min(tooltip.x + 44, CHART_W - 44)}
                  y={tooltip.y - 8}
                  fontSize={11}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {tooltip.label}: {tooltip.value}
                </text>
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
