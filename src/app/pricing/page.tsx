import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  IconCheck,
  IconRocket,
  IconShield,
  IconFolder,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start with a 1-month free trial. No card required. Subscribe with Paystack when you're ready.",
};

const TRIAL_DAYS = 30;

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "For solo founders and small teams taking control of their code.",
    priceMonthly: "₦9,999",
    priceYearlyNote: "Billed monthly. Annual plans coming soon.",
    features: [
      "Up to 5 tracked repositories",
      "AI executive summaries",
      "Handoff brief PDFs",
      "Activity & audit log",
      "1 project upload (zip)",
      "Email support",
    ],
    cta: "Start free trial",
    ctaHref: "/signup",
    highlighted: true,
    icon: IconFolder,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams and agencies managing multiple clients.",
    priceMonthly: "₦24,999",
    priceYearlyNote: "Billed monthly.",
    features: [
      "Up to 25 tracked repositories",
      "Everything in Starter",
      "Unlimited project uploads",
      "Priority support",
      "Export & compliance reports",
    ],
    cta: "Start free trial",
    ctaHref: "/signup",
    highlighted: false,
    icon: IconShield,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Logo className="h-4 w-4" />
            </span>
            Ownbase
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-accent"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-muted leading-relaxed">
            Start with a <strong className="text-foreground">{TRIAL_DAYS}-day free trial</strong>.
            No card required. We&apos;ll only ask you to subscribe when you&apos;re ready to continue.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/50 px-4 py-2 text-sm text-muted">
            <IconShield className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>Pay securely with Paystack (cards, bank transfer, USSD)</span>
          </div>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:gap-10 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 sm:p-8 ${
                  plan.highlighted
                    ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                    : "border-border bg-surface/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                    Most popular
                  </div>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  {plan.name}
                </h2>
                <p className="mt-2 text-sm text-muted">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-foreground">
                    {plan.priceMonthly}
                  </span>
                  <span className="text-muted">/month</span>
                </div>
                <p className="mt-1 text-xs text-muted">{plan.priceYearlyNote}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted">
                      <IconCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.ctaHref}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                    plan.highlighted
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border border-border bg-surface text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <IconRocket className="h-4 w-4" aria-hidden />
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted">
            Need more repos or a custom plan?{" "}
            <a href="mailto:support@ownbase.com" className="text-accent hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
