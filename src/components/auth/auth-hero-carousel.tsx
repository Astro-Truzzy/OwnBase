"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useHtmlDark } from "@/hooks/useHtmlDark";
import {
  AuthArtIllustration,
  type AuthArtKey,
} from "@/components/auth/auth-art-illustrations";

const INTERVAL_MS = 6000;

type Slide = {
  id: string;
  artKey: AuthArtKey;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    id: "hub",
    artKey: "repos",
    title: "Your software, one home",
    subtitle: "Repositories, uploads, and ownership signals in a single executive view.",
  },
  {
    id: "secure",
    artKey: "shield",
    title: "Governance you can trust",
    subtitle: "Keep access, billing, and risk visibility aligned with how your business runs.",
  },
  {
    id: "upload",
    artKey: "upload",
    title: "Bring code from anywhere",
    subtitle: "GitHub, GitLab, or a direct upload — onboard projects without losing context.",
  },
  {
    id: "team",
    artKey: "team",
    title: "Built for your org",
    subtitle: "Give teams clarity while leadership keeps the portfolio picture sharp.",
  },
];

export function AuthHeroCarousel() {
  const reduceMotion = useReducedMotion();
  const isDark = useHtmlDark();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(
      () => setIndex((n) => (n + 1) % SLIDES.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [reduceMotion, paused]);

  const slide = SLIDES[index];
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      className="relative flex h-full min-h-[min(38vh,260px)] w-full flex-col overflow-hidden bg-transparent lg:min-h-0"
      aria-roledescription="carousel"
      aria-label="Product highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${SLIDES.length}: ${slide.title}`}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -14 }}
          transition={transition}
          className="absolute inset-0 flex flex-col bg-transparent"
        >
          <div className="relative flex min-h-[min(38vh,260px)] flex-1 flex-col items-center justify-center px-8 pb-20 pt-10 sm:px-12 lg:min-h-0 lg:h-full lg:px-14 lg:pb-24 lg:pt-16">
            <div className="flex w-full max-w-lg flex-col items-center gap-8">
              <div className="flex w-full max-w-md flex-col gap-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent dark:text-cyan-200/70">
                  Ownbase
                </p>
                <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground dark:text-white sm:text-3xl">
                  {slide.title}
                </h2>
                <p className="mx-auto max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground dark:text-slate-300/90">
                  {slide.subtitle}
                </p>
              </div>
              <div className="flex w-full justify-center">
                <AuthArtIllustration
                  artKey={slide.artKey}
                  reducedMotion={!!reduceMotion}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-8 pb-8">
        <div className="pointer-events-auto flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-offset-slate-950 ${
                i === index
                  ? "w-8 bg-accent dark:bg-cyan-400"
                  : "w-2 bg-foreground/20 hover:bg-foreground/35 dark:bg-white/25 dark:hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              aria-current={i === index ? "true" : undefined}
            />
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {slide.title}. {slide.subtitle}
      </p>
    </section>
  );
}
