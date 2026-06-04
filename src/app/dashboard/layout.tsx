import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { ensureTrialForNewAccount } from "@/lib/profiles/ensure-trial";
import { createClient } from "../../lib/supabase/server";
import { DashboardMobileNavProvider } from "./dashboard-mobile-nav";
import { DashboardRepoConnectGate } from "./dashboard-repo-connect-gate";
import { DashboardSearchProvider } from "./dashboard-search-context";
import { DashboardSideRail } from "./dashboard-side-rail";
import { DashboardTopBar } from "./dashboard-top-bar";

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
      "first_name, last_name, business_name, avatar_storage_path, trial_ends_at, plan, subscription_ends_at, dashboard_walkthrough_completed_at",
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
    await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        first_name: first,
        last_name: last,
        business_name: (meta.business_name as string)?.trim() || null,
        business_sector: (meta.business_sector as string)?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    await ensureTrialForNewAccount(user.id, user.created_at);
    const { data: created } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, business_name, avatar_storage_path, trial_ends_at, plan, subscription_ends_at, dashboard_walkthrough_completed_at",
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

  const hasConnectedProvider =
    user.identities?.some(
      (identity) =>
        identity.provider === "github" || identity.provider === "gitlab",
    ) ?? false;
  const walkthroughCompleted =
    profileRow?.dashboard_walkthrough_completed_at != null;

  let avatarSignedUrl: string | null = null;
  const avatarPath = profileRow?.avatar_storage_path as string | null | undefined;
  if (avatarPath) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 3600);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      {trialExpired && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-200">
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

      <Suspense fallback={null}>
        <DashboardRepoConnectGate
          hasConnectedProvider={hasConnectedProvider}
          walkthroughCompleted={walkthroughCompleted}
        />
      </Suspense>
      <Suspense fallback={null}>
        <DashboardSearchProvider>
          <DashboardMobileNavProvider>
          <div className="flex h-full">
            <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex lg:w-64">
            <div className="border-b border-border/80 px-5 py-5">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Logo className="h-8 w-8" />
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Ownbase
                </span>
              </Link>
            </div>

            <DashboardSideRail />
          </aside>

          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <Suspense fallback={null}>
              <DashboardTopBar
                displayName={displayName}
                initials={initials}
                email={user.email ?? null}
                plan={profileRow?.plan ?? null}
                avatarUrl={avatarSignedUrl}
              />
            </Suspense>

            <div className="app-scrollbar dash-page relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              <div className="dash-ambient z-0" aria-hidden />
              <div
                className="pointer-events-none absolute inset-0 z-10 opacity-[0.025]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                }}
                aria-hidden
              />
              <div
                className="dash-grid-overlay pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px]"
                aria-hidden
              />
              <div className="relative z-2 min-w-0 w-full max-w-full">
                {children}
              </div>
            </div>
          </main>
          </div>
          </DashboardMobileNavProvider>
        </DashboardSearchProvider>
      </Suspense>
    </div>
  );
}
