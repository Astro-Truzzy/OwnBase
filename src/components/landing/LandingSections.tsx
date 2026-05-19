"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import {
  IconActivity,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconBrandDropbox,
  IconBrandFigma,
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandGoogle,
  IconBrandSlack,
  IconBrandSpotify,
  IconBrandStripe,
  IconBrandTwitch,
  IconBrandVercel,
  IconBrandWindows,
  IconBrandYoutube,
  IconBulb,
  IconChartPie,
  IconCheck,
  IconCloud,
  IconFile,
  IconFolder,
  IconFolders,
  IconGitBranch,
  IconHistory,
  IconKey,
  IconLockCheck,
  IconLockOff,
  IconPlugConnected,
  IconQuote,
  IconShieldLock,
  IconUserQuestion,
  IconUsersGroup,
} from "@tabler/icons-react";
import { motion, useInView } from "motion/react";
import { useHtmlDark } from "@/hooks/useHtmlDark";
import { Tabs } from "@/components/ui/tabs";
import { BentoFeatures } from "./BentoFeatures";
import { PricingPlans } from "./PricingPlans";
import { PlatformSection, FeatureCardsSection } from "./PlatformSection";

/* ─── Shared sub-components ─── */

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-center font-mono text-[10px] tracking-[0.22em] uppercase text-accent mb-3"
      data-aos="fade-up"
      data-aos-duration="500"
    >
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-center"
      data-aos="fade-up"
      data-aos-delay="40"
      data-aos-duration="500"
    >
      {children}
    </h2>
  );
}

function SectionSubheading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-4 text-muted text-center max-w-2xl mx-auto leading-relaxed text-sm sm:text-base"
      data-aos="fade-up"
      data-aos-delay="70"
      data-aos-duration="500"
    >
      {children}
    </p>
  );
}

