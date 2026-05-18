"use client";

import { motion } from "motion/react";
import { IconLock, IconWorld, IconShieldCheck } from "@tabler/icons-react";

/* ─── SVG connector ─── */

// Strategy: stack a blue dotted path + bright blue circles on top of the gray base,
// then reveal them via a <mask> whose fill is a linearGradient that slides left→right.
// animateTransform on gradientTransform operates in SVG user-space units so it scales
// correctly at every viewport width (unlike CSS translateX which uses CSS pixels).
//
// Cycle: 2.8 s sweep + 1.4 s pause = 4.2 s total
//   keyTimes: "0 ; 0.667 ; 1"  →  gradient moves -200→1000 (off-left to off-right),
//   then holds at 1000 for the remaining 1.4 s (rect stays off-screen right).

function ConnectorSVG() {
  const path = "M 167 25 C 285 42, 390 8, 500 25 C 610 42, 715 8, 833 25";
  const dotXs = [167, 500, 833];

  return (
    <svg
      width="100%"
      height="50"
      viewBox="0 0 1000 50"
      preserveAspectRatio="none"
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        {/*
          200-unit wide gradient: 40-unit soft fade on each edge, 120-unit opaque centre.
          gradientTransform translates from -200 (gradient fully off-screen left)
          to 1000 (gradient fully off-screen right), traveling through the whole viewBox.
        */}
        <linearGradient
          id="sweepFade"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="200"
          y2="0"
        >
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="20%" stopColor="white" stopOpacity="1" />
          <stop offset="80%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* animateTransform is valid SVG SMIL but absent from React's JSX types */}
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="-200 0; 1000 0; 1000 0"
            keyTimes="0; 0.667; 1"
            dur="4.2s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </linearGradient>

        {/* Mask: a static rect covering the full viewBox, painted with the moving gradient */}
        <mask id="sweepMask">
          <rect x="0" y="-5" width="1000" height="60" fill="url(#sweepFade)" />
        </mask>
      </defs>

      {/* ── Gray base — softer in dark mode so it sits on charcoal */}
      <path
        d={path}
        fill="none"
        className="stroke-slate-300 dark:stroke-slate-600/85"
        strokeWidth="1.5"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />
      {dotXs.map((cx) => (
        <g key={cx}>
          <circle
            cx={cx}
            cy={25}
            r={9}
            className="fill-white dark:fill-[#080c14]"
          />
          <circle
            cx={cx}
            cy={25}
            r={4.5}
            className="fill-sky-200 dark:fill-sky-900/40"
          />
        </g>
      ))}

      {/* ── Blue sweep layer */}
      <g mask="url(#sweepMask)">
        <path
          d={path}
          fill="none"
          className="stroke-blue-500 dark:stroke-cyan-400/95"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
        {dotXs.map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy={25}
            r={6}
            className="fill-blue-600 dark:fill-cyan-400"
          />
        ))}
      </g>
    </svg>
  );
}

/* ─── Device illustrations (SVG) — light strokes on dark canvas ─── */

