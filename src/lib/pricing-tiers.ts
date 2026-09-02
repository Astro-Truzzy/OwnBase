/**
 * Single source of truth for pricing page copy and numbers (Pricing Redesign
 * Spec v1). `plan-limits.ts` and `admin/metrics.ts` import the numeric prices
 * from here so there is exactly one place that says what a plan costs.
 */

export type BillingInterval = "monthly" | "annual";

export const LOGIN_DASHBOARD_REDIRECT = "/login?redirectTo=%2Fdashboard";

/** Monthly price in NGN for every tier that has one (Enterprise is custom). */
export const TIER_MONTHLY_PRICE_NGN = {
  free: 0,
  starter: 8_500,
  pro: 18_000,
  agency: 38_000,
} as const;

/** Previous monthly price, shown struck through on Starter/Pro. */
export const TIER_WAS_MONTHLY_PRICE_NGN: Partial<
  Record<keyof typeof TIER_MONTHLY_PRICE_NGN, number>
> = {
  starter: 6_500,
  pro: 15_000,
};

/** Annual price billed upfront (≈ 2 months free vs. monthly × 12). */
export const TIER_ANNUAL_PRICE_NGN: Partial<
  Record<keyof typeof TIER_MONTHLY_PRICE_NGN, number>
> = {
  starter: 85_000,
  pro: 180_000,
  agency: 380_000,
};

export function formatNgn(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function annualEffectiveMonthly(tier: "starter" | "pro" | "agency"): number {
  return Math.round(TIER_ANNUAL_PRICE_NGN[tier]! / 12);
}

export interface CompactTierCopy {
  id: "free" | "starter" | "pro";
  name: string;
  tagline: string;
  badge?: string;
  features: string[];
}

/** Free / Starter / Pro — rendered as the familiar 3-card row. */
export const COMPACT_TIERS: CompactTierCopy[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it before you need it.",
    features: [
      "1 tracked repository",
      "1 seat (just you)",
      "Continuity score",
      "Audit log (30-day history)",
      "1 AI summary/month",
      "No card required",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Perfect for small teams getting clear ownership of their code.",
    features: [
      "Up to 5 tracked repositories",
      "Up to 3 seats",
      "AI executive summaries — 10 regenerations/mo",
      "Handoff brief PDFs",
      "Full activity & audit log",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing teams managing serious codebases.",
    badge: "MOST POPULAR",
    features: [
      "Up to 25 tracked repositories",
      "Up to 10 seats",
      "Unlimited AI summary regeneration",
      "Everything in Starter",
      "Advanced per-repo access policies",
      "API access",
      "Team collaboration tools",
      "Export & compliance reports",
      "Priority support",
    ],
  },
];

export interface DetailTierCopy {
  id: "agency" | "enterprise";
  name: string;
  tagline: string;
  badge?: string;
  customPriceLabel?: string;
  includedTable: { label: string; detail: string }[];
}

/** Agency / Enterprise — rendered as wide panels with an included/detail table. */
export const DETAIL_TIERS: DetailTierCopy[] = [
  {
    id: "agency",
    name: "Agency",
    tagline: "For agencies and studios managing repositories across multiple clients.",
    badge: "NEW TIER",
    includedTable: [
      { label: "Repositories", detail: "Up to 60" },
      { label: "Seats", detail: "Up to 25" },
      {
        label: "Client workspaces",
        detail: "Group repositories by client; a separate Continuity Score per client",
      },
      {
        label: "White-labeled handoff PDFs",
        detail: "Agency branding replaces the Ownbase mark on exported handoff documents",
      },
      {
        label: "Everything in Pro",
        detail: "Unlimited AI regeneration, advanced access policies, API access, priority support",
      },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For organizations that need full control, compliance, and support.",
    customPriceLabel: "Starting at ₦65,000/month — custom above that",
    includedTable: [
      { label: "Repositories & seats", detail: "Unlimited" },
      { label: "SSO & SAML", detail: "Included" },
      { label: "Audit logs & retention", detail: "Custom retention windows, exportable" },
      { label: "Custom workflows & integrations", detail: "Built to spec" },
      { label: "Support", detail: "24/7 dedicated support + dedicated success manager" },
      { label: "SLA", detail: "Guaranteed uptime and response-time SLA" },
    ],
  },
];

/** `type` matches plan-limits.ts's AddonType — kept as a literal here to avoid a circular import (plan-limits.ts already imports from this file). */
export const ADDONS = [
  {
    type: "repos",
    name: "+5 repositories",
    price: "₦2,000/mo",
    appliesTo: "Starter, Pro",
  },
  {
    type: "seats",
    name: "+2 seats",
    price: "₦1,500/mo",
    appliesTo: "Starter, Pro, Agency",
  },
] as const satisfies ReadonlyArray<{
  type: "repos" | "seats";
  name: string;
  price: string;
  appliesTo: string;
}>;

export const PRICING_HERO = {
  headline: "Simple, transparent pricing",
  subhead:
    "Start free. Upgrade only once you actually need more repos, more seats, or more control — no forced commitment, no hidden fees.",
  footerNote:
    "All paid plans include a 30-day free trial. No card required. Pay securely with Paystack when you subscribe.",
  contactEmail: "support@ownbase.com",
} as const;

export const ENTERPRISE_CONTACT_HREF =
  "mailto:support@ownbase.com?subject=Enterprise%20plan";