function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-border bg-surface/50 p-6 transition-all hover:border-accent/30 hover:bg-surface/80 hover-lift backdrop-blur-sm overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.45), transparent)",
        }}
        aria-hidden
      />
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-elevated transition-colors group-hover:border-accent/25 group-hover:bg-accent/5 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-5 transition-all hover:border-accent/30 hover:bg-surface/80 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)",
        }}
        aria-hidden
      />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/8 transition-colors group-hover:bg-accent/15 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function HowStepTabContent({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <span className="mt-4 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/12 font-mono text-xs font-semibold text-accent">
        {step}
      </span>
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Solution visual (code repo mockup) ─── */

function SolutionVisual() {
  const files = [
    { name: "src/", isDir: true, time: "2h ago", accent: true },
    { name: "api/", isDir: true, time: "1d ago", accent: false },
    { name: "package.json", isDir: false, time: "3d ago", accent: false },
    { name: "README.md", isDir: false, time: "1w ago", accent: false },
  ];
  const contributors = [
    { name: "You (Owner)", role: "Admin", active: true },
    { name: "contractor-a", role: "Write", active: true },
    { name: "contractor-b", role: "Read", active: false },
  ];

  return (
    <div className="p-5 space-y-3 font-mono text-xs">
      {/* Repo header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <IconBrandGithub className="h-4 w-4 text-muted" />
        <span className="text-muted">ownbase</span>
        <span className="text-border mx-0.5">/</span>
        <span className="text-foreground font-semibold">your-project</span>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 text-[10px] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Protected
        </div>
      </div>

      {/* Branch + commit info */}
      <div className="flex items-center gap-2 text-muted">
        <IconGitBranch className="h-3.5 w-3.5 text-accent/70" />
        <span className="text-foreground/70">main</span>
        <span className="text-border">·</span>
        <span className="text-accent/70">3 contributors</span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground/60">last commit 2h ago</span>
      </div>

      {/* File list */}
      <div className="rounded-lg border border-border overflow-hidden">
        {files.map((f, i) => (
          <div
            key={f.name}
            className={`flex items-center gap-2.5 px-3 py-2 ${i < files.length - 1 ? "border-b border-border/60" : ""} ${f.accent ? "bg-accent/4" : "bg-surface/40"}`}
          >
            {f.isDir ? (
              <IconFolder className="h-3.5 w-3.5 text-accent/60 shrink-0" />
            ) : (
              <IconFile className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            )}
            <span
              className={`flex-1 ${f.accent ? "text-accent/80" : "text-foreground/70"}`}
            >
              {f.name}
            </span>
            <span className="text-muted-foreground/50 text-[10px]">
              {f.time}
            </span>
          </div>
        ))}
      </div>

      {/* Access control */}
      <div className="rounded-lg border border-border bg-surface/40 px-3 pt-2.5 pb-3 space-y-2">
        <p className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground/50 mb-2">
          Access
        </p>
        {contributors.map((u) => (
          <div key={u.name} className="flex items-center justify-between gap-2">
            <span className="text-foreground/65">{u.name}</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-medium ${
                  u.role === "Admin"
                    ? "text-accent"
                    : "text-muted-foreground/60"
                }`}
              >
                {u.role}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  u.active ? "bg-accent-emerald" : "bg-muted/30"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard section components ─── */

function DashboardFeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-start gap-4 rounded-xl border border-border bg-surface/50 p-4 transition-all hover:border-accent/30 hover:bg-surface-elevated">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 transition-transform group-hover:scale-105 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  widthClass,
  tone,
  level,
}: {
  label: string;
  widthClass: string;
  tone: string;
  level: "Critical" | "High" | "Medium";
}) {
  const levelColors: Record<string, string> = {
    Critical: "text-accent-emerald",
    High: "text-accent",
    Medium: "text-amber-400",
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 p-3">
      <span className="text-sm text-foreground/80">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border/80">
          <div className={`h-full ${widthClass} ${tone} rounded-full`} />
        </div>
        <span
          className={`text-xs font-mono ${levelColors[level] ?? "text-muted"}`}
        >
          {level}
        </span>
      </div>
    </div>
  );
}

/* ─── Logo Cloud ─── */

type BrandItem = {
  name: string;
  Icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  /** Light mode foreground */
  color: string;
  /** Dark mode foreground (higher luminance vs near-black canvases). */
  darkColor?: string;
  nameCls?: string;
};

const BRAND_ROWS: BrandItem[][] = [
  [
    {
      name: "GitHub",
      Icon: IconBrandGithub,
      color: "#24292F",
      darkColor: "#eef2f6",
    },
    {
      name: "Stripe",
      Icon: IconBrandStripe,
      color: "#635BFF",
      darkColor: "#8f96ff",
      nameCls: "italic",
    },
    {
      name: "Vercel",
      Icon: IconBrandVercel,
      color: "#000000",
      darkColor: "#f8fafc",
    },
    {
      name: "Shopify",
      color: "#96BF48",
      darkColor: "#aed36a",
      nameCls: "font-bold text-base",
    },
    {
      name: "Google",
      Icon: IconBrandGoogle,
      color: "#4285F4",
      darkColor: "#7eb0ff",
    },
    {
      name: "GitLab",
      Icon: IconBrandGitlab,
      color: "#FC6D26",
      darkColor: "#ff9a5c",
    },
  ],
  [
    {
      name: "Figma",
      Icon: IconBrandFigma,
      color: "#F24E1E",
      darkColor: "#ff7b52",
    },
    {
      name: "YouTube",
      Icon: IconBrandYoutube,
      color: "#FF0000",
      darkColor: "#ff5757",
    },
    {
      name: "Spotify",
      Icon: IconBrandSpotify,
      color: "#1DB954",
      darkColor: "#2ee576",
    },
    {
      name: "Twitch",
      Icon: IconBrandTwitch,
      color: "#9146FF",
      darkColor: "#b794ff",
    },
    {
      name: "Slack",
      Icon: IconBrandSlack,
      color: "#4A154B",
      darkColor: "#e598f0",
    },
    {
      name: "Linear",
      color: "#5E6AD2",
      darkColor: "#a9b6ff",
      nameCls: "font-semibold text-base tracking-tight",
    },
  ],
  [
    {
      name: "Dropbox",
      Icon: IconBrandDropbox,
      color: "#0061FF",
      darkColor: "#4da3ff",
    },
    {
      name: "Microsoft",
      Icon: IconBrandWindows,
      color: "#00A4EF",
      darkColor: "#5cc7ff",
    },
    {
      name: "NETFLIX",
      color: "#E50914",
      darkColor: "#ff3b4a",
      nameCls: "font-black tracking-tight text-[22px]",
    },
    {
      name: "MongoDB",
      color: "#13AA52",
      darkColor: "#3dd879",
      nameCls: "font-bold text-lg",
    },
    {
      name: "Adobe",
      color: "#FF0000",
      darkColor: "#ff7070",
      nameCls: "font-black text-lg tracking-tight",
    },
    {
      name: "AWS",
      color: "#FF9900",
      darkColor: "#ffb547",
      nameCls: "font-black tracking-widest text-[11px] uppercase",
    },
  ],
];

function BrandGrid() {
  const htmlDark = useHtmlDark();

  return (
    <div className="space-y-10 sm:space-y-12">
      {BRAND_ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="grid grid-cols-3 sm:grid-cols-6 gap-y-8 gap-x-4"
        >
          {row.map((brand, i) => {
            const fg =
              htmlDark && brand.darkColor !== undefined
                ? brand.darkColor
                : brand.color;
            return (
              <motion.div
                key={brand.name}
                initial={{ filter: "blur(12px)", opacity: 0.1 }}
                whileInView={{ filter: "blur(0px)", opacity: 1 }}
                transition={{
                  duration: 0.55,
                  delay: rowIdx * 0.12 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                viewport={{ once: true, margin: "-60px" }}
                className="group flex flex-col cursor-default items-center justify-center gap-1.5"
              >
                {brand.Icon && (
                  <brand.Icon
                    className="h-8 w-8 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: fg }}
                  />
                )}
                <span
                  className={`${brand.nameCls ?? "font-semibold text-sm"} leading-none whitespace-nowrap`}
                  style={{ color: fg }}
                >
                  {brand.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ─── Main exported component ─── */

export function LandingSections() {
  const howItWorksTabs = useMemo(
    () => [
      {
        title: "Connect",
        value: "connect",
        content: (
          <HowStepTabContent
            step={1}
            icon={<IconPlugConnected />}
            title="Connect your repository"
            description="Connect your repository or upload your project code. We support GitHub, GitLab, and direct uploads so your code lives under your organization from day one."
          />
        ),
      },
      {
        title: "Secure",
        value: "secure",
        content: (
          <HowStepTabContent
            step={2}
            icon={<IconShieldLock />}
            title="Secure your codebase"
            description="Your code is stored in an environment owned by your business, not your developer. Encrypted storage with access controls built in from the ground up."
          />
        ),
      },
      {
        title: "Collaborate",
        value: "collaborate",
        content: (
          <HowStepTabContent
            step={3}
            icon={<IconUsersGroup />}
            title="Collaborate with your team"
            description="Grant developers access to work on your projects. Add or remove team members anytime. Every change is tracked so you keep full visibility and control."
          />
        ),
      },
      {
        title: "Control",
        value: "control",
        content: (
          <HowStepTabContent
            step={4}
            icon={<IconLockCheck />}
            title="Control stays with you"
            description="Revoke access in one click. You always own the repository. No negotiating, no waiting, no platform intermediaries."
          />
        ),
      },
    ],
    [],
  );

  return (
    <>
      {/* ── Logo cloud ── */}
      <section className="border-b border-border bg-surface/40 py-16 dark:bg-background/40 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="text-[15px] font-medium text-foreground">
              Built for businesses that outsource development.
            </p>
            <p className="mt-1.5 text-sm text-muted dark:text-zinc-400">
              Keep your codebase secure, accessible, and under your control.
            </p>
          </div>
          <BrandGrid />
        </div>
      </section>

      <BentoFeatures />

      {/* ── Problem ── */}
      <section id="the-problem" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <SectionEyebrow>The Problem</SectionEyebrow>
          <SectionHeading>
            The Hidden Risk in Outsourced Development
          </SectionHeading>
          <SectionSubheading>
            Thousands of businesses rely on freelance developers or agencies to
            build their websites, apps, and internal tools. But the code often
            lives in the developer&apos;s private repositories — not under your
            control.
          </SectionSubheading>
          <div className="mt-12 sm:mt-14 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
            {[
              {
                icon: <IconLockOff className="text-accent" />,
                title: "No access when they leave",
                description:
                  "If the developer disappears or stops responding, you cannot access the source code. Your product is stuck.",
                delay: 80,
              },
              {
                icon: <IconUserQuestion className="text-accent" />,
                title: "Hard to hand off",
                description:
                  "Onboarding a new developer becomes a guessing game. Repos, keys, and access are scattered across personal accounts.",
                delay: 120,
              },
              {
                icon: <IconAlertTriangle className="text-accent" />,
                title: "Infrastructure at risk",
                description:
                  "Critical systems may depend on one person. Losing them can mean losing your entire digital footprint.",
                delay: 160,
              },
              {
                icon: <IconAlertCircle className="text-accent" />,
                title: "Single point of failure",
                description:
                  "Your business should not depend on one individual. Ownbase keeps ownership where it belongs: with you.",
                delay: 200,
              },
            ].map((card) => (
              <div
                key={card.title}
                data-aos="fade-up"
                data-aos-delay={card.delay}
                data-aos-duration="500"
              >
                <ProblemCard
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section id="the-solution" className="bg-surface/15">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <SectionEyebrow>The Solution</SectionEyebrow>
          <SectionHeading>Ownbase Gives You True Code Ownership</SectionHeading>
          <SectionSubheading>
            A secure code ownership vault for your business. Your company owns
            the central source of truth — not your contractors.
          </SectionSubheading>
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <ul
              className="space-y-3"
              data-aos="fade-right"
              data-aos-delay="80"
              data-aos-duration="500"
            >
              {[
                "Store repositories securely under your organization.",
                "Control who has access and revoke it in one click.",
                "Track activity so you always know who touched what.",
                "Protect your digital assets for the long term.",
                "AI-powered health and risk analysis for every project.",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-muted"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <IconCheck className="h-3 w-3 text-accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Repo mockup */}
            <div
              data-aos="fade-left"
              data-aos-delay="120"
              data-aos-duration="500"
              className="relative overflow-hidden rounded-xl border border-border bg-surface/60 backdrop-blur-sm"
            >
              {/* Accent top line */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(34,211,238,0.55) 40%, rgba(96,165,250,0.4) 70%, transparent)",
                }}
                aria-hidden
              />
              <SolutionVisual />
            </div>
          </div>
        </div>
      </section>

      <PlatformSection />
      <FeatureCardsSection />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <SectionEyebrow>How It Works</SectionEyebrow>
          <SectionHeading>Four Steps to Full Control</SectionHeading>
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
            {/* Left: summary */}
            <div
              className="space-y-4"
              data-aos="fade-right"
              data-aos-duration="500"
              data-aos-delay="80"
            >
              <p className="text-muted leading-relaxed text-sm sm:text-base">
                Ownbase puts you in control of your codebase in four clear
                steps. Connect your repos, secure everything under your
                organization, collaborate with your team, and revoke access
                whenever you need — no lock-in, no surprises.
              </p>
              <ul className="space-y-3">
                {[
                  {
                    n: 1,
                    text: "Connect your repository or upload your project — GitHub, GitLab, or direct upload.",
                  },
                  {
                    n: 2,
                    text: "Your code is stored in an environment owned by your business.",
                  },
                  {
                    n: 3,
                    text: "Grant developers access; add or remove team members anytime.",
                  },
                  {
                    n: 4,
                    text: "Revoke access in one click. You always own the repo.",
                  },
                ].map(({ n, text }) => (
                  <li
                    key={n}
                    className="flex items-start gap-3 text-sm text-muted"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 font-mono text-xs font-semibold text-accent">
                      {n}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: interactive tabs */}
            <div
              className="rounded-2xl border border-border bg-background/70 p-5 sm:p-7 min-h-[320px] flex flex-col backdrop-blur-sm"
              data-aos="fade-left"
              data-aos-duration="500"
              data-aos-delay="120"
            >
              <Tabs
                tabs={howItWorksTabs}
                containerClassName="gap-1"
                activeTabClassName="bg-surface-elevated border-border"
                tabClassName="text-foreground hover:text-foreground"
                contentClassName="mt-6 min-h-[240px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b border-border bg-surface/15">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <SectionEyebrow>Features</SectionEyebrow>
          <SectionHeading>
            Built for Business Owners Who Want Control
          </SectionHeading>
          <div className="mt-12 space-y-4">
            {/* Hero feature */}
            <div
              className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-7 sm:p-9"
              data-aos="fade-up"
              data-aos-duration="500"
              data-aos-delay="60"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(34,211,238,0.55), transparent)",
                }}
                aria-hidden
              />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <IconShieldLock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Secure code vault
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted leading-relaxed">
                    Store all your repositories in one safe, centralized system.
                    No more code scattered across freelancers&apos; laptops or
                    personal accounts. Your company owns the source of truth,
                    with backups and access control built in.
                  </p>
                </div>
              </div>
            </div>

            {/* Bento grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <IconKey className="text-accent" />,
                  title: "Access control",
                  description:
                    "Grant or revoke developer access instantly. No more waiting or lost credentials.",
                  delay: 80,
                },
                {
                  icon: <IconHistory className="text-accent" />,
                  title: "Activity logs",
                  description:
                    "See who accessed or modified your code. Full audit trail when you need it.",
                  delay: 120,
                },
                {
                  icon: <IconCloud className="text-accent" />,
                  title: "Automatic backup",
                  description:
                    "Automatic backups so your code is never lost, no matter what happens.",
                  delay: 160,
                },
                {
                  icon: <IconFolders className="text-accent" />,
                  title: "Multi-project",
                  description:
                    "Manage multiple products and teams in one unified control center.",
                  delay: 200,
                },
              ].map((f) => (
                <div
                  key={f.title}
                  data-aos="fade-up"
                  data-aos-duration="500"
                  data-aos-delay={f.delay}
                >
                  <FeatureCard
                    icon={f.icon}
                    title={f.title}
                    description={f.description}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Dashboard ── */}
      <LiveDashboardSection />

      {/* ── Trust ── */}
      <TrustSection />

      {/* ── Pricing ── */}
      <section id="pricing" className="border-b border-border bg-background">
        <PricingPlans variant="section" />
      </section>

      {/* ── Final CTA ── */}
      <FinalCtaSection />
    </>
  );
}

/* ─── Live Dashboard Section ─── */

function LiveDashboardSection() {
  return (
    <section
      id="live-dashboard"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 78% 38%, rgba(34,211,238,0.07) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* Copy */}
        <div data-aos="fade-right" data-aos-duration="500">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent">
            Live Dashboard
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            See Your Code as a Business Asset
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            Transform abstract repositories into clear business intelligence.
            Track technical risk, understand team activity, and identify
            critical dependencies in language that makes sense to leadership.
          </p>

          <div className="mt-8 space-y-3">
            <DashboardFeatureItem
              icon={<IconChartPie className="text-accent" />}
              title="Business logic mapping"
              description="Spot where payments, user identity, and core product workflows live."
            />
            <DashboardFeatureItem
              icon={<IconActivity className="text-accent" />}
              title="Health scoring"
              description="Prioritize weak modules before incidents impact customer experience."
            />
            <DashboardFeatureItem
              icon={<IconUsersGroup className="text-accent" />}
              title="Team analytics"
              description="See contribution concentration so you can reduce single-person risk."
            />
          </div>
        </div>

        {/* Mock dashboard card */}
        <div data-aos="fade-left" data-aos-duration="500" data-aos-delay="80">
          <div className="rounded-2xl border border-border bg-surface/60 p-1 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/90 p-5">
              {/* Accent top bar */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(34,211,238,0.5), rgba(167,139,250,0.4) 60%, transparent)",
                }}
                aria-hidden
              />

              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                  Business Impact Analysis
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 font-mono text-[10px] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Live
                </span>
              </div>

              {/* Metric rows */}
              <div className="mt-5 space-y-2.5">
                <MetricRow
                  label="Payment processing"
                  widthClass="w-[95%]"
                  tone="bg-accent-emerald"
                  level="Critical"
                />
                <MetricRow
                  label="User authentication"
                  widthClass="w-[88%]"
                  tone="bg-accent"
                  level="High"
                />
                <MetricRow
                  label="Reporting module"
                  widthClass="w-[65%]"
                  tone="bg-amber-400"
                  level="Medium"
                />
              </div>

              {/* AI recommendation */}
              <div className="mt-5 rounded-lg border border-accent/20 bg-accent/6 p-3.5">
                <div className="flex items-start gap-3">
                  <IconBulb
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      AI recommendation
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Payment logic has single-contributor dependency. Recommend
                      cross-training and exporting documentation for continuity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Section ─── */

const TRUST_PILLS = [
  "Code under your control",
  "Access revoked in one click",
  "No lock-in, no surprises",
] as const;

const TRUSTED_BY = ["Startups", "Agencies", "SaaS Companies"] as const;

function TrustSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section
      id="trust"
      ref={ref}
      className="relative overflow-hidden border-b border-border bg-surface/20"
    >
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 48% at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <motion.h2
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Built for Businesses That Value Control
        </motion.h2>

        {/* Trust pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
          {TRUST_PILLS.map((label, i) => (
            <motion.span
              key={label}
              className="cursor-default rounded-full border border-border bg-surface/70 px-4 py-2.5 text-sm font-medium text-muted backdrop-blur-sm transition-colors"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.4,
                delay: 0.08 + i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                scale: 1.04,
                borderColor: "var(--accent)",
                color: "var(--foreground)",
                boxShadow:
                  "0 0 0 1px var(--accent), 0 8px 20px -6px rgba(34,211,238,0.2)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          className="mt-14 sm:mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <blockquote className="relative rounded-xl border border-border bg-surface/60 px-6 py-6 sm:px-8 sm:py-7 text-left shadow-lg backdrop-blur-sm">
            <span className="absolute left-4 top-5 text-accent/30" aria-hidden>
              <IconQuote className="h-8 w-8 sm:h-9 sm:w-9" />
            </span>
            <p className="pl-10 sm:pl-12 text-foreground leading-relaxed text-base sm:text-lg italic">
              Ownbase ensures our company will never lose access to our platform
              again.
            </p>
            <footer className="mt-4 pl-10 sm:pl-12 text-sm text-muted not-italic">
              — Startup Founder
            </footer>
            <div
              className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full"
              style={{
                background:
                  "linear-gradient(180deg, var(--accent-violet), var(--accent))",
              }}
              aria-hidden
            />
          </blockquote>
        </motion.div>

        {/* Audience */}
        <motion.div
          className="mt-14 sm:mt-16 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-sm font-medium opacity-80">Built for</span>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
            {TRUSTED_BY.map((label, i) => (
              <motion.span
                key={label}
                className="rounded-lg border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-muted cursor-default backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.35,
                  delay: 0.42 + i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  scale: 1.03,
                  borderColor: "var(--accent)",
                  color: "var(--foreground)",
                  backgroundColor: "var(--surface-elevated)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                {label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Final CTA Section ─── */

const CTA_PILLS = [
  "Own your code",
  "Revoke access in one click",
  "No lock-in",
] as const;

const CTA_ICONS = [
  { Icon: IconLockCheck, label: "Control" },
  { Icon: IconShieldLock, label: "Secure" },
  { Icon: IconKey, label: "Access" },
  { Icon: IconBrandGithub, label: "GitHub" },
  { Icon: IconBrandGitlab, label: "GitLab" },
] as const;

function FinalCtaSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      id="final-cta"
      ref={ref}
      className="relative overflow-hidden border-b border-border"
    >
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      {/* Radial glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 55%, rgba(34,211,238,0.07) 0%, rgba(167,139,250,0.04) 40%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32 text-center">
        {/* Headline */}
        <motion.h2
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl max-w-3xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block">Stop Losing Control</span>{" "}
          <motion.span
            className="inline-block gradient-text"
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.5,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            of Your Code
          </motion.span>
        </motion.h2>

        <motion.p
          className="mt-5 text-muted max-w-xl mx-auto leading-relaxed text-sm sm:text-base"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          Your business should always own its digital infrastructure. Ownbase
          makes sure it stays that way.
        </motion.p>

        {/* Pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {CTA_PILLS.map((label, i) => (
            <motion.span
              key={label}
              className="cursor-default rounded-full border border-border bg-surface/70 px-4 py-2.5 text-sm font-medium text-muted backdrop-blur-sm"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.4,
                delay: 0.28 + i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                scale: 1.05,
                borderColor: "var(--accent)",
                color: "var(--foreground)",
                boxShadow:
                  "0 0 0 1px var(--accent), 0 10px 24px -8px rgba(34,211,238,0.22)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Icon row */}
        <motion.div
          className="mt-10 flex justify-center gap-5 sm:gap-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {CTA_ICONS.map(({ Icon, label }, i) => (
            <motion.div
              key={label}
              className="flex flex-col items-center gap-2"
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <motion.div
                className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border bg-surface/60 text-accent [&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.35,
                  delay: 0.5 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  borderColor: "var(--accent)",
                  boxShadow: "0 0 20px -4px rgba(34,211,238,0.35)",
                }}
              >
                <Icon />
              </motion.div>
              <span className="text-xs font-medium text-muted">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA button */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/signup" className="inline-block">
            <motion.span
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-background px-8 py-4 text-sm font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              style={{ boxShadow: "0 8px 32px -8px rgba(34,211,238,0.35)" }}
              whileHover={{
                scale: 1.03,
                boxShadow:
                  "0 12px 40px -8px rgba(34,211,238,0.5), 0 0 0 1px rgba(255,255,255,0.08) inset",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              Secure Your Code Today
              <IconArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