function PhoneIllustration() {
  return (
    <div
      className="group/dev relative mx-auto drop-shadow-md dark:drop-shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      style={{ width: 88 }}
    >
      <svg
        viewBox="0 0 88 172"
        className="w-full h-auto"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="cardGradPhone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Body — off-white chips in dark mode so frames don’t glare */}
        <rect
          x="3"
          y="3"
          width="82"
          height="166"
          rx="22"
          strokeWidth="2.5"
          className="fill-white stroke-slate-300 dark:fill-[#131b2a] dark:stroke-slate-500/60"
        />

        {/* Screen */}
        <rect
          x="10"
          y="16"
          width="68"
          height="132"
          rx="10"
          className="fill-slate-100 transition-colors duration-500 dark:fill-[#0e1624] dark:group-hover/dev:fill-[#0d1117] group-hover/dev:fill-[#0d1117]"
        />

        {/* Dynamic Island */}
        <rect
          x="29"
          y="21"
          width="30"
          height="9"
          rx="4.5"
          className="fill-[#1a1a2e] dark:fill-black/55"
        />

        {/* ── Hover: "Connected" pill ── */}
        <g className="opacity-0 transition-opacity duration-300 group-hover/dev:opacity-100">
          <rect x="20" y="26" width="48" height="12" rx="6" fill="#1e293b" />
          <circle cx="60" cy="32" r="3" fill="#22c55e" />
          <text
            x="36"
            y="34.5"
            fill="white"
            fontSize="6"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            textAnchor="middle"
          >
            Connected
          </text>
        </g>

        {/* ── Hover: portrait card ── */}
        <g
          className="opacity-0 transition-all duration-500 group-hover/dev:opacity-100"
          style={{ transformOrigin: "center", transform: "translateY(6px)" }}
        >
          <rect x="18" y="46" width="52" height="66" rx="8" fill="#0f172a" />
          <rect
            x="22"
            y="50"
            width="44"
            height="58"
            rx="6"
            fill="url(#cardGradPhone)"
          />
          {/* person silhouette */}
          <circle cx="44" cy="65" r="10" fill="#60a5fa" opacity="0.75" />
          <path
            d="M 25 108 C 25 90 63 90 63 108"
            fill="#3b82f6"
            opacity="0.5"
          />
        </g>

        {/* ── Hover: dashed placeholder below card ── */}
        <g className="opacity-0 transition-opacity duration-300 delay-100 group-hover/dev:opacity-100">
          <rect
            x="18"
            y="120"
            width="52"
            height="20"
            rx="4"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </g>

        {/* Home indicator */}
        <rect
          x="29"
          y="141"
          width="30"
          height="4"
          rx="2"
          className="fill-slate-300 transition-colors duration-500 group-hover/dev:fill-slate-600 dark:fill-slate-600 dark:group-hover/dev:fill-slate-400"
        />

        {/* Volume / power */}
        <rect
          x="0"
          y="52"
          width="2.5"
          height="14"
          rx="1.25"
          className="fill-slate-300 dark:fill-slate-500/70"
        />
        <rect
          x="0"
          y="72"
          width="2.5"
          height="22"
          rx="1.25"
          className="fill-slate-300 dark:fill-slate-500/70"
        />
        <rect
          x="85.5"
          y="60"
          width="2.5"
          height="22"
          rx="1.25"
          className="fill-slate-300 dark:fill-slate-500/70"
        />
      </svg>
    </div>
  );
}

function LaptopIllustration() {
  return (
    <div
      className="group/dev relative mx-auto drop-shadow-md dark:drop-shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      style={{ maxWidth: 230 }}
    >
      <svg
        viewBox="0 0 230 175"
        className="w-full h-auto"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="cardGradLaptop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          {/* Clip to the trapezoidal screen area */}
          <clipPath id="screenClipLaptop">
            <path d="M 47 18 L 183 18 L 194 97 L 36 97 Z" />
          </clipPath>
        </defs>

        {/* Screen shell */}
        <path
          d="M 38 8 L 192 8 L 204 106 L 26 106 Z"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="fill-white stroke-slate-300 dark:fill-[#131b2a] dark:stroke-slate-500/60"
        />

        {/* Screen display — fill transitions */}
        <path
          d="M 47 18 L 183 18 L 194 97 L 36 97 Z"
          className="fill-slate-100 transition-colors duration-500 dark:fill-[#0e1624] dark:group-hover/dev:fill-[#0d1117] group-hover/dev:fill-[#0d1117]"
        />

        {/* Camera */}
        <circle
          cx="115"
          cy="13"
          r="3"
          className="fill-slate-300 dark:fill-slate-500/70"
        />

        {/* ── Hover: "Magically Connected" pill ── */}
        <g
          className="opacity-0 transition-opacity duration-300 group-hover/dev:opacity-100"
          clipPath="url(#screenClipLaptop)"
        >
          <rect x="68" y="22" width="94" height="14" rx="7" fill="#1e293b" />
          {/* Battery icon */}
          <rect x="147" y="26" width="10" height="6" rx="1.5" fill="#22c55e" />
          <rect x="157" y="28" width="2" height="2" rx="1" fill="#22c55e" />
          <text
            x="109"
            y="32"
            fill="white"
            fontSize="6.5"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            textAnchor="middle"
          >
            Magically Connected
          </text>
        </g>

        {/* ── Hover: portrait card ── */}
        <g
          className="opacity-0 transition-opacity duration-500 group-hover/dev:opacity-100"
          clipPath="url(#screenClipLaptop)"
        >
          <rect x="79" y="38" width="72" height="52" rx="8" fill="#0f172a" />
          <rect
            x="83"
            y="42"
            width="64"
            height="44"
            rx="6"
            fill="url(#cardGradLaptop)"
          />
          <circle cx="115" cy="55" r="12" fill="#60a5fa" opacity="0.75" />
          <path
            d="M 88 86 C 88 70 142 70 142 86"
            fill="#3b82f6"
            opacity="0.5"
          />
        </g>

        {/* ── Hover: dashed placeholder ── */}
        <g
          className="opacity-0 transition-opacity duration-300 delay-100 group-hover/dev:opacity-100"
          clipPath="url(#screenClipLaptop)"
        >
          <rect
            x="47"
            y="76"
            width="136"
            height="16"
            rx="4"
            fill="none"
            strokeWidth="1"
            strokeDasharray="4 3"
            className="stroke-slate-600 dark:stroke-slate-400"
          />
        </g>

        {/* Hinge */}
        <rect
          x="22"
          y="106"
          width="186"
          height="5"
          rx="2.5"
          className="fill-slate-200 dark:fill-[#1e293b]"
        />

        {/* Base */}
        <path
          d="M 14 111 L 216 111 L 222 162 L 8 162 Z"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="fill-white stroke-slate-300 dark:fill-[#131b2a] dark:stroke-slate-500/60"
        />

        {/* Trackpad */}
        <rect
          x="80"
          y="126"
          width="70"
          height="24"
          rx="5"
          strokeWidth="1.5"
          className="fill-slate-100 stroke-slate-300 dark:fill-[#0e1624] dark:stroke-slate-500/60"
        />
      </svg>
    </div>
  );
}

