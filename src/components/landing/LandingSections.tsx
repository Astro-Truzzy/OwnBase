"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef } from "react";
import {
  IconActivity,
  IconAlertCircle,
  IconAlertTriangle,
  IconBulb,
  IconChartPie,
  IconCloud,
  IconFolders,
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
import { Tabs } from "@/components/ui/tabs";
// Side-effect import so landingIcons is defined if any cached code still references it
import { landingIcons } from "./landingIcons";
void landingIcons;

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
    <div className="flex flex-col rounded-xl border border-border bg-surface/50 p-6">
      <div className="flex h-12 w-12 items-center justify-center text-accent [&_svg]:h-12 [&_svg]:w-12">
        {icon}
      </div>
      <span className="mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated text-sm font-medium text-muted">
        {step}
      </span>
      <h3 className="mt-3 text-base font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

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
            title="Connect"
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
            title="Secure"
            description="Your code is stored in an environment owned by your business."
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
            title="Collaborate"
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
            title="Control"
            description="Revoke access in one click. You always own the repo."
          />
        ),
      },
    ],
    []
  );

  return (
    <>
      {/* Social proof strip */}
      <section className="border-b border-border bg-black/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
          <p
            className="text-center text-[11px] tracking-[0.18em] uppercase text-muted"
            data-aos="fade-up"
            data-aos-duration="550"
          >
            Trusted by forward-thinking teams
          </p>
          <div
            className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-3 lg:grid-cols-6"
            data-aos="fade-up"
            data-aos-delay="60"
            data-aos-duration="550"
          >
            {["TechFlow", "Nexus", "Apex", "Horizon", "Vertex", "Prism"].map((brand) => (
              <div
                key={brand}
                className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2 — Problem (2×2 equal cards, AOS animations) */}
      <section id="the-problem" className="border-b border-border bg-surface/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <h2
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-center"
            data-aos="fade-up"
            data-aos-duration="550"
          >
            The Hidden Risk in Outsourced Development
          </h2>
          <p
            className="mt-4 text-muted text-center max-w-2xl mx-auto leading-relaxed text-sm sm:text-base"
            data-aos="fade-up"
            data-aos-delay="50"
            data-aos-duration="550"
          >
            Thousands of businesses rely on freelance developers or agencies to
            build their websites, apps, and internal tools. But the code often
            lives in the developer&apos;s private repositories — not under your control.
          </p>
          <div className="mt-14 sm:mt-16 grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="550">
              <ProblemCard
                icon={<IconLockOff className="text-accent" />}
                title="No access when they leave"
                description="If the developer disappears or stops responding, you cannot access the source code. Your product is stuck."
              />
            </div>
            <div data-aos="fade-up" data-aos-delay="150" data-aos-duration="550">
              <ProblemCard
                icon={<IconUserQuestion className="text-accent" />}
                title="Hard to hand off"
                description="Onboarding a new developer becomes a guessing game. Repos, keys, and access are scattered."
              />
            </div>
            <div data-aos="fade-up" data-aos-delay="200" data-aos-duration="550">
              <ProblemCard
                icon={<IconAlertTriangle className="text-accent" />}
                title="Infrastructure at risk"
                description="Critical systems may depend on one person. Losing them can mean losing your entire digital footprint."
              />
            </div>
            <div data-aos="fade-up" data-aos-delay="250" data-aos-duration="550">
              <ProblemCard
                icon={<IconAlertCircle className="text-accent" />}
                title="Single point of failure"
                description="Your business should not depend on one individual. Ownbase keeps ownership where it belongs: with you."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Solution (two-column, AOS from left and right) */}
      <section id="the-solution" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <h2
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-center"
            data-aos="fade-up"
            data-aos-duration="550"
          >
            Ownbase Gives You True Code Ownership
          </h2>
          <p
            className="mt-4 text-muted text-center max-w-2xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="50"
            data-aos-duration="550"
          >
            A secure code ownership vault for your business. Your company owns
            the central source of truth — not your contractors.
          </p>
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <ul
              className="space-y-4"
              data-aos="fade-right"
              data-aos-delay="100"
              data-aos-duration="550"
            >
              {[
                "Store repositories securely under your organization.",
                "Control who has access and revoke it in one click.",
                "Track activity so you always know who touched what.",
                "Protect your digital assets for the long term.",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {/* Solution dashboard image: add your file to public/Images/solution-dashboard.png (or .jpg / .avif) */}
            <div
              data-aos="fade-left"
              data-aos-delay="150"
              data-aos-duration="550"
              className="relative min-h-[220px] w-full overflow-hidden rounded-xl border border-border bg-surface"
            >
              <Image
                src="/Images/solution-dashboard.png"
                alt="Ownbase dashboard — your code, your control"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — How It Works (two-column: summary + tabs) */}
      <section id="how-it-works" className="border-b border-border bg-surface/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <h2
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-center"
            data-aos="fade-up"
            data-aos-duration="550"
          >
            How Ownbase Works
          </h2>
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
            {/* Left: summary */}
            <div className="space-y-4" data-aos="fade-right" data-aos-duration="550" data-aos-delay="100">
              <p className="text-muted leading-relaxed">
                Ownbase puts you in control of your codebase in four clear steps. Connect your repos,
                keep everything secure under your organization, collaborate with your team, and
                revoke access whenever you need — no lock-in, no surprises.
              </p>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
                    1
                  </span>
                  Connect your repository or upload your project — GitHub, GitLab, or direct upload.
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
                    2
                  </span>
                  Your code is stored in an environment owned by your business.
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
                    3
                  </span>
                  Grant developers access; add or remove team members anytime. Every change is tracked.
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
                    4
                  </span>
                  Revoke access in one click. You always own the repo.
                </li>
              </ul>
            </div>
            {/* Right: interactive tabs */}
            <div
              className="rounded-2xl border border-border bg-background p-6 sm:p-8 min-h-[320px] flex flex-col"
              data-aos="fade-left"
              data-aos-duration="550"
              data-aos-delay="150"
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

      {/* Section 5 — Features (highlight + bento grid) */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
          <h2
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-center"
            data-aos="fade-up"
            data-aos-duration="550"
          >
            Built for Business Owners Who Want Control
          </h2>
          <div className="mt-14 space-y-8">
            <div
              className="rounded-2xl border border-border bg-surface/50 p-8 sm:p-10"
              data-aos="fade-up"
              data-aos-duration="550"
              data-aos-delay="50"
            >
              <h3 className="text-xl font-medium text-foreground">Secure code vault</h3>
              <p className="mt-3 max-w-2xl text-muted leading-relaxed">
                Store all your repositories in one safe, centralized system. No more code
                scattered across freelancers&apos; laptops or personal accounts. Your company
                owns the source of truth, with backups and access control built in.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="100">
                <FeatureCard
                  icon={<IconKey className="h-11 w-11 text-accent" />}
                  title="Access control"
                  description="Grant or revoke developer access instantly. No more waiting or lost credentials."
                />
              </div>
              <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="150">
                <FeatureCard
                  icon={<IconHistory className="h-11 w-11 text-accent" />}
                  title="Activity logs"
                  description="See who accessed or modified your code. Full audit trail when you need it."
                />
              </div>
              <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="200">
                <FeatureCard
                  icon={<IconCloud className="h-11 w-11 text-accent" />}
                  title="Backup"
                  description="Automatic backups so your code is never lost, no matter what happens."
                />
              </div>
              <div data-aos="fade-up" data-aos-duration="550" data-aos-delay="250">
                <FeatureCard
                  icon={<IconFolders className="h-11 w-11 text-accent" />}
                  title="Multi-project"
                  description="Manage multiple products and teams in one place."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — Live dashboard (business asset view) */}
      <LiveDashboardSection />

      {/* Section 6 — Trust (interactive: value pills, quote, trusted by) */}
      <TrustSection />

      {/* Section 7 — Final CTA (interactive) */}
      <FinalCtaSection />
    </>
  );
}

function LiveDashboardSection() {
  return (
    <section id="live-dashboard" className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 80% 40%, var(--accent) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div data-aos="fade-right" data-aos-duration="550">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Live Dashboard
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            See Your Code as a Business Asset
          </h2>
          <p className="mt-4 text-muted leading-relaxed">
            Transform abstract repositories into clear business intelligence.
            Track technical risk, understand team activity, and identify critical
            dependencies in language that makes sense to leadership.
          </p>

          <div className="mt-8 space-y-4">
            <DashboardFeatureItem
              icon={<IconChartPie className="h-5 w-5 text-accent" />}
              title="Business logic mapping"
              description="Spot where payments, user identity, and core product workflows are handled."
            />
            <DashboardFeatureItem
              icon={<IconActivity className="h-5 w-5 text-accent" />}
              title="Health scoring"
              description="Prioritize weak modules before incidents impact customer experience."
            />
            <DashboardFeatureItem
              icon={<IconUsersGroup className="h-5 w-5 text-accent" />}
              title="Team analytics"
              description="See contribution concentration so you can reduce single-person risk."
            />
          </div>
        </div>

        <div data-aos="fade-left" data-aos-duration="550" data-aos-delay="80">
          <div className="rounded-2xl border border-border bg-surface/60 p-1 shadow-lg">
            <div className="relative overflow-hidden rounded-xl border border-border/70 bg-background/90 p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-accent/60 via-accent to-accent/60" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Business Impact Analysis</span>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
                  Live
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <MetricRow label="Payment processing" widthClass="w-[95%]" tone="bg-emerald-500" level="Critical" />
                <MetricRow label="User authentication" widthClass="w-[88%]" tone="bg-accent" level="High" />
                <MetricRow label="Reporting module" widthClass="w-[72%]" tone="bg-amber-500" level="Medium" />
              </div>

              <div className="mt-6 rounded-lg border border-accent/30 bg-accent/10 p-4">
                <div className="flex items-start gap-3">
                  <IconBulb className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-foreground">AI recommendation</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Payment logic has single-contributor dependency. Recommend cross-training
                      and exporting documentation for continuity.
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
    <div className="group flex items-start gap-4 rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/35 hover:bg-surface-elevated">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 transition-transform group-hover:scale-105">
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
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 p-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-border/70">
          <div className={`h-full ${widthClass} ${tone}`} />
        </div>
        <span className="text-xs text-muted">{level}</span>
      </div>
    </div>
  );
}

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
      {/* Subtle grid + gradient to match site theme */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, var(--accent) 0%, transparent 55%)",
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

        <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
          {TRUST_PILLS.map((label, i) => (
            <motion.span
              key={label}
              className="cursor-default rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
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
                boxShadow: "0 0 0 1px var(--accent), 0 8px 20px -6px rgba(74, 144, 217, 0.25)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {label}
            </motion.span>
          ))}
        </div>

        <motion.div
          className="mt-14 sm:mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <blockquote className="relative rounded-xl border border-border bg-surface/60 px-6 py-6 sm:px-8 sm:py-7 text-left shadow-lg">
            <span
              className="absolute left-4 top-5 text-accent/40"
              aria-hidden
            >
              <IconQuote className="h-8 w-8 sm:h-9 sm:w-9" />
            </span>
            <p className="pl-10 sm:pl-12 text-foreground leading-relaxed text-base sm:text-lg italic">
              Ownbase ensures our company will never lose access to our
              platform again.
            </p>
            <footer className="mt-4 pl-10 sm:pl-12 text-sm text-muted not-italic">
              — Startup Founder
            </footer>
            {/* Accent left edge */}
            <div
              className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-accent/80"
              aria-hidden
            />
          </blockquote>
        </motion.div>

        <motion.div
          className="mt-14 sm:mt-16 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-sm font-medium opacity-90">Trusted by</span>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {TRUSTED_BY.map((label, i) => (
              <motion.span
                key={label}
                className="rounded-lg border border-border bg-surface/50 px-5 py-2.5 text-sm font-medium text-muted cursor-default"
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

const CTA_PILLS = [
  "Own your code",
  "Revoke access in one click",
  "No lock-in",
] as const;

const CTA_ICONS = [
  { Icon: IconLockCheck, label: "Control" },
  { Icon: IconShieldLock, label: "Secure" },
  { Icon: IconKey, label: "Access" },
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
      {/* Subtle grid + accent glow — matches Trust and hero theme */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, var(--accent) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32 text-center">
        {/* Headline — staggered word reveal */}
        <motion.h2
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl max-w-3xl mx-auto leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block">Stop Losing Control</span>
          <br className="sm:hidden" />
          <motion.span
            className="inline-block text-accent"
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
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

        {/* Interactive value pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {CTA_PILLS.map((label, i) => (
            <motion.span
              key={label}
              className="cursor-default rounded-full border border-border bg-background/80 px-4 py-2.5 text-sm font-medium text-muted backdrop-blur-sm transition-colors"
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
                boxShadow: "0 0 0 1px var(--accent), 0 10px 24px -8px rgba(74, 144, 217, 0.3)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {label}
            </motion.span>
          ))}
        </div>

        {/* Icon row — subtle, animated */}
        <motion.div
          className="mt-10 flex justify-center gap-8 sm:gap-12"
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
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-border bg-surface/60 text-accent [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.35,
                  delay: 0.5 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  borderColor: "var(--accent)",
                  boxShadow: "0 0 20px -4px rgba(74, 144, 217, 0.4)",
                }}
              >
                <Icon />
              </motion.div>
              <span className="text-xs font-medium text-muted">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA button — prominent, interactive */}
        <motion.div
          className="mt-10 sm:mt-12"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/signup" className="inline-block">
            <motion.span
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-8 py-4 text-sm font-semibold shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
              whileHover={{
                scale: 1.03,
                boxShadow: "0 12px 32px -8px rgba(74, 144, 217, 0.45), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              Secure Your Code Today
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function ProblemCard({
  icon,
  title,
  description,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-background p-5 sm:p-6 min-h-[200px] sm:min-h-[220px] transition-colors hover:border-border/80 hover:bg-surface/30 hover-lift ${className}`}
    >
      <motion.div
        className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7"
        whileHover={{ scale: 1.08, rotate: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {icon}
      </motion.div>
      <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed flex-1">{description}</p>
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
    <div className="flex flex-col rounded-xl border border-border bg-surface/50 p-6 hover-lift">
      <motion.div
        className="flex shrink-0"
        whileHover={{ scale: 1.15, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {icon}
      </motion.div>
      <h3 className="mt-4 text-base font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
