"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import {
  IconBuilding,
  IconUpload,
} from "@tabler/icons-react";
import { getTrackedRepoKind } from "@/lib/dashboard/tracked-repo-kind";
import type { SearchableRepo } from "@/lib/dashboard/searchable-repos";
import type { PortfolioRiskSnapshot } from "@/lib/dashboard/org-risk-assessment";
import type { ReportScheduleInitial } from "./organization-report-types";
import { OrganizationReportsHub } from "./organization-reports-hub";
import {
  ReportsQuickSection,
  RiskAssessmentSection,
} from "./risk-assessment-section";
import {
  DashboardOrganizationPanel,
  type OrganizationTrackedRepo,
} from "../dashboard-organization-panel";

export type TrackedRepoRow = {
  full_name: string;
  repo_owner: string;
  repo_name: string;
  added_at: string;
};

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

type OrgHashView = "full" | "risk" | "reports";

function readOrgHashView(): OrgHashView {
  if (typeof window === "undefined") return "full";
  const path = window.location.pathname.replace(/\/$/, "");
  if (path !== "/dashboard/organization") return "full";
  const h = window.location.hash.replace(/^#/, "");
  if (h === "risk") return "risk";
  if (h === "reports") return "reports";
  return "full";
}

export function OrganizationPageClient(props: {
  snapshot: PortfolioRiskSnapshot;
  custodyFetchNote: string | null;
  tracked: TrackedRepoRow[];
  discoverableRepos: SearchableRepo[];
  organizationTracked: OrganizationTrackedRepo[];
  trackedLimit: number;
  hasGitProvider: boolean;
  businessName: string | null;
  viewerEmail: string | null;
  reportScheduleInitial: ReportScheduleInitial;
}) {
  const {
    snapshot,
    custodyFetchNote,
    tracked,
    discoverableRepos,
    organizationTracked,
    trackedLimit,
    hasGitProvider,
    businessName,
    viewerEmail,
    reportScheduleInitial,
  } = props;

  /** Hydration-safe: default full; sync hash before paint where possible. */
  const [orgView, setOrgView] = useState<OrgHashView>("full");

  useLayoutEffect(() => {
    const sync = () => setOrgView(readOrgHashView());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const repoProfileByName = new Map(
    snapshot.repos.map((r) => [r.fullName, r]),
  );
  const reportRows = tracked.map((t) => ({
    full_name: t.full_name,
    repo_owner: t.repo_owner,
    repo_name: t.repo_name,
    hasSummary: repoProfileByName.get(t.full_name)?.hasSummary ?? false,
    kind: getTrackedRepoKind(t),
  }));

  if (orgView === "risk") {
    return (
      <div className="w-full min-w-0 space-y-4 pb-5 sm:space-y-5 sm:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link
            href="/dashboard"
            className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/dashboard/organization"
            className="text-sm font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline"
          >
            Organization overview
          </Link>
        </div>
        <RiskAssessmentSection
          snapshot={snapshot}
          repoDetailHref={repoDetailHref}
          custodyFetchNote={custodyFetchNote}
          density="compact"
        />
      </div>
    );
  }

  if (orgView === "reports") {
    return (
      <div className="w-full min-w-0 space-y-4 pb-5 sm:space-y-5 sm:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link
            href="/dashboard"
            className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/dashboard/organization"
            className="text-sm font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline"
          >
            Organization overview
          </Link>
        </div>
        <OrganizationReportsHub
          trackedCount={snapshot.trackedCount}
          summarizedCount={snapshot.summarizedCount}
          coveragePct={snapshot.coveragePct}
          rows={reportRows}
          repoDetailHref={repoDetailHref}
          defaultEmail={viewerEmail ?? ""}
          reportScheduleInitial={reportScheduleInitial}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      <div>
        <Link
          href="/dashboard"
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <IconBuilding className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your organization
            </h1>
            {businessName && (
              <p className="mt-1 text-lg text-foreground/90">{businessName}</p>
            )}
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Add repositories, then review risk and reports in one place.
            </p>
          </div>
        </div>
      </div>

      <DashboardOrganizationPanel
        discoverableRepos={discoverableRepos}
        trackedRepos={organizationTracked}
        trackedCount={snapshot.trackedCount}
        trackedLimit={trackedLimit}
        businessName={businessName}
        hasGitProvider={hasGitProvider}
        embedded
      />

      <p className="text-sm text-muted-foreground">
        Code not on GitHub or GitLab?{" "}
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          <IconUpload className="h-4 w-4" aria-hidden />
          Upload a project zip
        </Link>
      </p>

      <ReportsQuickSection
        trackedCount={snapshot.trackedCount}
        summarizedCount={snapshot.summarizedCount}
      />

      <RiskAssessmentSection
        snapshot={snapshot}
        repoDetailHref={repoDetailHref}
        custodyFetchNote={custodyFetchNote}
      />
    </div>
  );
}
