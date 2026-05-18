"use client";

import { motion } from "motion/react";

export function HeroBands() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[160vh] overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 dark:filter-[brightness(1.15)_contrast(1.05)_saturate(1.08)]"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 0%, black 42%, transparent 70%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 42%, transparent 70%)",
          clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)",
        }}
        animate={{
          clipPath: [
            "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)",
            "polygon(-22% 100%, 100% -22%, 100% 100%, -22% 100%)",
            "polygon(-5% -5%, 105% -5%, 105% 105%, -5% 105%)",
          ],
        }}
        transition={{
          duration: 2.2,
          ease: [0.16, 1, 0.3, 1],
          times: [0, 0.55, 1],
          delay: 0.15,
        }}
      >
        <svg
          viewBox="0 0 100 56"
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden
        >
          {/* 3 thin bands — each ~⅓ the width of the original 5 */}
          <polygon
            points="100,0 0,56 7,56 100,3.92"
            fill="rgba(33,150,243,0.88)"
          />
          <polygon
            points="100,3.92 7,56 18,56 100,10.08"
            fill="rgba(66,165,245,0.60)"
          />
          <polygon
            points="100,10.08 18,56 35,56 100,19.6"
            fill="rgba(100,181,246,0.32)"
          />
        </svg>
      </motion.div>
    </div>
  );
}
