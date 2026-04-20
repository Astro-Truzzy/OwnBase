import { cn } from "@/lib/utils";
import React from "react";

export interface GridBackgroundProps {
  /** Extra class for the outer container */
  className?: string;
  /** Content to render above the grid (e.g. section content). Omit for grid-only. */
  children?: React.ReactNode;
  /** Show radial vignette overlay. Default true. */
  showVignette?: boolean;
  /** Grid cell size in pixels. Default 40. */
  gridSize?: number;
}

export function GridBackground({
  className,
  children,
  showVignette = true,
  gridSize = 40,
}: GridBackgroundProps) {
  return (
    <div
      className={cn("relative w-full min-h-[200px]", className)}
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Grid layer */}
      <div
        className="absolute inset-0 grid-bg-pattern"
        style={
          gridSize !== 40
            ? {
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }
            : undefined
        }
        aria-hidden
      />
      {/* Optional vignette */}
      {showVignette && (
        <div className="absolute inset-0 grid-bg-vignette" aria-hidden />
      )}
      {/* Foreground content */}
      {children != null && (
        <div className="relative z-10 w-full">{children}</div>
      )}
    </div>
  );
}
