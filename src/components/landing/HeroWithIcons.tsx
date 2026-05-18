"use client";

import {
  IconBrandGithub,
  IconBrandGitlab,
  IconKey,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { HeroIllustration } from "./HeroIllustration";

const BADGES = [
  { icon: IconBrandGithub, label: "GitHub", color: "text-foreground/70" },
  { icon: IconBrandGitlab, label: "GitLab", color: "text-orange-400/80" },
  { icon: IconKey, label: "Access Control", color: "text-accent" },
  {
    icon: IconShieldCheck,
    label: "Secure Vault",
    color: "text-accent-emerald",
  },
] as const;

const STAGGER = 0.06;

export function HeroWithIcons() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div className="flex flex-col gap-5 w-full max-w-xl lg:max-w-2xl" ref={ref}>
      {/* Illustration card */}
      <motion.div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface/60 shadow-2xl shadow-black/25 backdrop-blur-sm dark:border-border/90 dark:bg-surface/50 dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65),0_0_48px_-8px_rgba(34,211,238,0.12)] dark:ring-1 dark:ring-accent/20"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Gradient top accent line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.6) 40%, rgba(167,139,250,0.5) 70%, transparent)",
          }}
          aria-hidden
        />
        {/* Ambient inner glow */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 60% 0%, rgba(34,211,238,0.05) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 p-2">
          <HeroIllustration />
        </div>
      </motion.div>

      {/* Feature badges */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {BADGES.map(({ icon: Icon, label, color }, i) => (
          <motion.div
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm transition-colors hover:border-accent/45 hover:text-foreground dark:border-border/70 dark:bg-surface/80 dark:text-muted-foreground dark:hover:text-zinc-200"
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{
              duration: 0.35,
              delay: 0.3 + i * STAGGER,
              ease: "easeOut",
            }}
            whileHover={{ scale: 1.04 }}
          >
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            {label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
