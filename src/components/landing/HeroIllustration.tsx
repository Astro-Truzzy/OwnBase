"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

const S = 0.07;
const DUR = 0.45;

export function HeroIllustration() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const base = { duration: DUR, ease: "easeOut" as const };

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 540 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <defs>
        <linearGradient
          id="topBar"
          x1="20"
          y1="0"
          x2="520"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#22d3ee" stopOpacity="1" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="barGreenFull" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="barCyanFull" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="barAmberFull" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
        </linearGradient>
        <clipPath id="mainClip">
          <rect x="20" y="20" width="500" height="340" rx="14" />
        </clipPath>
      </defs>

      {/* Main window frame */}
      <motion.rect
        x="20"
        y="20"
        width="500"
        height="340"
        rx="14"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={
          inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }
        }
        transition={{ ...base, delay: 0 }}
        style={{ transformOrigin: "270px 190px" }}
      />

      {/* Accent gradient top border */}
      <motion.rect
        x="20"
        y="20"
        width="500"
        height="2"
        rx="2"
        fill="url(#topBar)"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={inView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ ...base, delay: S * 1 }}
        style={{ transformOrigin: "20px 21px" }}
      />

      {/* Title bar */}
      <motion.g
        initial={{ opacity: 0, y: -16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ ...base, delay: S * 1 }}
      >
        <rect
          x="28"
          y="28"
          width="484"
          height="32"
          rx="6"
          fill="var(--background)"
          fillOpacity="0.7"
        />
        {/* Traffic lights */}
        <circle cx="48" cy="44" r="4.5" fill="#ff5f57" fillOpacity="0.85" />
        <circle cx="65" cy="44" r="4.5" fill="#febc2e" fillOpacity="0.85" />
        <circle cx="82" cy="44" r="4.5" fill="#28c840" fillOpacity="0.85" />
        {/* Path bar */}
        <rect
          x="105"
          y="37"
          width="280"
          height="14"
          rx="4"
          fill="var(--border)"
          fillOpacity="0.7"
        />
        <rect
          x="113"
          y="42"
          width="8"
          height="4"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.5"
        />
        <rect
          x="127"
          y="42"
          width="55"
          height="4"
          rx="2"
          fill="var(--accent)"
          fillOpacity="0.4"
        />
        <rect
          x="186"
          y="42"
          width="6"
          height="4"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.3"
        />
        <rect
          x="198"
          y="42"
          width="70"
          height="4"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.4"
        />
        {/* Branch pill */}
        <rect
          x="406"
          y="36"
          width="90"
          height="16"
          rx="5"
          fill="var(--accent)"
          fillOpacity="0.1"
          stroke="var(--accent)"
          strokeOpacity="0.25"
          strokeWidth="0.75"
        />
        <rect
          x="414"
          y="41"
          width="6"
          height="6"
          rx="3"
          fill="var(--accent)"
          fillOpacity="0.6"
        />
        <rect
          x="424"
          y="43"
          width="36"
          height="4"
          rx="2"
          fill="var(--accent)"
          fillOpacity="0.5"
        />
      </motion.g>

      {/* Left sidebar */}
      <motion.g
        initial={{ opacity: 0, x: -40 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
        transition={{ ...base, delay: S * 2 }}
      >
        <rect
          x="28"
          y="72"
          width="108"
          height="276"
          rx="6"
          fill="var(--background)"
          fillOpacity="0.55"
        />
        {/* Nav items — highlighted = active */}
        {[
          { y: 88, w: 72, accent: false },
          { y: 108, w: 84, accent: true },
          { y: 128, w: 66, accent: false },
          { y: 148, w: 78, accent: false },
          { y: 168, w: 60, accent: false },
        ].map((item, i) => (
          <g key={i}>
            {item.accent && (
              <rect
                x="28"
                y={item.y - 3}
                width="3"
                height="14"
                rx="1.5"
                fill="var(--accent)"
              />
            )}
            <rect
              x="38"
              y={item.y}
              width={item.w}
              height="7"
              rx="3.5"
              fill={item.accent ? "var(--accent)" : "var(--muted)"}
              fillOpacity={item.accent ? 0.5 : 0.28}
            />
          </g>
        ))}
        {/* Divider */}
        <rect
          x="36"
          y="200"
          width="84"
          height="1"
          fill="var(--border)"
          fillOpacity="0.6"
        />
        {/* User / owner block */}
        <circle
          cx="52"
          cy="220"
          r="10"
          fill="var(--accent)"
          fillOpacity="0.12"
          stroke="var(--accent)"
          strokeOpacity="0.3"
          strokeWidth="0.75"
        />
        <rect
          x="48"
          y="216"
          width="8"
          height="8"
          rx="4"
          fill="var(--accent)"
          fillOpacity="0.5"
        />
        <rect
          x="66"
          y="217"
          width="46"
          height="6"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.4"
        />
        <rect
          x="66"
          y="227"
          width="30"
          height="4"
          rx="2"
          fill="var(--accent)"
          fillOpacity="0.3"
        />
      </motion.g>

      {/* Main content — repo file list */}
      <motion.g
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ ...base, delay: S * 3 }}
      >
        {/* Header row */}
        <rect
          x="148"
          y="72"
          width="360"
          height="28"
          rx="0"
          fill="var(--surface-elevated)"
          fillOpacity="0.6"
        />
        <rect
          x="160"
          y="82"
          width="55"
          height="6"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.55"
        />
        <rect
          x="340"
          y="82"
          width="50"
          height="6"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.4"
        />
        <rect
          x="440"
          y="82"
          width="45"
          height="6"
          rx="3"
          fill="var(--muted)"
          fillOpacity="0.4"
        />

        {/* File rows */}
        {[
          { nameW: 90, commitW: 110, isDir: true, accent: "cyan" },
          { nameW: 80, commitW: 85, isDir: true, accent: "none" },
          { nameW: 110, commitW: 95, isDir: false, accent: "violet" },
          { nameW: 70, commitW: 105, isDir: false, accent: "none" },
          { nameW: 95, commitW: 90, isDir: false, accent: "emerald" },
          { nameW: 60, commitW: 80, isDir: false, accent: "none" },
        ].map((row, i) => {
          const accentFill =
            row.accent === "cyan"
              ? "#22d3ee"
              : row.accent === "violet"
                ? "#a78bfa"
                : row.accent === "emerald"
                  ? "#34d399"
                  : "var(--muted)";
          const accentOp = row.accent !== "none" ? 0.7 : 0.38;
          return (
            <g key={i}>
              <rect
                x="148"
                y={100 + i * 22}
                width="360"
                height="21"
                fill={i % 2 === 0 ? "var(--surface)" : "transparent"}
                fillOpacity={i % 2 === 0 ? 0.25 : 0}
              />
              {/* Icon placeholder */}
              <rect
                x="160"
                y={107 + i * 22}
                width="11"
                height="7"
                rx="2"
                fill={accentFill}
                fillOpacity={row.isDir ? 0.5 : 0.3}
              />
              {/* File name */}
              <rect
                x="178"
                y={108 + i * 22}
                width={row.nameW}
                height="5"
                rx="2.5"
                fill={accentFill}
                fillOpacity={accentOp}
              />
              {/* Commit message */}
              <rect
                x="340"
                y={108 + i * 22}
                width={row.commitW}
                height="5"
                rx="2.5"
                fill="var(--muted)"
                fillOpacity="0.32"
              />
              {/* Time */}
              <rect
                x="440"
                y={108 + i * 22}
                width="42"
                height="5"
                rx="2.5"
                fill="var(--muted)"
                fillOpacity="0.22"
              />
            </g>
          );
        })}
      </motion.g>

      {/* Bottom left — Access control card */}
      <motion.g
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ ...base, delay: S * 4 }}
      >
        <rect
          x="148"
          y="242"
          width="168"
          height="98"
          rx="8"
          fill="var(--background)"
          fillOpacity="0.65"
          stroke="var(--border)"
          strokeWidth="0.75"
        />
        {/* Label */}
        <rect
          x="160"
          y="254"
          width="55"
          height="5"
          rx="2.5"
          fill="var(--accent)"
          fillOpacity="0.55"
        />
        {/* Contributors */}
        {[
          { color: "#22d3ee", role: 48, active: true },
          { color: "#34d399", role: 42, active: true },
          { color: "#a78bfa", role: 36, active: false },
        ].map((u, i) => (
          <g key={i}>
            <circle
              cx="164"
              cy={272 + i * 20}
              r="7"
              fill={u.color}
              fillOpacity="0.15"
              stroke={u.color}
              strokeOpacity="0.35"
              strokeWidth="0.75"
            />
            <circle
              cx="164"
              cy={272 + i * 20}
              r="3"
              fill={u.color}
              fillOpacity={u.active ? 0.7 : 0.3}
            />
            <rect
              x="177"
              y={269 + i * 20}
              width={u.role}
              height="5"
              rx="2.5"
              fill="var(--muted)"
              fillOpacity="0.4"
            />
            <circle
              cx={177 + u.role + 8}
              cy={271 + i * 20 + 2}
              r="3"
              fill={u.active ? "#34d399" : "var(--muted)"}
              fillOpacity={u.active ? 0.8 : 0.25}
            />
          </g>
        ))}
        {/* Revoke button outline */}
        <rect
          x="160"
          y="326"
          width="58"
          height="10"
          rx="3"
          fill="var(--border)"
          fillOpacity="0.8"
          stroke="var(--border)"
          strokeWidth="0.5"
        />
        <rect
          x="166"
          y="329"
          width="38"
          height="4"
          rx="2"
          fill="var(--muted)"
          fillOpacity="0.4"
        />
      </motion.g>

      {/* Bottom right — AI metrics card */}
      <motion.g
        initial={{ opacity: 0, x: 28 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 28 }}
        transition={{ ...base, delay: S * 5 }}
      >
        <rect
          x="328"
          y="242"
          width="180"
          height="98"
          rx="8"
          fill="var(--background)"
          fillOpacity="0.65"
          stroke="var(--border)"
          strokeWidth="0.75"
        />
        {/* AI badge */}
        <rect
          x="340"
          y="252"
          width="44"
          height="13"
          rx="4"
          fill="var(--accent)"
          fillOpacity="0.1"
          stroke="var(--accent)"
          strokeOpacity="0.3"
          strokeWidth="0.75"
        />
        <rect
          x="346"
          y="256"
          width="32"
          height="5"
          rx="2.5"
          fill="var(--accent)"
          fillOpacity="0.55"
        />
        {/* Insight text lines */}
        <rect
          x="340"
          y="272"
          width="152"
          height="5"
          rx="2.5"
          fill="var(--muted)"
          fillOpacity="0.42"
        />
        <rect
          x="340"
          y="283"
          width="120"
          height="5"
          rx="2.5"
          fill="var(--muted)"
          fillOpacity="0.32"
        />
        {/* Health bars */}
        <rect
          x="340"
          y="297"
          width="152"
          height="5"
          rx="2.5"
          fill="var(--border)"
          fillOpacity="0.9"
        />
        <rect
          x="340"
          y="297"
          width="130"
          height="5"
          rx="2.5"
          fill="url(#barGreenFull)"
        />
        <rect
          x="340"
          y="308"
          width="152"
          height="5"
          rx="2.5"
          fill="var(--border)"
          fillOpacity="0.9"
        />
        <rect
          x="340"
          y="308"
          width="95"
          height="5"
          rx="2.5"
          fill="url(#barCyanFull)"
        />
        <rect
          x="340"
          y="319"
          width="152"
          height="5"
          rx="2.5"
          fill="var(--border)"
          fillOpacity="0.9"
        />
        <rect
          x="340"
          y="319"
          width="68"
          height="5"
          rx="2.5"
          fill="url(#barAmberFull)"
        />
      </motion.g>

      {/* Pulsing active indicator dot */}
      <motion.circle
        cx="152"
        cy="106"
        r="3"
        fill="var(--accent)"
        animate={inView ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
        transition={{
          opacity: {
            delay: S * 6 + DUR,
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
    </motion.svg>
  );
}
