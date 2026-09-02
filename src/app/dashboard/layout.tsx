import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { ensureTrialForNewAccount } from "@/lib/profiles/ensure-trial";
import { resolveEffectivePlanTier } from "@/lib/plan-limits";
import { computeAccessStatus } from "@/lib/subscription-access";
import { createClient } from "../../lib/supabase/server";
import { AccessStatusProvider } from "./access-status-context";
import { DashboardMobileNavProvider } from "./dashboard-mobile-nav";
import { DashboardRepoConnectGate } from "./dashboard-repo-connect-gate";
import { DashboardSearchProvider } from "./dashboard-search-context";
import { DashboardSideRail } from "./dashboard-side-rail";
import { DashboardTopBar } from "./dashboard-top-bar";
import { TrialCountdownBanner } from "./trial-countdown-banner";

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

  const accessStatus = computeAccessStatus(profileRow ?? {});

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
    <AccessStatusProvider value={accessStatus}>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <TrialCountdownBanner />

        <Suspense fallback={null}>
          <DashboardRepoConnectGate
            hasConnectedProvider={hasConnectedProvider}
            walkthroughCompleted={walkthroughCompleted}
          />
        </Suspense>
        <Suspense fallback={null}>
          <DashboardSearchProvider>
            <DashboardMobileNavProvider>
              <div className="flex min-h-0 flex-1">
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
                      plan={resolveEffectivePlanTier(profileRow)}
                      avatarUrl={avatarSignedUrl}
                    />
                  </Suspense>

                  <div className="app-scrollbar dash-page relative flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
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
    </AccessStatusProvider>
  );
}
