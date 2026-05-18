"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconArrowRight,
  IconDownload,
  IconFileText,
  IconSparkles,
} from "@tabler/icons-react";
import type { TrackedRepoKind } from "@/lib/dashboard/tracked-repo-kind";
import { gitlabProjectMembersUrl } from "@/lib/dashboard/tracked-repo-kind";
import { parseTrackedRepoFullName } from "@/lib/dashboard/parse-tracked-repo";
import type { ReportScheduleInitial } from "./organization-report-types";
import { ReportEmailScheduleForm } from "./report-email-schedule-form";

export type OrganizationReportsRow = {
  full_name: string;
  repo_owner: string;
  repo_name: string;
  hasSummary: boolean;
  kind: TrackedRepoKind;
};

function handoffBriefUrl(repoOwner: string, repoName: string): string {
  return `/api/repo/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/handoff-brief`;
}

function hostBadge(kind: TrackedRepoKind): { label: string; className: string } {
  switch (kind) {
    case "gitlab":
      return {
        label: "GitLab",
        className:
          "border-orange-400/35 bg-orange-500/12 text-orange-100",
      };
    case "upload":
      return {
        label: "Upload",
        className:
          "border-violet-400/35 bg-violet-500/12 text-violet-100",
      };
    default:
      return {
        label: "GitHub",
        className:
          "border-slate-400/30 bg-slate-500/12 text-slate-100",
      };
  }
}

