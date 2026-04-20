"use client";

import { useMemo, useState } from "react";

type CompareOption = "previous_quarter" | "industry_average";

interface SystemHealthTrendChartProps {
  months: string[];
  currentValues: number[];
  previousQuarterValues: number[];
  industryAverageValues: number[];
}

const MIN_Y = 70;
const MAX_Y = 100;
const TICK_VALUES = [70, 75, 80, 85, 90, 95, 100];

function toSvgPoint(
  index: number,
  value: number,
  total: number,
  width: number,
  height: number
): string {
  const x = total <= 1 ? 0 : (index / (total - 1)) * width;
  const normalized = (value - MIN_Y) / (MAX_Y - MIN_Y);
  const y = height - normalized * height;
  return `${x},${Math.max(0, Math.min(height, y))}`;
}

export function SystemHealthTrendChart({
  months,
  currentValues,
  previousQuarterValues,
  industryAverageValues,
}: SystemHealthTrendChartProps) {
  const [compareTo, setCompareTo] = useState<CompareOption>("previous_quarter");

  const compareValues =
    compareTo === "previous_quarter"
      ? previousQuarterValues
      : industryAverageValues;

  const { currentPoints, comparePoints, areaPolygon } = useMemo(() => {
    const chartWidth = 360;
    const chartHeight = 180;
    const current = currentValues
      .map((v, i) => toSvgPoint(i, v, currentValues.length, chartWidth, chartHeight))
      .join(" ");
    const compare = compareValues
      .map((v, i) => toSvgPoint(i, v, compareValues.length, chartWidth, chartHeight))
      .join(" ");

    const firstX = 0;
    const lastX = chartWidth;
    const polygon = `${firstX},${chartHeight} ${current} ${lastX},${chartHeight}`;
    return {
      currentPoints: current,
      comparePoints: compare,
      areaPolygon: polygon,
    };
  }, [currentValues, compareValues]);

  return (
    <div className="rounded-sm border border-border bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-end gap-2">
        <span className="text-xs text-muted">Compare to:</span>
        <label className="sr-only" htmlFor="compare-to">
          Compare to
        </label>
        <select
          id="compare-to"
          value={compareTo}
          onChange={(e) => setCompareTo(e.target.value as CompareOption)}
          className="rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="previous_quarter">Previous Quarter</option>
          <option value="industry_average">Industry Average</option>
        </select>
      </div>

      <div className="flex gap-3">
        <div className="relative w-9 text-right text-[10px] text-muted">
          {TICK_VALUES.slice()
            .reverse()
            .map((tick) => (
              <div
                key={tick}
                className="absolute right-0 translate-y-1/2"
                style={{
                  top: `${((MAX_Y - tick) / (MAX_Y - MIN_Y)) * 100}%`,
                }}
              >
                {tick}
              </div>
            ))}
        </div>

        <div className="relative flex-1">
          <svg viewBox="0 0 360 180" className="h-48 w-full" aria-label="System health trend chart">
            {TICK_VALUES.map((tick) => {
              const y = 180 - ((tick - MIN_Y) / (MAX_Y - MIN_Y)) * 180;
              return (
                <line
                  key={tick}
                  x1="0"
                  y1={y}
                  x2="360"
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
              );
            })}

            <polygon points={areaPolygon} fill="var(--foreground)" opacity="0.08" />

            <polyline
              points={comparePoints}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            <polyline
              points={currentPoints}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {currentValues.map((value, idx) => {
              const point = toSvgPoint(idx, value, currentValues.length, 360, 180);
              const [cx, cy] = point.split(",");
              return (
                <circle
                  key={`dot-${idx}`}
                  cx={cx}
                  cy={cy}
                  r="2.8"
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  strokeWidth="1.2"
                />
              );
            })}
          </svg>

          <div className="mt-2 grid grid-cols-6 text-center text-xs text-muted">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
