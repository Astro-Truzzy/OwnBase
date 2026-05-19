"use client";

import { useEffect, useMemo, useState } from "react";

type CompareOption = "previous_quarter" | "industry_average";

interface SystemHealthTrendChartProps {
  months: string[];
  currentValues: number[];
  previousQuarterValues: number[];
  industryAverageValues: number[];
  empty?: boolean;
  emptyMessage?: string;
}

const MIN_Y = 70;
const MAX_Y = 100;
const TICK_VALUES = [70, 75, 80, 85, 90, 95, 100];

function toSvgPoint(
  index: number,
  value: number,
  total: number,
  width: number,
  height: number,
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
  empty = false,
  emptyMessage = "No trend data yet.",
}: SystemHealthTrendChartProps) {
  const [compareTo, setCompareTo] = useState<CompareOption>("previous_quarter");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const compareValues =
    compareTo === "previous_quarter"
      ? previousQuarterValues
      : industryAverageValues;

  const canCompare = !empty && compareValues.length >= 2;

  const { currentPoints, comparePoints, areaPolygon } = useMemo(() => {
    if (empty || currentValues.length === 0) {
      return { currentPoints: "", comparePoints: "", areaPolygon: "" };
    }
    const chartWidth = 360;
    const chartHeight = 180;
    const current = currentValues
      .map((v, i) =>
        toSvgPoint(i, v, currentValues.length, chartWidth, chartHeight),
      )
      .join(" ");
    const compare = compareValues
      .map((v, i) =>
        toSvgPoint(i, v, compareValues.length, chartWidth, chartHeight),
      )
      .join(" ");

    const firstX = 0;
    const lastX = chartWidth;
    const polygon = `${firstX},${chartHeight} ${current} ${lastX},${chartHeight}`;
    return {
      currentPoints: current,
      comparePoints: compare,
      areaPolygon: polygon,
    };
  }, [currentValues, compareValues, empty]);

  if (empty || currentValues.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-cyan-200/25 bg-[#070b14]/60 px-6 py-10 text-center">
        <p className="max-w-md text-sm leading-relaxed text-cyan-100/70">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-200/20 bg-[#070b14]/80 p-4 shadow-[0_18px_45px_rgba(2,10,35,0.35)] backdrop-blur-sm">
      {canCompare && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="text-xs uppercase tracking-wider text-cyan-100/70">
            Compare to:
          </span>
          <label className="sr-only" htmlFor="compare-to">
            Compare to
          </label>
          <select
            id="compare-to"
            value={compareTo}
            onChange={(e) => setCompareTo(e.target.value as CompareOption)}
            className="rounded-md border border-cyan-200/30 bg-[#090f1d] px-2 py-1 text-xs text-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
          >
            <option value="previous_quarter">Previous Quarter</option>
            <option value="industry_average">Industry Average</option>
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative w-9 text-right text-[10px] text-cyan-100/50">
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
          <svg
            viewBox="0 0 360 180"
            className="h-48 w-full"
            aria-label="System health trend chart"
          >
            <defs>
              <linearGradient
                id="healthAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.03" />
              </linearGradient>
              <linearGradient
                id="healthLineGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            {TICK_VALUES.map((tick) => {
              const y = 180 - ((tick - MIN_Y) / (MAX_Y - MIN_Y)) * 180;
              return (
                <line
                  key={tick}
                  x1="0"
                  y1={y}
                  x2="360"
                  y2={y}
                  stroke="rgba(130, 151, 190, 0.24)"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={areaPolygon}
              fill="url(#healthAreaGradient)"
              style={{
                animation: reducedMotion ? "none" : "fadeArea 0.9s ease-out",
              }}
            />

            {canCompare && (
              <polyline
                points={comparePoints}
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
                strokeDasharray="5 5"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="opacity-80"
              />
            )}

            <polyline
              points={currentPoints}
              fill="none"
              stroke="url(#healthLineGradient)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                animation: reducedMotion ? "none" : "drawLine 1s ease-out",
              }}
            />

            {currentValues.map((value, idx) => {
              const point = toSvgPoint(
                idx,
                value,
                currentValues.length,
                360,
                180,
              );
              const [cx, cy] = point.split(",");
              return (
                <circle
                  key={`dot-${idx}`}
                  cx={cx}
                  cy={cy}
                  r="2.8"
                  fill="#67e8f9"
                  stroke="#050914"
                  strokeWidth="1.2"
                  className="transition duration-300 hover:r-[4.2]"
                />
              );
            })}
          </svg>

          <div
            className="mt-2 grid text-center text-xs text-cyan-100/60"
            style={{
              gridTemplateColumns: `repeat(${Math.max(months.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes drawLine {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeArea {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