export function OrganizationReportsHub(props: {
  trackedCount: number;
  summarizedCount: number;
  coveragePct: number;
  rows: OrganizationReportsRow[];
  repoDetailHref: (fullName: string) => string;
  defaultEmail: string;
  reportScheduleInitial: ReportScheduleInitial;
}) {
  const {
    trackedCount,
    summarizedCount,
    coveragePct,
    rows,
    repoDetailHref,
    defaultEmail,
    reportScheduleInitial,
  } = props;

  const missing = Math.max(0, trackedCount - summarizedCount);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoadingKey, setPdfLoadingKey] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<"csv" | "zip" | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  async function downloadBlob(
    url: string,
    filename: string,
    mode: "csv" | "zip",
  ) {
    setBulkError(null);
    setBulkLoading(mode);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBulkError(
          (data as { error?: string }).error ?? "Download failed.",
        );
        return;
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      setBulkError(
        e instanceof Error ? e.message : "Download failed.",
      );
    } finally {
      setBulkLoading(null);
    }
  }

  async function downloadHandoff(row: OrganizationReportsRow) {
    if (!row.hasSummary) return;
    setPdfError(null);
    setPdfLoadingKey(row.full_name);
    try {
      const res = await fetch(
        handoffBriefUrl(row.repo_owner, row.repo_name),
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPdfError(
          (data as { error?: string }).error ??
            "Could not generate handoff brief.",
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = `${row.repo_owner}-${row.repo_name}`.replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      );
      a.download = `handoff-brief-${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPdfError(
        e instanceof Error ? e.message : "Failed to download handoff brief.",
      );
    } finally {
      setPdfLoadingKey(null);
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section
        id="reports"
        className="scroll-mt-[calc(64px+0.75rem)] sm:scroll-mt-[calc(56px+0.75rem)] w-full min-w-0"
      >
        <div className="dash-panel w-full min-w-0 overflow-hidden p-0 sm:p-0">
          <div className="border-b border-cyan-200/15 bg-[#061018]/80 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/15 text-cyan-100 sm:h-12 sm:w-12">
                <IconFileText className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Reports
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-cyan-100/65">
                  Executive summaries and handoff PDFs for investor or
                  engineering handovers, plus exports for audit and compliance
                  packs. GitLab and uploaded projects use different workflows —
                  see the Host column for each row.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-cyan-200/12 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <div className="rounded-xl border border-cyan-200/15 bg-[#050b16]/85 p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-200/75">
                <IconSparkles className="h-4 w-4" aria-hidden />
                Summary coverage
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {coveragePct}
                <span className="text-base font-normal text-cyan-100/55">%</span>
              </p>
              <p className="mt-1 text-xs text-cyan-100/55">
                {summarizedCount} of {trackedCount} repos with an AI overview
              </p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-[#050b16]/85 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/75">
                Ready to export
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {summarizedCount}
              </p>
              <p className="mt-1 text-xs text-cyan-100/55">
                Repos with a stored summary (PDF where supported)
              </p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-[#050b16]/85 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/75">
                Need overview
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {missing}
              </p>
              <p className="mt-1 text-xs text-cyan-100/55">
                Open repo overview to generate first
              </p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-[#050b16]/85 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/75">
                In organization
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                {trackedCount}
              </p>
              <p className="mt-1 text-xs text-cyan-100/55">Tracked repositories</p>
            </div>
          </div>

          <div className="border-b border-cyan-200/12 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-cyan-50">
              Organization exports
            </h3>
            <p className="mt-1 text-xs text-cyan-100/60">
              Activity CSV is your full audit trail for this account. Compliance
              pack adds tracked repos and summary metadata (no full narrative
              text) in one ZIP.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={bulkLoading !== null}
                onClick={() =>
                  downloadBlob(
                    "/api/dashboard/reports/activity-csv",
                    `ownbase-activity-audit-${stamp}.csv`,
                    "csv",
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-[#050b16]/85 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/35 hover:bg-[#0f1a2e] disabled:opacity-50"
              >
                <IconDownload className="h-4 w-4" aria-hidden />
                {bulkLoading === "csv" ? "Preparing…" : "Activity / audit (CSV)"}
              </button>
              <button
                type="button"
                disabled={bulkLoading !== null}
                onClick={() =>
                  downloadBlob(
                    "/api/dashboard/reports/compliance-pack",
                    `ownbase-compliance-pack-${stamp}.zip`,
                    "zip",
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-[#050b16]/85 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/35 hover:bg-[#0f1a2e] disabled:opacity-50"
              >
                <IconDownload className="h-4 w-4" aria-hidden />
                {bulkLoading === "zip" ? "Building…" : "Compliance pack (ZIP)"}
              </button>
            </div>
            {bulkError ? (
              <p className="mt-2 text-sm text-red-400/90">{bulkError}</p>
            ) : null}
          </div>

          {pdfError ? (
            <div
              className="mx-4 mt-4 rounded-lg border px-4 py-3 text-sm sm:mx-5"
              style={{
                borderColor: "var(--error-border)",
                backgroundColor: "var(--error-bg)",
                color: "var(--error-text)",
              }}
            >
              {pdfError}
            </div>
          ) : null}

          <div className="overflow-x-auto p-4 sm:p-5">
            {rows.length === 0 ? (
              <p className="text-sm text-cyan-100/60">
                No tracked repositories yet. Add repos from the dashboard, then
                return here to manage summaries and exports.
              </p>
            ) : (
              <table className="w-full min-w-lg text-left text-sm">
                <thead className="border-b border-cyan-200/15 bg-black/40 text-[11px] font-semibold uppercase tracking-wider text-cyan-100/65">
                  <tr>
                    <th className="px-3 py-3 sm:px-4">Repository</th>
                    <th className="px-3 py-3">Host</th>
                    <th className="px-3 py-3">Overview</th>
                    <th className="px-3 py-3 text-right sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const badge = hostBadge(row.kind);
                    const parsed = parseTrackedRepoFullName(row.full_name);
                    const gitlabPath =
                      parsed?.provider === "gitlab"
                        ? parsed.pathWithNamespace
                        : null;
                    const handoffAllowed = row.hasSummary;

                    return (
                      <tr
                        key={row.full_name}
                        className="border-b border-cyan-200/10 transition hover:bg-cyan-500/5"
                      >
                        <td className="px-3 py-3.5 align-top font-medium text-cyan-50 sm:px-4">
                          <Link
                            href={repoDetailHref(row.full_name)}
                            className="underline-offset-2 hover:text-cyan-100 hover:underline"
                          >
                            {row.full_name}
                          </Link>
                        </td>
                        <td className="max-w-56 px-3 py-3.5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {row.kind === "gitlab" && gitlabPath ? (
                            <p className="mt-2 text-[11px] leading-snug text-cyan-100/60">
                              AI overview and PDF use your GitLab connection in
                              Ownbase.{" "}
                              <span className="text-cyan-100/45">
                                Member roster and role changes are managed in
                                GitLab — open{" "}
                              </span>
                              <a
                                href={gitlabProjectMembersUrl(gitlabPath)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-200 underline-offset-2 hover:underline"
                              >
                                Project members
                              </a>
                              <span className="text-cyan-100/45">
                                {" "}
                                (defaults to gitlab.com; self-managed hosts use
                                your instance).
                              </span>
                            </p>
                          ) : null}
                          {row.kind === "upload" ? (
                            <p className="mt-2 text-[11px] leading-snug text-cyan-100/60">
                              ZIP uploads are not GitHub repos — handoff PDFs
                              use the same overview slot when a summary exists,
                              but most teams keep evidence alongside the upload
                              record.{" "}
                              <Link
                                href="/dashboard/upload"
                                className="text-cyan-200 underline-offset-2 hover:underline"
                              >
                                Uploads
                              </Link>
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          {row.hasSummary ? (
                            <span className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-100">
                              Summary on file
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-100">
                              Not generated
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-right sm:px-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              href={`${repoDetailHref(row.full_name)}#summary`}
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-200/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-50 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                            >
                              {row.hasSummary
                                ? "Review / regenerate"
                                : "Generate"}
                              <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                            <button
                              type="button"
                              disabled={
                                !handoffAllowed || pdfLoadingKey === row.full_name
                              }
                              onClick={() => downloadHandoff(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200/20 bg-[#050b16]/85 px-3 py-1.5 text-xs font-medium text-cyan-50 transition hover:border-cyan-300/35 hover:bg-[#0f1a2e] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              <IconDownload className="h-3.5 w-3.5" aria-hidden />
                              {pdfLoadingKey === row.full_name
                                ? "PDF…"
                                : "Handoff PDF"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className="border-t border-cyan-200/12 px-4 py-3 text-center text-[11px] text-cyan-100/50 sm:px-5">
            PDFs reflect the latest stored overview where the host supports that
            export. After large refactors, regenerate the summary on the repo
            before exporting again.
          </p>
        </div>
      </section>

      <ReportEmailScheduleForm
        initial={reportScheduleInitial}
        defaultEmail={defaultEmail}
      />
    </div>
  );
}
