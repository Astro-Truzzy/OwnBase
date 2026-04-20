"use client";

import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently in view (top of viewport).
 * Uses scroll position: the active section is the one whose top has
 * passed a threshold (e.g. 1/4 of viewport from top).
 */
export function useActiveSection(sectionIds: string[], thresholdFraction = 0.25): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const threshold = () => window.innerHeight * thresholdFraction;

    const updateActive = () => {
      let current: string | null = null;
      let currentTop = -Infinity;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Section is "in view" if its top is at or above the threshold
        if (rect.top <= threshold() && rect.top > currentTop) {
          currentTop = rect.top;
          current = id;
        }
      }

      // If none passed threshold (e.g. page just loaded), use the first section that's visible
      if (!current && sectionIds.length) {
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            current = id;
            break;
          }
        }
      }

      setActiveId((prev) => (prev !== current ? current : prev));
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [sectionIds.join(","), thresholdFraction]);

  return activeId;
}
