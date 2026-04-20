import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the Ownbase team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
          <p>
            Need help with billing, account setup, repository access, or
            onboarding? Reach us by email and we will get back to you as soon as
            possible.
          </p>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-foreground font-medium">Support</p>
            <a
              href="mailto:support@ownbase.com"
              className="text-accent hover:underline"
            >
              support@ownbase.com
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
