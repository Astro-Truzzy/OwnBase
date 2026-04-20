import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconBell, IconCalendar, IconChevronRight } from "@tabler/icons-react";
import { Logo } from "@/components/Logo";
import { createClient } from "../../lib/supabase/server";
import { DashboardSideRail } from "./dashboard-side-rail";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your control center for software ownership.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, business_name, trial_ends_at, plan, subscription_ends_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profileRow) {
    const meta = user.user_metadata ?? {};
    const firstName =
      (meta.first_name as string)?.trim() ||
      (meta.given_name as string)?.trim() ||
      null;
    const lastName =
      (meta.last_name as string)?.trim() ||
      (meta.family_name as string)?.trim() ||
      null;
    const fullName = (meta.full_name as string) ?? (meta.name as string) ?? "";
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const first = firstName ?? parts[0] ?? null;
    const last =
      lastName ??
      (parts.length > 1 ? parts.slice(1).join(" ") : parts[0]) ??
      null;
    const trialEndsAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        first_name: first,
        last_name: last,
        business_name: (meta.business_name as string)?.trim() || null,
        business_sector: (meta.business_sector as string)?.trim() || null,
        updated_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt,
        plan: "trial",
      },
      { onConflict: "user_id" },
    );
    const { data: created } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, business_name, trial_ends_at, plan, subscription_ends_at",
      )
      .eq("user_id", user.id)
      .single();
    profileRow = created ?? profileRow;
  }

  const trialEndsAt = profileRow?.trial_ends_at
    ? new Date(profileRow.trial_ends_at)
    : null;
  const subscriptionEndsAt = profileRow?.subscription_ends_at
    ? new Date(profileRow.subscription_ends_at)
    : null;
  const hasActiveSubscription =
    subscriptionEndsAt != null && subscriptionEndsAt > new Date();
  const trialExpired =
    trialEndsAt != null && trialEndsAt <= new Date() && !hasActiveSubscription;

  const displayName =
    profileRow?.first_name || profileRow?.last_name
      ? [profileRow.first_name, profileRow.last_name]
          .filter(Boolean)
          .join(" ")
          .trim()
      : (user.email ?? "Account");
  const initials =
    (
      (profileRow?.first_name?.[0] ?? "") + (profileRow?.last_name?.[0] ?? "")
    ).toUpperCase() ||
    (user.email?.slice(0, 2).toUpperCase() ?? "OB");

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      {trialExpired && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
          Your free trial has ended.{" "}
          <Link
            href="/dashboard/billing"
            className="font-semibold underline underline-offset-2"
          >
            Subscribe now
          </Link>{" "}
          to keep full access.
        </div>
      )}

      <div className="flex h-full">
        <aside className="hidden h-full w-64 shrink-0 border-r border-border bg-surface/70 md:flex md:flex-col">
          <div className="border-b border-border p-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
                <Logo className="h-4 w-4" />
              </span>
              <span className="text-xl font-medium tracking-tight">
                Ownbase
              </span>
            </Link>
          </div>

          <DashboardSideRail />

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-surface-elevated text-xs font-semibold text-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted">
                  {profileRow?.plan === "pro" ? "Pro plan" : "Administrator"}
                </p>
              </div>
              <IconChevronRight className="h-4 w-4 text-muted" aria-hidden />
            </div>
          </div>
        </aside>

        <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-background">
          <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-sm sm:px-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                Executive Dashboard
              </h1>
              <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Live
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-sm border border-border bg-surface-elevated px-3 py-1.5 text-sm text-muted">
                <IconCalendar className="h-4 w-4" />
                Last 30 days
              </div>
              <button
                type="button"
                className="relative rounded-sm p-2 text-muted transition-colors hover:text-foreground"
                aria-label="Notifications"
              >
                <IconBell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
              </button>
            </div>
          </header>

          <div className="relative flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <div
              className="pointer-events-none fixed inset-0 z-10 opacity-[0.03]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] opacity-[0.04]"
              aria-hidden
            />
            <div className="relative">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
