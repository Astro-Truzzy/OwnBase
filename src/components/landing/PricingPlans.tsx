import Link from "next/link";
import { IconCheck, IconPlus } from "@tabler/icons-react";
const LOGIN_DASHBOARD_REDIRECT = "/login?redirectTo=%2Fdashboard";

type PricingPlansProps = {
  /** `page` uses an `<h1>`; `section` uses `<h2>` for the headline. */
  variant?: "page" | "section";
};

export function PricingPlans({ variant = "page" }: PricingPlansProps) {
  const Heading = variant === "page" ? "h1" : "h2";
  const titleClass =
    variant === "page"
      ? "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      : "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Heading className={titleClass}>Simple, Transparent Pricing</Heading>
        <p className="mt-4 text-muted leading-relaxed">
          Choose a plan that works best for you and your team. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-5">
        {/* Starter */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-surface/40 sm:p-8">
          <h3 className="text-lg font-semibold text-foreground">Starter</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Perfect for small teams getting clear ownership of their code.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              ₦6,500
            </span>
            <span className="text-sm text-muted">per month</span>
          </div>
          <Link
            href={LOGIN_DASHBOARD_REDIRECT}
            className="mt-8 flex w-full items-center justify-center rounded-lg border border-border bg-background py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 dark:bg-surface/50"
          >
            Get Started
          </Link>
          <ul className="mt-8 space-y-3.5">
            {[
              "Up to 5 tracked repositories",
              "AI executive summaries",
              "Handoff brief PDFs",
              "Activity & audit log",
              "1 project upload (zip)",
              "Email support",
            ].map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-foreground/90"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro — highlighted */}
        <div className="relative flex flex-col rounded-2xl border-2 border-dashed border-slate-300 bg-card p-6 shadow-md dark:border-slate-600 dark:bg-surface/40 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Pro</h3>
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
              Popular
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            For growing teams and agencies managing multiple clients.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              ₦15,000
            </span>
            <span className="text-sm text-muted">per month</span>
          </div>
          <Link
            href={LOGIN_DASHBOARD_REDIRECT}
            className="mt-8 flex w-full items-center justify-center rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Get Started
          </Link>
          <ul className="mt-8 space-y-3.5">
            {[
              "Up to 25 tracked repositories",
              "Everything in Starter",
              "Unlimited project uploads",
              "Priority support",
              "API access",
            ].map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-foreground/90"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <details className="group mt-6">
            <summary className="relative cursor-pointer list-none py-2 [&::-webkit-details-marker]:hidden">
              <div
                className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
                aria-hidden
              />
              <div className="relative mx-auto flex w-max items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted shadow-sm transition-transform group-open:rotate-45">
                  <IconPlus className="h-4 w-4" stroke={2} aria-hidden />
                </span>
              </div>
              <span className="sr-only">Show more Pro features</span>
            </summary>
            <ul className="mt-4 space-y-3 border-t border-transparent pt-2">
              {[
                "Advanced access policies",
                "Team collaboration tools",
                "Export & compliance reports",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-sm text-foreground/90"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                    <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </details>
        </div>

        {/* Enterprise */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-surface/40 sm:p-8">
          <h3 className="text-lg font-semibold text-foreground">Enterprise</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            For organizations that need full control, compliance, and support.
          </p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              Custom
            </span>
            <span className="text-sm text-muted">pricing</span>
          </div>
          <a
            href="mailto:support@ownbase.com?subject=Enterprise%20plan"
            className="mt-8 flex w-full items-center justify-center rounded-lg border border-border bg-background py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 dark:bg-surface/50"
          >
            Contact sales
          </a>
          <ul className="mt-8 space-y-3.5">
            {[
              "Unlimited tracked repositories",
              "Unlimited uploads & members",
              "Custom workflows & integrations",
              "24/7 dedicated support",
              "Dedicated success manager",
            ].map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-foreground/90"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <details className="group mt-6">
            <summary className="relative cursor-pointer list-none py-2 [&::-webkit-details-marker]:hidden">
              <div
                className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
                aria-hidden
              />
              <div className="relative mx-auto flex w-max items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted shadow-sm transition-transform group-open:rotate-45">
                  <IconPlus className="h-4 w-4" stroke={2} aria-hidden />
                </span>
              </div>
              <span className="sr-only">Show more Enterprise features</span>
            </summary>
            <ul className="mt-4 space-y-3 pt-2">
              {["SSO & SAML", "Audit logs & retention", "SLA guarantee"].map(
                (f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-foreground/90"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                      <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                    </span>
                    {f}
                  </li>
                ),
              )}
            </ul>
          </details>
        </div>
      </div>

      <div className="mt-12 text-center sm:mt-14">
        <p className="text-sm text-muted">
          Start with a{" "}
          <strong className="font-semibold text-foreground">
            30-day free trial
          </strong>
          . No card required. Pay securely with Paystack when you subscribe.
        </p>
        <p className="mt-4 text-sm text-muted">
          Questions?{" "}
          <a
            href="mailto:support@ownbase.com"
            className="font-medium text-accent hover:underline"
          >
            support@ownbase.com
          </a>
        </p>
        {variant === "section" && (
          <p className="mt-4 text-sm">
            <Link
              href="/pricing"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Full pricing details
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
