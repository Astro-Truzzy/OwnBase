"use client";

import Link from "next/link";
import { IconFolder, IconUsersGroup } from "@tabler/icons-react";
import type {
  DeveloperOrgOverviewEntry,
  DevRepoAttachment,
} from "@/lib/dashboard/devs-insights";
import type { AccessLevelLabel } from "@/lib/github/types";

function accessChipClass(access: AccessLevelLabel): string {
  switch (access) {
    case "Full access":
      return "border-amber-400/45 bg-amber-500/15 text-amber-100";
    case "Can edit":
      return "border-cyan-300/35 bg-cyan-400/12 text-cyan-100";
    default:
      return "border-cyan-200/15 bg-black/35 text-cyan-100/75";
  }
}

function RepoAttachmentChip({
  attachment,
  repoHref,
}: {
  attachment: DevRepoAttachment;
  repoHref: (fullName: string) => string;
}) {
  return (
    <Link
      href={`${repoHref(attachment.fullName)}#access`}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:brightness-110 ${accessChipClass(attachment.access)}`}
      title={`${attachment.fullName} — ${attachment.access}`}
    >
      <IconFolder className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{attachment.fullName}</span>
      <span className="shrink-0 rounded bg-black/25 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">
        {attachment.access === "Full access"
          ? "Full"
          : attachment.access === "Can edit"
            ? "Edit"
            : "View"}
      </span>
    </Link>
  );
}

type Props = {
  overview: DeveloperOrgOverviewEntry[];
  hasGithubData: boolean;
  githubRepoCount: number;
  repoDetailHref: (fullName: string) => string;
};

export function DevsTeamOverview({
  overview,
  hasGithubData,
  githubRepoCount,
  repoDetailHref,
}: Props) {
  const multiRepoCount = overview.filter((d) => d.repos.length >= 2).length;
  const fullAccessSpanCount = overview.filter((d) =>
    d.repos.some((r) => r.access === "Full access"),
  ).length;

  return (
    <section className="dash-panel p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-200">
          <IconUsersGroup className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-cyan-50">
            Organization roster
          </h2>
          <p className="mt-1 text-sm text-cyan-100/65">
            All developers across your tracked GitHub repos and the access they
            have on each — use this as a quick headcount before drilling into
            per-repo actions below.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Developers"
          value={hasGithubData ? String(overview.length) : "—"}
          hint={
            hasGithubData
              ? `Unique collaborators across ${githubRepoCount} GitHub repo${githubRepoCount === 1 ? "" : "s"}`
              : "Sign in with GitHub to load rosters"
          }
        />
        <StatCard
          label="On multiple repos"
          value={hasGithubData ? String(multiRepoCount) : "—"}
          hint="People listed on 2 or more tracked repos"
        />
        <StatCard
          label="With full access"
          value={hasGithubData ? String(fullAccessSpanCount) : "—"}
          hint="At least one repo where they have admin-level access"
        />
      </div>

      {!hasGithubData ? (
        <p className="mt-6 text-sm text-cyan-100/65">
          Sign in with GitHub to see an organization-wide map of developers and
          which repositories they are attached to.
        </p>
      ) : overview.length === 0 ? (
        <p className="mt-6 text-sm text-cyan-100/65">
          No collaborators returned for your tracked GitHub repos yet. Open a
          repo below to grant access.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {overview.map((dev) => (
            <li
              key={dev.login}
              className="rounded-xl border border-cyan-200/12 bg-[#050b16]/70 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={dev.avatar_url}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full border border-cyan-200/20 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <a
                      href={dev.html_url}
                      target="_blank"
                      rel="noreferrer"
                      title={dev.login}
                      className="block truncate font-semibold text-cyan-50 hover:underline"
                    >
                      {dev.login}
                    </a>
                    <p className="mt-0.5 text-xs text-cyan-100/55">
                      <span className="tabular-nums font-medium text-cyan-100/80">
                        {dev.repos.length}
                      </span>{" "}
                      repo{dev.repos.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 w-full border-t border-cyan-200/10 pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/45">
                    Repositories & access
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dev.repos.map((attachment) => (
                      <RepoAttachmentChip
                        key={`${dev.login}-${attachment.fullName}`}
                        attachment={attachment}
                        repoHref={repoDetailHref}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasGithubData && overview.length > 0 ? (
        <p className="mt-5 text-[11px] text-cyan-100/45">
          Highlighted chips show each repo this person is on. Amber = full
          access, cyan = can edit, muted = view only. Per-repo rosters and
          revoke actions are below.
        </p>
      ) : null}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-cyan-200/15 bg-[#050b16]/85 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/75">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-cyan-100/55">{hint}</p>
    </div>
  );
}
