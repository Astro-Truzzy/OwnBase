import Link from "next/link";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { LandingNav } from "../components/landing/LandingNav";
import { HeroWithIcons } from "../components/landing/HeroWithIcons";
import { LandingSections } from "../components/landing/LandingSections";
import { LandingFooter } from "../components/landing/LandingFooter";
import { GridBackground } from "@/components/ui/gridbackground";
import { ParallaxHeroImages } from "@/components/ui/parallax-hero-images";

const HERO_PARALLAX_IMAGES = [
  "/Images/3528471-01.jpg",
  "/Images/Business hero section.png",
  "/Images/dashboard-concept-illustration_114360-4351.avif",
  "/Images/small-business-corporation-management-small-and-medium-sized-enterprises-business.jpg",
  "/Images/github logo.png",
  "/Images/istockphoto-1315918172-612x612.jpg",
  "/Images/Programmer-Illustration.jpg",
  "/Images/Free-Business-Website-Illustration-JPEG-1.jpg",
];

export default function HomePage() {
  return (
    <div className="min-h-screen max-w-full bg-background flex flex-col">
      <LandingNav />

      <main className="flex-1 pt-14 lg:pt-0">
        {/* Section 1 — Hero */}
        <section
          id="top"
          className="relative min-h-screen border-b border-border overflow-hidden"
          aria-label="Hero"
        >
          {/* Grid pattern (bottom layer) */}
          <GridBackground
            className="absolute inset-0 z-0 min-h-0 [--grid-line-color:var(--muted)]"
            showVignette={false}
          />
          {/* Ambient glow orbs (subtle motion) */}
          <div
            className="pointer-events-none absolute -left-24 top-1/4 z-0 h-64 w-64 rounded-full bg-accent/15 blur-3xl hero-orb-float"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-1/4 z-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl hero-orb-float [animation-delay:1.5s]"
            aria-hidden
          />
          {/* Parallax images */}
          <ParallaxHeroImages
            images={HERO_PARALLAX_IMAGES}
            className="z-0"
            imageClassName="ring-border/50 object-cover opacity-90"
          />
          {/* Dark overlay for text contrast */}
          <div
            className="absolute inset-0 z-1 bg-black/80"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-background/60 px-3 py-1.5 text-xs font-medium text-accent backdrop-blur-sm">
                  <span className="status-dot" aria-hidden />
                  AI-powered code visibility for business owners
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  <EncryptedText
                    text="Your Code. Your Business. Your Control."
                    encryptedClassName="text-muted"
                    revealedClassName="text-foreground"
                    revealDelayMs={55}
                  />
                </h1>
                <p className="mt-4 text-lg text-muted leading-relaxed">
                  Ownbase ensures your company always owns and controls the
                  source code of your website, apps, and digital products — even
                  when external developers build them.
                </p>
                <p className="mt-4 text-sm text-muted/90 leading-relaxed">
                  Connect your repository or upload your project — GitHub, GitLab, or direct upload.
                  Your code is stored in an environment owned by your business.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-lg bg-accent text-white px-6 py-3 text-sm font-medium hover:bg-accent-hover transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background hover:shadow-lg hover:shadow-accent/20"
                  >
                    Start Securing Your Code
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-6 py-3 text-sm font-medium text-foreground hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                  >
                    See How It Works
                  </a>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-muted">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/80" aria-hidden />
                    No platform lock-in
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/80" aria-hidden />
                    One-click access control
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/80" aria-hidden />
                    Full activity trail
                  </span>
                </div>
              </div>
              <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                <HeroWithIcons />
              </div>
            </div>
          </div>
        </section>

        <LandingSections />
      </main>

      <LandingFooter />
    </div>
  );
}