function TabletIllustration() {
  return (
    <div
      className="group/dev relative mx-auto drop-shadow-md dark:drop-shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      style={{ maxWidth: 210 }}
    >
      <svg
        viewBox="0 0 210 152"
        className="w-full h-auto"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="cardGradTablet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Body */}
        <rect
          x="3"
          y="3"
          width="204"
          height="146"
          rx="18"
          strokeWidth="2.5"
          className="fill-white stroke-slate-300 dark:fill-[#131b2a] dark:stroke-slate-500/60"
        />

        {/* Screen — fill transitions */}
        <rect
          x="12"
          y="12"
          width="186"
          height="128"
          rx="11"
          className="fill-slate-100 transition-colors duration-500 dark:fill-[#0e1624] dark:group-hover/dev:fill-[#0d1117] group-hover/dev:fill-[#0d1117]"
        />

        {/* Camera (top edge) */}
        <circle
          cx="105"
          cy="7.5"
          r="3"
          className="fill-slate-300 dark:fill-slate-500/70"
        />

        {/* ── Hover: "Connected" pill ── */}
        <g className="opacity-0 transition-opacity duration-300 group-hover/dev:opacity-100">
          <rect x="72" y="17" width="66" height="13" rx="6.5" fill="#1e293b" />
          <circle cx="129" cy="23.5" r="3.5" fill="#22c55e" />
          <text
            x="98"
            y="26"
            fill="white"
            fontSize="7"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            textAnchor="middle"
          >
            Connected
          </text>
        </g>

        {/* ── Hover: portrait card ── */}
        <g className="opacity-0 transition-opacity duration-500 group-hover/dev:opacity-100">
          <rect x="67" y="36" width="76" height="76" rx="10" fill="#0f172a" />
          <rect
            x="71"
            y="40"
            width="68"
            height="68"
            rx="8"
            fill="url(#cardGradTablet)"
          />
          <circle cx="105" cy="60" r="14" fill="#60a5fa" opacity="0.75" />
          <path
            d="M 76 108 C 76 88 134 88 134 108"
            fill="#3b82f6"
            opacity="0.5"
          />
        </g>

        {/* ── Hover: dashed placeholder ── */}
        <g className="opacity-0 transition-opacity duration-300 delay-100 group-hover/dev:opacity-100">
          <rect
            x="20"
            y="120"
            width="170"
            height="14"
            rx="4"
            fill="none"
            strokeWidth="1"
            strokeDasharray="4 3"
            className="stroke-slate-600 dark:stroke-slate-400"
          />
        </g>

        {/* Power button */}
        <rect
          x="207.5"
          y="54"
          width="2.5"
          height="20"
          rx="1.25"
          className="fill-slate-300 dark:fill-slate-500/70"
        />
        {/* Volume buttons */}
        <rect
          x="68"
          y="0"
          width="16"
          height="2.5"
          rx="1.25"
          className="fill-slate-300 dark:fill-slate-500/70"
        />
        <rect
          x="90"
          y="0"
          width="24"
          height="2.5"
          rx="1.25"
          className="fill-slate-300 dark:fill-slate-500/70"
        />
      </svg>
    </div>
  );
}

/* ─── The three platform entries ─── */
const PLATFORMS = [
  {
    Illustration: PhoneIllustration,
    title: "Monitor on the go",
    description:
      "Receive instant access alerts and review repository activity from your phone — anytime, anywhere.",
  },
  {
    Illustration: LaptopIllustration,
    title: "Full control at your desk",
    description:
      "Add repositories, manage teams, and run security audits from your full browser dashboard.",
  },
  {
    Illustration: TabletIllustration,
    title: "Manage access from anywhere",
    description:
      "Approve developer requests, review access logs, and revoke permissions from any device.",
  },
];

