import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PricingPlans } from "@/components/landing/PricingPlans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing. Choose a plan that fits your team. Pay securely with Paystack.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <Logo variant="full" className="max-h-8" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-accent">
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <PricingPlans variant="page" />
      </main>
    </div>
  );
}
