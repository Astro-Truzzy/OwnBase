import Link from "next/link";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { LandingNav } from "../components/landing/LandingNav";
import { HeroWithIcons } from "../components/landing/HeroWithIcons";
import { LandingSections } from "../components/landing/LandingSections";
import { LandingFooter } from "../components/landing/LandingFooter";
import { HeroBands } from "../components/landing/HeroBands";
import { ProductShowcase } from "../components/landing/ProductShowcase";
import {
  IconArrowRight,
  IconBrandGithub,
  IconBrandGitlab,
  IconShieldLock,
} from "@tabler/icons-react";
const LOGIN_DASHBOARD_REDIRECT = "/login?redirectTo=%2Fdashboard";

export default function HomePage() {
  return (
    <div className="relative min-h-screen max-w-full bg-background flex flex-col">
      <HeroBands />

      <LandingNav />

      <main className="flex-1 pt-14 lg:pt-0">
        {/* Hero */}
        <section id="top" className="relative min-h-screen" aria-label="Hero">
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              {/* Copy */}
              <div className="order-2 lg:order-1">
                {/* Eyebrow — neutral product label (avoid dev/AI cliché: mono, neon, pulse) */}
                <div className="inline-flex items-center gap-2 border border-border/90 bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-muted/35 dark:border-border">
                  {/* <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30 dark:bg-foreground/45"
                    aria-hidden
                  /> */}
                  <span className="tracking-[-0.01em]">
                    Code visibility for business owners
                  </span>
                </div>

                {/* Headline */}
                <h1 className="mt-5 text-[2.6rem] font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem] leading-[1.08]">
                  <span className="block text-foreground">
                    <EncryptedText
                      text="Your Code."
                      encryptedClassName="text-muted-foreground/55 dark:text-muted-foreground/50"
                      revealedClassName="text-foreground"
                      revealDelayMs={48}
                    />
                  </span>
                  <span className="block gradient-text">Your Business.</span>
                  <span className="block text-foreground">
                    <EncryptedText
                      text="Your Control."
                      encryptedClassName="text-muted-foreground/55 dark:text-muted-foreground/50"
                      revealedClassName="text-foreground"
                      revealDelayMs={52}
                    />
                  </span>
                </h1>

                <p className="mt-5 text-base text-muted leading-relaxed max-w-lg">
                  Ownbase ensures your company always owns and controls the
                  source code of your website, apps, and digital products — even
                  when external developers build them.
                </p>
                <p className="mt-3 text-sm text-muted-foreground/90 dark:text-zinc-400 leading-relaxed max-w-lg">
                  Connect via GitHub, GitLab, or direct upload. Your code lives
                  in an environment owned by your business, not your
                  contractors.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={LOGIN_DASHBOARD_REDIRECT}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent-hover transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background hover:shadow-[0_0_28px_rgba(34,211,238,0.35)] dark:shadow-[0_0_32px_rgba(34,211,238,0.42)] dark:hover:bg-accent-hover"
                  >
                    Start Securing Your Code
                    <IconArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-foreground hover:bg-surface hover:border-accent/35 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background backdrop-blur-sm dark:border-accent/35 dark:bg-surface-elevated/70 dark:text-zinc-100 dark:hover:border-accent/55 dark:hover:bg-surface"
                  >
                    See How It Works
                  </a>
                </div>

                {/* Trust bullets */}
                <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <IconBrandGithub className="h-3.5 w-3.5 text-accent dark:text-accent" />
                    <IconBrandGitlab className="h-3.5 w-3.5 text-orange-400/85 dark:text-orange-400/90 -ml-0.5" />
                    GitHub &amp; GitLab
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconShieldLock className="h-3.5 w-3.5 text-accent dark:text-accent" />
                    One-click access control
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-accent-emerald/70 dark:bg-emerald-400/90 shadow-[0_0_10px_rgba(52,211,153,0.45)]"
                      aria-hidden
                    />
                    No platform lock-in
                  </span>
                </div>
              </div>

              {/* Illustration */}
              <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                <HeroWithIcons />
              </div>
            </div>
          </div>
        </section>

        <ProductShowcase />

        <LandingSections />
      </main>

      <LandingFooter />
    </div>
  );
}
