"use client";

import {
  IconBrandGithub,
  IconBrandGitlab,
  IconKey,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { HeroIllustration } from "@/components/landing/HeroIllustration";

const BADGES = [
  { icon: IconBrandGithub, label: "GitHub", color: "text-foreground/70" },
  { icon: IconBrandGitlab, label: "GitLab", color: "text-orange-400/80" },
  { icon: IconKey, label: "Access", color: "text-accent" },
  {
    icon: IconShieldCheck,
    label: "Vault",
    color: "text-accent-emerald",
  },
] as const;

const STAGGER = 0.05;

/**
 * Compact variant of the landing hero illustration — same visual language
 * (glass card, gradient hairline, ambient glow) for dashboard surfaces.
 */
export function DashboardLandingArt() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="flex h-full min-h-0 flex-col gap-3">
      <motion.div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/90 bg-surface/55 shadow-[0_20px_50px_-14px_rgba(0,0,0,0.55),0_0_40px_-10px_rgba(34,211,238,0.1)] backdrop-blur-md dark:border-border/80 dark:bg-surface/45 dark:ring-1 dark:ring-accent/15"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div
          className="absolute inset-x-0 top-0 z-10 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.55) 38%, rgba(167,139,250,0.45) 72%, transparent)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 55% at 55% -5%, rgba(34,211,238,0.12) 0%, transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-1 pt-1 pb-2 sm:px-2">
          <div className="w-full max-w-[340px] scale-[0.92] sm:max-w-[380px] sm:scale-95">
            <HeroIllustration />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {BADGES.map(({ icon: Icon, label, color }, i) => (
          <motion.span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm dark:border-border/60 dark:bg-surface/70 dark:text-muted-foreground sm:text-xs"
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{
              duration: 0.3,
              delay: 0.2 + i * STAGGER,
              ease: "easeOut",
            }}
          >
            <Icon className={`h-3 w-3 shrink-0 ${color}`} />
            {label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
