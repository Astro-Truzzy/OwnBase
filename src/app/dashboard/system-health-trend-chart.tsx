"use client";

import { useMemo, useState } from "react";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";

type CompareOption = "previous_quarter" | "industry_average";

interface SystemHealthTrendChartProps {
  months: string[];
  currentValues: number[];
  previousQuarterValues: number[];
  industryAverageValues: number[];
  empty?: boolean;
  emptyMessage?: string;
}

const CHART_W = 420;
const CHART_H = 208;
const PAD = { top: 14, right: 16, bottom: 32, left: 40 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function hasValue(value: number) {
  return Number.isFinite(value) && value > 0;
}

function computeYDomain(values: number[]) {
  const active = values.filter(hasValue);
  if (active.length === 0) {
    return { min: 70, max: 100, ticks: [70, 80, 90, 100] };
  }

  const min = Math.min(...active);
  const max = Math.max(...active);
  const spread = Math.max(max - min, 8);
  const padding = Math.max(4, Math.round(spread * 0.2));

  let yMin = Math.max(0, Math.floor((min - padding) / 5) * 5);
  let yMax = Math.min(100, Math.ceil((max + padding) / 5) * 5);

  if (yMax - yMin < 12) {
    const mid = (yMin + yMax) / 2;
    yMin = Math.max(0, Math.floor((mid - 6) / 5) * 5);
    yMax = Math.min(100, Math.ceil((mid + 6) / 5) * 5);
  }

  const ticks: number[] = [];
  for (let tick = yMin; tick <= yMax; tick += 5) {
    ticks.push(tick);
  }

  return { min: yMin, max: yMax, ticks };
}

function xAt(index: number, total: number) {
  if (total <= 1) return PAD.left + PLOT_W / 2;
  return PAD.left + (index / (total - 1)) * PLOT_W;
}

function yAt(value: number, yMin: number, yMax: number) {
  const normalized = (value - yMin) / Math.max(yMax - yMin, 1);
  return PAD.top + PLOT_H - normalized * PLOT_H;
}

function contiguousRuns(length: number, isActive: (index: number) => boolean) {
  const runs: number[][] = [];
  let run: number[] = [];

  for (let index = 0; index < length; index++) {
    if (isActive(index)) {
      run.push(index);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }

  if (run.length > 0) runs.push(run);
  return runs;
}

function pointsForIndices(
  indices: number[],
  values: number[],
  yMin: number,
  yMax: number,
) {
  return indices
    .map((index) => {
      const value = values[index];
      if (!hasValue(value)) return null;
      return `${xAt(index, values.length)},${yAt(value, yMin, yMax)}`;
    })
    .filter(Boolean)
    .join(" ");
}

function areaForRun(
  indices: number[],
  values: number[],
  yMin: number,
  yMax: number,
) {
  if (indices.length === 0) return "";

  const linePoints = indices
    .map(
      (index) =>
        `${xAt(index, values.length)},${yAt(values[index], yMin, yMax)}`,
    )
    .join(" ");
  const baseY = PAD.top + PLOT_H;
  const firstX = xAt(indices[0], values.length);
  const lastX = xAt(indices[indices.length - 1], values.length);

  return `${firstX},${baseY} ${linePoints} ${lastX},${baseY}`;
}

export function SystemHealthTrendChart({
  months,
  currentValues,
  previousQuarterValues,
  industryAverageValues,
  empty = false,
  emptyMessage = "No trend data yet.",
}: SystemHealthTrendChartProps) {
  const [compareTo, setCompareTo] = useState<CompareOption>("previous_quarter");

  const compareValues =
    compareTo === "previous_quarter"
      ? previousQuarterValues
      : industryAverageValues;

  const activePointCount = currentValues.filter(hasValue).length;

  const chart = useMemo(() => {
    if (empty || currentValues.length === 0 || activePointCount === 0) {
      return null;
    }

    const yDomain = computeYDomain([
      ...currentValues,
      ...compareValues.filter(hasValue),
    ]);

    const currentRuns = contiguousRuns(currentValues.length, (index) =>
      hasValue(currentValues[index]),
    );
    const compareRuns = contiguousRuns(compareValues.length, (index) =>
      hasValue(compareValues[index]),
    );

    const latestIndex = currentValues.reduce(
      (latest, value, index) => (hasValue(value) ? index : latest),
      -1,
    );

    return {
      yDomain,
      currentRuns,
      compareRuns,
      latestIndex,
    };
  }, [activePointCount, compareValues, currentValues, empty]);

  const canCompare =
    !empty && compareValues.filter(hasValue).length >= 2 && chart != null;

  if (!chart) {
    return (
      <p className="border-y border-border py-8 text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const { yDomain, currentRuns, compareRuns, latestIndex } = chart;

  return (
    <div className="rounded-lg border border-border">
      {canCompare ? (
        <div className="flex items-center justify-end gap-2 border-b border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">Compare</span>
          <DashboardSelect
            value={compareTo}
            onChange={(value) => setCompareTo(value as CompareOption)}
            options={[
              { value: "previous_quarter", label: "Previous quarter" },
              { value: "industry_average", label: "Industry average" },
            ]}
            size="compact"
            className="min-w-[10.5rem]"
            id="compare-to"
          />
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="h-[13.5rem] w-full text-foreground"
        aria-label="Activity recency trend chart"
        role="img"
      >
        <defs>
          <linearGradient id="healthAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yDomain.ticks.map((tick) => {
          const y = yAt(tick, yDomain.min, yDomain.max);
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                y1={y}
                x2={CHART_W - PAD.right}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y + 3}
                textAnchor="end"
                fill="currentColor"
                className="text-[10px] text-muted-foreground"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {currentRuns.map((run, runIndex) => (
          <polygon
            key={`area-${runIndex}`}
            points={areaForRun(run, currentValues, yDomain.min, yDomain.max)}
            fill="url(#healthAreaGradient)"
          />
        ))}

        {canCompare
          ? compareRuns.map((run, runIndex) => (
              <polyline
                key={`compare-${runIndex}`}
                points={pointsForIndices(
                  run,
                  compareValues,
                  yDomain.min,
                  yDomain.max,
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="5 5"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="text-muted-foreground opacity-75"
              />
            ))
          : null}

        {currentRuns.map((run, runIndex) => (
          <polyline
            key={`line-${runIndex}`}
            points={pointsForIndices(
              run,
              currentValues,
              yDomain.min,
              yDomain.max,
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {currentValues.map((value, index) => {
          if (!hasValue(value)) return null;
          const cx = xAt(index, currentValues.length);
          const cy = yAt(value, yDomain.min, yDomain.max);
          const isLatest = index === latestIndex;

          return (
            <g key={`dot-${index}`}>
              {isLatest ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill="currentColor"
                  className="text-foreground"
                  fillOpacity="0.12"
                />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={isLatest ? 3.5 : 2.5}
                fill="currentColor"
                className="text-foreground"
              />
            </g>
          );
        })}

        {months.map((month, index) => (
          <text
            key={`${month}-${index}`}
            x={xAt(index, months.length)}
            y={CHART_H - 10}
            textAnchor="middle"
            fill="currentColor"
            className={`text-[11px] ${
              hasValue(currentValues[index] ?? 0)
                ? "font-medium text-foreground/85"
                : "text-muted-foreground"
            }`}
          >
            {month}
          </text>
        ))}
      </svg>
    </div>
  );
}
