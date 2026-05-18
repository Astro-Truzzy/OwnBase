"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import {
  IconBuilding,
  IconFolder,
  IconPlus,
  IconUpload,
  IconArrowRight,
} from "@tabler/icons-react";
import { getTrackedRepoKind } from "@/lib/dashboard/tracked-repo-kind";
import type { PortfolioRiskSnapshot } from "@/lib/dashboard/org-risk-assessment";
import type { ReportScheduleInitial } from "./organization-report-types";
import { OrganizationReportsHub } from "./organization-reports-hub";
import {
  ReportsQuickSection,
  RiskAssessmentSection,
} from "./risk-assessment-section";

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
  businessName: string | null;
  viewerEmail: string | null;
  reportScheduleInitial: ReportScheduleInitial;
}) {
  const {
    snapshot,
    custodyFetchNote,
    tracked,
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-200/10 pb-4">
          <Link
            href="/dashboard"
            className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/dashboard/organization"
            className="text-sm font-medium text-cyan-200/90 underline-offset-4 transition hover:text-cyan-50 hover:underline"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-200/10 pb-4">
          <Link
            href="/dashboard"
            className="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
          >
            ← Back to dashboard
          </Link>
          <Link
            href="/dashboard/organization"
            className="text-sm font-medium text-cyan-200/90 underline-offset-4 transition hover:text-cyan-50 hover:underline"
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
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
            <IconBuilding className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Your organization
            </h1>
            {businessName && (
              <p className="mt-1 text-lg text-cyan-100">{businessName}</p>
            )}
            <p className="mt-2 max-w-2xl text-sm text-cyan-100/65">
              Your organization is where you keep repositories and projects
              under your control. Create it by adding repos from GitHub or
              GitLab, or by uploading a project.
            </p>
          </div>
        </div>
      </div>

      <ReportsQuickSection
        trackedCount={snapshot.trackedCount}
        summarizedCount={snapshot.summarizedCount}
      />

      <RiskAssessmentSection
        snapshot={snapshot}
        repoDetailHref={repoDetailHref}
        custodyFetchNote={custodyFetchNote}
      />

      <section className="dash-panel p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-50">
          <IconPlus className="h-5 w-5 text-cyan-300" aria-hidden />
          Create or set up your organization
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-cyan-100/65">
          You don’t need a separate account — your organization is built from
          the repos and projects you add. Choose one of the options below to add
          your first (or next) repo.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="group flex items-center gap-4 rounded-xl border border-cyan-200/15 bg-[#050b16]/70 p-5 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-cyan-200">
              <IconFolder className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-medium text-cyan-50">
                Add repos from GitHub or GitLab
              </span>
              <span className="mt-0.5 block text-sm text-cyan-100/60">
                Go to the dashboard, open a repo, then click &quot;Add to my
                organization&quot;.
              </span>
            </div>
            <IconArrowRight
              className="h-5 w-5 shrink-0 text-cyan-100/50 transition-colors group-hover:text-cyan-300"
              aria-hidden
            />
          </Link>
          <Link
            href="/dashboard/upload"
            className="group flex items-center gap-4 rounded-xl border border-cyan-200/15 bg-[#050b16]/70 p-5 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-cyan-200">
              <IconUpload className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-medium text-cyan-50">
                Upload a project
              </span>
              <span className="mt-0.5 block text-sm text-cyan-100/60">
                Upload a zip of your project. It’s stored in your environment
                and appears in your organization.
              </span>
            </div>
            <IconArrowRight
              className="h-5 w-5 shrink-0 text-cyan-100/50 transition-colors group-hover:text-cyan-300"
              aria-hidden
            />
          </Link>
        </div>
      </section>

      <section className="dash-panel p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-cyan-50">
          Repos in your organization
        </h2>
        <p className="mt-1 text-sm text-cyan-100/65">
          Repositories and projects you’ve added. Click one to manage access,
          view activity, or export the audit log.
        </p>
        {tracked.length === 0 ? (
          <p className="mt-6 text-sm text-cyan-100/60">
            No repos yet. Use the options above to add repos from the dashboard
            or upload a project.
          </p>
        ) : (
          <ul className="mt-6 space-y-2" role="list">
            {tracked.map((row) => (
              <li key={row.full_name}>
                <Link
                  href={repoDetailHref(row.full_name)}
                  className="inline-flex w-full items-center gap-2 rounded-lg border border-cyan-200/15 bg-[#050b16]/70 px-4 py-3 text-sm text-cyan-50 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914] sm:w-auto"
                >
                  <IconFolder
                    className="h-4 w-4 shrink-0 text-cyan-300/80"
                    aria-hidden
                  />
                  <span className="font-medium">{row.full_name}</span>
                  <IconArrowRight
                    className="ml-auto h-4 w-4 shrink-0 text-cyan-100/50"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