/* ─── Feature cards section (below platform devices) ─── */

function SecurityMockup() {
  return (
    <div className="flex items-center justify-center gap-3 py-7">
      {/* Avatar A */}
      <div className="h-10 w-10 shrink-0 rounded-full bg-linear-to-br from-violet-400 to-blue-500 shadow-sm flex items-center justify-center text-white text-xs font-bold select-none">
        JD
      </div>
      {/* Dashed line left */}
      <div className="flex-1 border-t border-dashed border-border" />
      {/* Lock icon */}
      <div className="shrink-0 h-9 w-9 rounded-xl border border-border bg-card shadow-sm flex items-center justify-center">
        <IconLock size={16} className="text-muted-foreground" />
      </div>
      {/* Dashed line right */}
      <div className="flex-1 border-t border-dashed border-border" />
      {/* Avatar B */}
      <div className="h-10 w-10 shrink-0 rounded-full bg-linear-to-br from-orange-400 to-red-500 shadow-sm flex items-center justify-center text-white text-xs font-bold select-none">
        AB
      </div>
    </div>
  );
}

function GlobalMockup() {
  return (
    <div className="relative overflow-hidden rounded-xl h-28 bg-[radial-gradient(circle,#cbd5e1_1.5px,transparent_1.5px)] bg-size-[14px_14px] dark:bg-[radial-gradient(circle,rgb(148_163_184/0.35)_1.5px,transparent_1.5px)]">
      {/* Soft fade toward the right so it doesn't look clipped */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(ellipse_at_80%_50%,white_30%,transparent_70%)] dark:[background:radial-gradient(ellipse_at_80%_50%,#060a12_42%,transparent_72%)]" />
      {/* Globe icon badge */}
      <div className="absolute top-3 left-3 h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
        <IconWorld size={20} className="text-white" />
      </div>
    </div>
  );
}

function ComplianceMockup() {
  const badges = [
    {
      label: "GDPR",
      sub: "★★★",
      from: "from-blue-600",
      to: "to-blue-800",
    },
    {
      label: "ISO",
      sub: "27001",
      from: "from-blue-500",
      to: "to-cyan-600",
    },
    {
      label: "SOC",
      sub: "AICPA",
      from: "from-indigo-500",
      to: "to-violet-600",
    },
  ];

  return (
    <div className="flex items-center gap-4 py-5">
      {badges.map(({ label, sub, from, to }) => (
        <div
          key={label}
          className={`h-14 w-14 rounded-full bg-linear-to-b ${from} ${to} flex flex-col items-center justify-center shadow-md`}
        >
          <span className="text-white font-bold text-[9px] leading-none tracking-wide">
            {sub}
          </span>
          <span className="text-white font-extrabold text-[11px] mt-0.5 tracking-wider">
            {label}
          </span>
        </div>
      ))}
      <IconShieldCheck size={28} className="text-muted-foreground ml-1" />
    </div>
  );
}

const FEATURE_CARDS = [
  {
    Mockup: SecurityMockup,
    title: "Enterprise-grade security",
    description:
      "End-to-end encryption and SOC 2 compliance ensure your repository data stays protected across all devices.",
  },
  {
    Mockup: GlobalMockup,
    title: "Edge computing ready",
    description:
      "Deploy monitoring closer to your teams with our global edge network for ultra-low latency access responses.",
  },
  {
    Mockup: ComplianceMockup,
    title: "SOC2 and GDPR compliant",
    description:
      "Built-in encryption and compliance features ensure your repository data stays protected across all platforms.",
  },
];

export function FeatureCardsSection() {
  return (
    <section className="border-b border-border bg-white dark:bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURE_CARDS.map(({ Mockup, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.45,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 gap-4"
            >
              <Mockup />
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main export ─── */
export function PlatformSection() {
  return (
    <section className="bg-white dark:bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight max-w-lg mx-auto">
            Manage your code from anywhere
          </h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Your repositories, access controls, and team permissions work
            seamlessly on any device.
          </p>
        </motion.div>

        {/* Connecting curve — animated SVG */}
        <div className="mt-14 w-full h-[50px]">
          <ConnectorSVG />
        </div>

        {/* Devices + labels */}
        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {PLATFORMS.map(({ Illustration, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center gap-5 text-center"
            >
              <Illustration />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
