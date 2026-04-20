import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Ownbase",
  description: "Why Ownbase exists and who it helps.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          About Ownbase
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
          <p>
            Ownbase helps founders and business teams keep control of the
            software that runs their company. When external developers build
            critical systems, ownership clarity and access visibility should
            never be an afterthought.
          </p>
          <p>
            Our goal is to make software ownership practical: see what you have,
            who has access, what changed, and how to hand projects over safely
            when teams evolve.
          </p>
          <p>
            We focus on clear workflows across repository providers, secure
            storage for uploaded projects, and simple executive-level summaries
            that non-technical stakeholders can understand.
          </p>
        </div>
      </div>
    </main>
  );
}
