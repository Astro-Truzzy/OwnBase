"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCheck, IconPlus } from "@tabler/icons-react";
import {
  ADDONS,
  COMPACT_TIERS,
  DETAIL_TIERS,
  ENTERPRISE_CONTACT_HREF,
  LOGIN_DASHBOARD_REDIRECT,
  PRICING_HERO,
  TIER_ANNUAL_PRICE_NGN,
  TIER_MONTHLY_PRICE_NGN,
  TIER_WAS_MONTHLY_PRICE_NGN,
  annualEffectiveMonthly,
  formatNgn,
  type BillingInterval,
} from "@/lib/pricing-tiers";
import { cn } from "@/lib/utils";

type PricingPlansProps = {
  /** `page` uses an `<h1>`; `section` uses `<h2>` for the headline. */
  variant?: "page" | "section";
};

const PRO_VISIBLE_COUNT = 6;

export function PricingPlans({ variant = "page" }: PricingPlansProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const Heading = variant === "page" ? "h1" : "h2";
  const titleClass =
    variant === "page"
      ? "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      : "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Heading className={titleClass}>{PRICING_HERO.headline}</Heading>
        <p className="mt-4 text-muted leading-relaxed">{PRICING_HERO.subhead}</p>
      </div>

      <div className="mt-8 flex justify-center">
        <div
          role="group"
          aria-label="Billing interval"
          className="inline-flex rounded-lg border border-border bg-card p-0.5 dark:bg-surface/40"
        >
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              interval === "monthly"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("annual")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              interval === "annual"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground",
            )}
          >
            Annual — save 2 months
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-5">
        {COMPACT_TIERS.map((tier) => {
          const isPro = tier.id === "pro";
          const isFree = tier.id === "free";
          const monthlyPrice = TIER_MONTHLY_PRICE_NGN[tier.id];
          const wasPrice = TIER_WAS_MONTHLY_PRICE_NGN[tier.id];
          const annualPrice =
            tier.id === "starter" || tier.id === "pro"
              ? TIER_ANNUAL_PRICE_NGN[tier.id]
              : undefined;
          const visibleFeatures = isPro
            ? tier.features.slice(0, PRO_VISIBLE_COUNT)
            : tier.features;
          const hiddenFeatures = isPro ? tier.features.slice(PRO_VISIBLE_COUNT) : [];

          return (
            <div
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm dark:bg-surface/40 sm:p-8",
                isPro
                  ? "border-2 border-dashed border-slate-300 shadow-md dark:border-slate-600"
                  : "border-border",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                {tier.badge && (
                  <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    {tier.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{tier.tagline}</p>

              <div className="mt-6 flex items-baseline gap-2">
                {wasPrice && interval === "monthly" && (
                  <span className="text-lg text-muted line-through">
                    {formatNgn(wasPrice)}
                  </span>
                )}
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {isFree
                    ? "₦0"
                    : interval === "annual" && annualPrice
                      ? formatNgn(annualEffectiveMonthly(tier.id as "starter" | "pro"))
                      : formatNgn(monthlyPrice)}
                </span>
                <span className="text-sm text-muted">per month</span>
              </div>
              {interval === "annual" && annualPrice && (
                <p className="mt-1 text-xs text-muted">
                  {formatNgn(annualPrice)}/yr billed upfront
                </p>
              )}

              <Link
                href={LOGIN_DASHBOARD_REDIRECT}
                className={cn(
                  "mt-8 flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold transition-colors",
                  isPro
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "border border-border bg-background text-foreground hover:border-accent/40 hover:bg-accent/5 dark:bg-surface/50",
                )}
              >
                {isFree ? "Get started free" : "Get started"}
              </Link>

              <ul className="mt-8 space-y-3.5">
                {visibleFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground/90">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                      <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {hiddenFeatures.length > 0 && (
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
                    <span className="sr-only">Show more {tier.name} features</span>
                  </summary>
                  <ul className="mt-4 space-y-3 border-t border-transparent pt-2">
                    {hiddenFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-foreground/90">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                          <IconCheck className="h-3 w-3" stroke={2} aria-hidden />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-6">
        {DETAIL_TIERS.map((tier) => {
          const monthlyPrice =
            tier.id === "agency" ? TIER_MONTHLY_PRICE_NGN.agency : undefined;
          const annualPrice =
            tier.id === "agency" ? TIER_ANNUAL_PRICE_NGN.agency : undefined;

          return (
            <div
              key={tier.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:bg-surface/40 sm:p-8"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                    {tier.badge && (
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                    {tier.tagline}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                  {monthlyPrice != null ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-semibold tracking-tight text-foreground">
                          {interval === "annual" && annualPrice
                            ? formatNgn(annualEffectiveMonthly("agency"))
                            : formatNgn(monthlyPrice)}
                        </span>
                        <span className="text-sm text-muted">per month</span>
                      </div>
                      {interval === "annual" && annualPrice && (
                        <p className="text-xs text-muted">
                          {formatNgn(annualPrice)}/yr billed upfront
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-foreground">
                      {tier.customPriceLabel}
                    </span>
                  )}
                  {tier.id === "agency" ? (
                    <Link
                      href={LOGIN_DASHBOARD_REDIRECT}
                      className="mt-2 flex w-full items-center justify-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover sm:w-auto"
                    >
                      Get started
                    </Link>
                  ) : (
                    <a
                      href={ENTERPRISE_CONTACT_HREF}
                      className="mt-2 flex w-full items-center justify-center rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 dark:bg-surface/50 sm:w-auto"
                    >
                      Contact sales
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-border">
                {tier.includedTable.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      "grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-4",
                      i % 2 === 1 && "bg-surface/40",
                      i !== 0 && "border-t border-border",
                    )}
                  >
                    <span className="text-sm font-medium text-foreground">{row.label}</span>
                    <span className="text-sm text-muted">{row.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 dark:bg-surface/40 sm:p-8">
        <h4 className="text-sm font-semibold text-foreground">
          Outgrow a tier mid-cycle? Add on without upgrading.
        </h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ADDONS.map((addon) => (
            <div
              key={addon.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 dark:bg-surface/50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{addon.name}</p>
                <p className="text-xs text-muted">{addon.appliesTo}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{addon.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center sm:mt-14">
        <p className="text-sm text-muted">{PRICING_HERO.footerNote}</p>
        <p className="mt-4 text-sm text-muted">
          Questions?{" "}
          <a
            href={`mailto:${PRICING_HERO.contactEmail}`}
            className="font-medium text-accent hover:underline"
          >
            {PRICING_HERO.contactEmail}
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
