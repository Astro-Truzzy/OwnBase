"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

/**
 * Illustration: business owner controlling multiple software projects from a dashboard.
 * Parts animate in from different directions and come together.
 */
const STAGGER = 0.08;
const DURATION = 0.5;

export function HeroIllustration() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const baseTransition = { duration: DURATION, ease: "easeOut" as const };

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 480 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main dashboard frame — scales in as the "stage" */}
      <motion.rect
        x="24"
        y="24"
        width="432"
        height="272"
        rx="16"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
        transition={{ ...baseTransition, delay: 0 }}
        style={{ transformOrigin: "240px 160px" }}
      />
      {/* Window header — slides down from above */}
      <motion.g
        initial={{ opacity: 0, y: -28 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -28 }}
        transition={{ ...baseTransition, delay: STAGGER * 1 }}
      >
        <rect
          x="32"
          y="32"
          width="416"
          height="32"
          rx="6"
          fill="var(--background)"
        />
        <circle cx="52" cy="48" r="5" fill="var(--muted)" fillOpacity="0.5" />
        <circle cx="72" cy="48" r="5" fill="var(--muted)" fillOpacity="0.5" />
        <circle cx="92" cy="48" r="5" fill="var(--muted)" fillOpacity="0.5" />
        <rect
          x="120"
          y="42"
          width="120"
          height="8"
          rx="4"
          fill="var(--border)"
          fillOpacity="0.4"
        />
      </motion.g>
      {/* Sidebar — project list — slides in from left */}
      <motion.g
        initial={{ opacity: 0, x: -70 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -70 }}
        transition={{ ...baseTransition, delay: STAGGER * 2 }}
      >
        <rect x="32" y="76" width="100" height="204" rx="8" fill="var(--background)" />
        <rect x="44" y="92" width="76" height="6" rx="3" fill="var(--muted)" fillOpacity="0.6" />
        <rect x="44" y="108" width="60" height="6" rx="3" fill="var(--accent)" fillOpacity="0.4" />
        <rect x="44" y="124" width="76" height="6" rx="3" fill="var(--muted)" fillOpacity="0.5" />
        <rect x="44" y="140" width="68" height="6" rx="3" fill="var(--muted)" fillOpacity="0.5" />
        <rect x="44" y="156" width="72" height="6" rx="3" fill="var(--muted)" fillOpacity="0.5" />
      </motion.g>
      {/* Left project card — slides in from left */}
      <motion.g
        initial={{ opacity: 0, x: -90 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -90 }}
        transition={{ ...baseTransition, delay: STAGGER * 3 }}
      >
        <rect
          x="148"
          y="76"
          width="148"
          height="92"
          rx="8"
          fill="var(--background)"
          stroke="var(--border)"
          strokeWidth="0.5"
        />
        <rect x="164" y="92" width="80" height="6" rx="2" fill="var(--border)" fillOpacity="0.5" />
        <rect x="164" y="106" width="100" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
        <rect x="164" y="120" width="60" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
        <rect x="164" y="138" width="40" height="20" rx="4" fill="var(--accent)" fillOpacity="0.25" />
      </motion.g>
      {/* Right project card — slides in from right */}
      <motion.g
        initial={{ opacity: 0, x: 90 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 90 }}
        transition={{ ...baseTransition, delay: STAGGER * 4 }}
      >
        <rect
          x="308"
          y="76"
          width="132"
          height="92"
          rx="8"
          fill="var(--background)"
          stroke="var(--border)"
          strokeWidth="0.5"
        />
        <rect x="324" y="92" width="70" height="6" rx="2" fill="var(--border)" fillOpacity="0.5" />
        <rect x="324" y="106" width="90" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
        <rect x="324" y="138" width="48" height="20" rx="4" fill="var(--border)" fillOpacity="0.3" />
      </motion.g>
      {/* Access / control strip — slides up from below */}
      <motion.g
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ ...baseTransition, delay: STAGGER * 5 }}
      >
        <rect
          x="148"
          y="184"
          width="292"
          height="84"
          rx="8"
          fill="var(--background)"
          stroke="var(--border)"
          strokeWidth="0.5"
        />
        <rect x="164" y="200" width="120" height="6" rx="2" fill="var(--muted)" fillOpacity="0.6" />
        <rect x="164" y="218" width="260" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
        <rect x="164" y="234" width="200" height="6" rx="2" fill="var(--border)" fillOpacity="0.4" />
      </motion.g>
      {/* Accent — "in control" indicator — slides in from left, then subtle pulse */}
      <motion.g
        initial={{ opacity: 0, x: -12 }}
        animate={
          isInView
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: -12 }
        }
        transition={{ ...baseTransition, delay: STAGGER * 6 }}
      >
        <motion.rect
          x="148"
          y="76"
          width="4"
          height="92"
          rx="2"
          fill="var(--accent)"
          animate={
            isInView
              ? { opacity: [0.7, 1, 0.7] }
              : { opacity: 0 }
          }
          transition={{
            opacity: {
              delay: STAGGER * 6 + DURATION,
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      </motion.g>
    </motion.svg>
  );
}
