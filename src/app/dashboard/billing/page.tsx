import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  IconCreditCard,
  IconShield,
  IconCalendar,
  IconCheck,
  IconRocket,
} from "@tabler/icons-react";
import { SubscribeButton } from "./subscribe-button";
import { ManageSubscriptionButton } from "./manage-subscription-button";

export const metadata = {
  title: "Billing",
  description: "Manage your subscription and billing.",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at, plan, subscription_ends_at, paystack_subscription_code")
    .eq("user_id", user.id)
    .single();

  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const subscriptionEndsAt = profile?.subscription_ends_at
    ? new Date(profile.subscription_ends_at)
    : null;
  const hasActiveSubscription =
    subscriptionEndsAt != null && subscriptionEndsAt > new Date();
  const trialExpired = trialEndsAt != null && trialEndsAt <= new Date();
  const onTrial = trialEndsAt != null && trialEndsAt > new Date();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-surface/30 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconCreditCard className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Billing
          </h1>
        </div>
        <p className="mt-2 text-muted">
          Your plan, trial, and subscription. Pay securely with Paystack when you&apos;re ready.
        </p>
      </div>

      {/* Status card */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">Current status</h2>
        <div className="mt-4 space-y-4">
          {hasActiveSubscription && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-elevated/50 p-4">
              <IconCheck className="h-5 w-5 shrink-0 text-green-500" aria-hidden />
              <div>
                <p className="font-medium text-foreground">Active subscription</p>
                <p className="text-sm text-muted">
                  Your subscription is active until{" "}
                  {subscriptionEndsAt?.toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                  .
                </p>
              </div>
            </div>
          )}
          {onTrial && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-elevated/50 p-4">
              <IconCalendar className="h-5 w-5 shrink-0 text-accent" aria-hidden />
              <div>
                <p className="font-medium text-foreground">Free trial</p>
                <p className="text-sm text-muted">
                  Your trial ends on{" "}
                  {trialEndsAt?.toLocaleDateString(undefined, { dateStyle: "long" })}.
                  No charge until then.
                </p>
              </div>
            </div>
          )}
          {trialExpired && !hasActiveSubscription && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <IconRocket className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div>
                <p className="font-medium text-foreground">Trial ended</p>
                <p className="text-sm text-muted">
                  Subscribe now to keep full access to your repositories and features.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscribe section */}
      {(!hasActiveSubscription || trialExpired) && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Subscribe with Paystack</h2>
          <p className="mt-2 text-sm text-muted">
            Choose a plan and complete payment securely. You&apos;ll be charged monthly. You can
            cancel or update your card from your Paystack dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <SubscribeButton planId="starter" />
            <SubscribeButton planId="pro" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <IconShield className="h-4 w-4 shrink-0" aria-hidden />
            <span>Secured by Paystack. We never store your card details.</span>
          </div>
        </div>
      )}

      {hasActiveSubscription && profile?.paystack_subscription_code && (
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Manage subscription</h2>
          <p className="mt-2 text-sm text-muted">
            Update your payment method or cancel from Paystack&apos;s subscription management page.
          </p>
          <ManageSubscriptionButton />
        </div>
      )}

      <p className="text-sm text-muted">
        <Link href="/pricing" className="text-accent hover:underline">
          View all plans
        </Link>{" "}
        on the pricing page.
      </p>
    </div>
  );
}
