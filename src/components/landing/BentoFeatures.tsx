"use client";

import {
  IconBolt,
  IconBrandGithub,
  IconBrandGitlab,
  IconHistory,
  IconKey,
  IconLockCheck,
  IconShieldLock,
  IconUpload,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react";
import { motion } from "motion/react";

/* ─── Shared fade-up wrapper ─── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Card shell ─── */
function Card({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <FadeUp
      delay={delay}
      className={`relative overflow-hidden rounded-2xl border border-border bg-white dark:bg-surface/60 inline-flex flex-col ${className}`}
    >
      {children}
    </FadeUp>
  );
}

/* ─── Card A mockup: repo connection form ─── */
function ConnectMockup() {
  const repos = [
    { name: "main-website", platform: "github", status: "Active" },
    { name: "payment-api", platform: "gitlab", status: "Active" },
    { name: "auth-service", platform: "upload", status: "Importing…" },
  ];
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface/40 overflow-hidden shadow-sm">
      {/* chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-white dark:bg-surface px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </div>
      <div className="p-4 space-y-4">
        {/* brand */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent/10">
            <IconShieldLock className="h-3.5 w-3.5 text-accent" />
          </span>
          <span className="text-sm font-bold text-foreground">OwnBase</span>
        </div>
        {/* input row */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Import repository
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value="github.com/yourorg/"
              className="flex-1 rounded-md border border-border bg-white dark:bg-background px-2.5 py-1.5 text-xs text-muted outline-none"
            />
            <button className="rounded-md bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background">
              Import
            </button>
          </div>
        </div>
        {/* divider */}
        <div className="flex items-center gap-2">
          <span className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground/50">
            or continue with
          </span>
          <span className="flex-1 h-px bg-border" />
        </div>
        {/* platform buttons */}
        <div className="flex gap-2">
          {[
            {
              icon: <IconBrandGithub className="h-3.5 w-3.5" />,
              label: "GitHub",
            },
            {
              icon: <IconBrandGitlab className="h-3.5 w-3.5 text-orange-500" />,
              label: "GitLab",
            },
            { icon: <IconUpload className="h-3.5 w-3.5" />, label: "Upload" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-white dark:bg-background px-2 py-1.5"
            >
              {icon}
              <span className="text-xs font-medium text-foreground/70">
                {label}
              </span>
            </div>
          ))}
        </div>
        {/* repo list */}
        <div className="space-y-1.5">
          {repos.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-2 rounded-lg border border-border bg-white dark:bg-background px-3 py-2"
            >
              {r.platform === "github" ? (
                <IconBrandGithub className="h-3.5 w-3.5 shrink-0 text-muted" />
              ) : r.platform === "gitlab" ? (
                <IconBrandGitlab className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              ) : (
                <IconUpload className="h-3.5 w-3.5 shrink-0 text-muted" />
              )}
              <span className="flex-1 text-xs text-foreground/70">
                {r.name}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  r.status === "Active"
                    ? "text-accent-emerald"
                    : "text-amber-500"
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Card C mockup: access event feed ─── */
function AccessFeedMockup() {
  const events = [
    {
      icon: <IconUserCheck className="h-3.5 w-3.5 text-accent-emerald" />,
      text: "contractor@mail.io granted Write on payment-api",
      time: "2m ago",
      color: "text-accent-emerald",
    },
    {
      icon: <IconUserOff className="h-3.5 w-3.5 text-red-500" />,
      text: "old-freelancer access revoked across all repos",
      time: "5m ago",
      color: "text-red-500",
    },
    {
      icon: <IconLockCheck className="h-3.5 w-3.5 text-accent" />,
      text: "main-website is 100% owner-controlled",
      time: "just now",
      color: "text-accent",
    },
    {
      icon: <IconKey className="h-3.5 w-3.5 text-amber-500" />,
      text: "New deploy key added to auth-service",
      time: "12m ago",
      color: "text-amber-500",
    },
  ];
  return (
    <div className="mt-4 space-y-2">
      {events.map((e, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.4,
            delay: 0.1 + i * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/40 px-3 py-2.5"
        >
          <span className="mt-0.5 shrink-0">{e.icon}</span>
          <p className="flex-1 text-[11px] leading-relaxed text-foreground/70">
            {e.text}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground/50">
            {e.time}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Card B mockup: security badges ─── */
function SecurityMockup() {
  const badges = [
    {
      icon: <IconShieldLock className="h-4 w-4 text-accent" />,
      label: "AES-256 Encrypted",
    },
    {
      icon: <IconLockCheck className="h-4 w-4 text-accent-emerald" />,
      label: "SOC 2 Compliant",
    },
    {
      icon: <IconKey className="h-4 w-4 text-amber-500" />,
      label: "Zero-knowledge keys",
    },
  ];
  return (
    <div className="mt-4 grid grid-cols-1 gap-2">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3.5 py-2.5"
        >
          {b.icon}
          <span className="text-xs font-medium text-foreground/75">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Card D mockup: platform icons ─── */
function PlatformMockup() {
  const platforms = [
    { icon: <IconBrandGithub className="h-5 w-5" />, name: "GitHub" },
    {
      icon: <IconBrandGitlab className="h-5 w-5 text-orange-500" />,
      name: "GitLab",
    },
    {
      icon: <IconUpload className="h-5 w-5 text-accent" />,
      name: "Direct Upload",
    },
    {
      icon: <IconHistory className="h-5 w-5 text-violet-500" />,
      name: "Git Archive",
    },
  ];
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {platforms.map((p) => (
        <div
          key={p.name}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/40 py-3"
        >
          {p.icon}
          <span className="text-[10px] text-muted-foreground/70 text-center leading-tight">
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Bottom feature highlights ─── */
const HIGHLIGHTS = [
  {
    icon: <IconBolt className="h-5 w-5 text-foreground" />,
    title: "One-click access revoke",
    description:
      "Remove any developer from all repositories instantly. No waiting, no back-and-forth, no lost credentials.",
  },
  {
    icon: <IconHistory className="h-5 w-5 text-foreground" />,
    title: "Full audit trail",
    description:
      "Every access grant, commit, and revocation is logged forever. Know exactly who touched what and when.",
  },
  {
    icon: <IconLockCheck className="h-5 w-5 text-foreground" />,
    title: "Zero platform lock-in",
    description:
      "Your repos are always yours to export. Switch providers, change teams, or migrate — no friction.",
  },
];

/* ─── Main export ─── */
export function BentoFeatures() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        {/* Heading */}
        <FadeUp>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground max-w-xl leading-tight">
            Complete code ownership features
          </h2>
          <p className="mt-3 text-muted text-sm sm:text-base">
            From connecting repos to revoking access — total control.
          </p>
        </FadeUp>

        {/* Bento grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto]">
          {/* ── Card A: Connect (tall, rows 1-2) ── */}
          <Card delay={0.05} className="lg:row-span-2 p-6">
            <p className="text-sm font-semibold text-foreground">
              Connect in 60 seconds
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Link GitHub, GitLab, or upload directly. Repos are secured the
              moment they land.
            </p>
            <ConnectMockup />
          </Card>

          {/* ── Card B: Security (row 1) ── */}
          <Card delay={0.1} className="p-6">
            <p className="text-sm font-semibold text-foreground">
              Bank-grade security
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Your code is encrypted in transit and at rest. We never read your
              source files.
            </p>
            <SecurityMockup />
          </Card>

          {/* ── Card C: Access control (tall, rows 1-2) ── */}
          <Card delay={0.15} className="lg:row-span-2 p-6">
            <p className="text-sm font-semibold text-foreground">
              Instant access control
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Grant or revoke developer access in one click. Know exactly who
              can touch what.
            </p>
            <AccessFeedMockup />
          </Card>

          {/* ── Card D: Platforms (row 2) ── */}
          <Card delay={0.2} className="p-6">
            <p className="text-sm font-semibold text-foreground">
              Works with your stack
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Native support for GitHub, GitLab, and direct uploads out of the
              box.
            </p>
            <PlatformMockup />
          </Card>

          {/* ── Card E: Testimonial (col span 2) ── */}
          <Card delay={0.22} className="sm:col-span-2 p-7">
            <div className="flex flex-col justify-between h-full gap-6 sm:flex-row sm:items-center">
              <blockquote className="flex-1">
                <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                  &ldquo;Ownbase gave us complete peace of mind. We revoked
                  access to an ex-contractor across all 12 repos in under 10
                  seconds. That used to take us weeks.&rdquo;
                </p>
                <footer className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-sm text-accent">
                    WT
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Williams Trust
                    </p>
                    <p className="text-xs text-muted">Founder at Ridely</p>
                  </div>
                </footer>
              </blockquote>
              {/* Stats */}
              <div className="flex shrink-0 gap-6 sm:flex-col sm:gap-4 sm:text-right">
                {[
                  { n: "12", label: "repos protected" },
                  { n: "3", label: "teams managed" },
                  { n: "0", label: "lock-ins" },
                ].map(({ n, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-black text-foreground">{n}</p>
                    <p className="text-[11px] text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Card F: Activity ticker ── */}
          <Card delay={0.28} className="p-6">
            <p className="text-sm font-semibold text-foreground">
              Live activity
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Real-time feed of every action taken across your repositories.
            </p>
            <div className="mt-4 space-y-2">
              {[
                {
                  dot: "bg-accent-emerald",
                  text: "main-website — push by owner",
                },
                { dot: "bg-accent", text: "payment-api — accessed by dev-a" },
                { dot: "bg-red-400", text: "auth-service — access revoked" },
                { dot: "bg-amber-400", text: "docs-platform — key rotated" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-xs text-foreground/65"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dot}`}
                  />
                  {item.text}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Feature highlights ── */}
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon, title, description }, i) => (
            <FadeUp key={title} delay={0.08 + i * 0.07}>
              <div className="flex flex-col gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface/60">
                  {icon}
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-sm text-muted leading-relaxed">
                  {description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
