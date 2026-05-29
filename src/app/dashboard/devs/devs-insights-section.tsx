"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconFolder,
  IconGitBranch,
  IconUsers,
} from "@tabler/icons-react";
import type { ContributorCrosswalkEntry } from "@/lib/dashboard/devs-insights";
import type { PortfolioRiskSnapshot } from "@/lib/dashboard/org-risk-assessment";

function repoHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Labels produced in org-risk-assessment for collaborator events only */
const PEOPLE_ACTIVITY_LABELS = new Set([
  "Collaborator granted access",
  "Collaborator removed",
]);

/** Inset list rows — readable on light panels, unchanged in dark mode */
const insetListRowClass =
  "rounded-lg border border-border bg-muted/35 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/55 dark:bg-black/30 dark:hover:bg-black/40";

type Props = {
  snapshot: PortfolioRiskSnapshot;
  crosswalk: ContributorCrosswalkEntry[];
  repoDetailHref?: (fullName: string) => string;
  gitlabRepoNames: string[];
  hasGithubData: boolean;
  trackedTotal: number;
  /** GitHub repos where collaborator roster was loaded successfully this visit */
  githubRosterRepoCount: number;
};

export function DevsInsightsSection({
  snapshot,
  crosswalk,
  repoDetailHref: hrefFn = repoHref,
  gitlabRepoNames,
  hasGithubData,
  trackedTotal,
  githubRosterRepoCount,
}: Props) {
  const multiRepoDevs = crosswalk.filter((c) => c.repos.length >= 2);
  const spanningAdmins = crosswalk.filter((c) => c.fullAccessRepos.length >= 2);
  const uniqueCollaborators = crosswalk.length;

  const reposByRosterSize = [...snapshot.repos].sort((a, b) => {
    const ca = a.collaboratorCount ?? -1;
    const cb = b.collaboratorCount ?? -1;
    if (cb !== ca) return cb - ca;
    return a.fullName.localeCompare(b.fullName);
  });

  const peopleActivity = snapshot.auditHighlights.filter((e) =>
    PEOPLE_ACTIVITY_LABELS.has(e.label),
  );
  const membershipActivity = snapshot.auditHighlights.filter(
    (e) => !PEOPLE_ACTIVITY_LABELS.has(e.label),
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border dash-surface-inset p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <IconFolder className="h-4 w-4" aria-hidden />
            In organization
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {trackedTotal}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tracked repos</p>
        </div>
        <div className="rounded-xl border border-border dash-surface-inset p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <IconUsers className="h-4 w-4" aria-hidden />
            GitHub collaborators
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {hasGithubData ? uniqueCollaborators : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasGithubData
              ? `Unique people on rosters we loaded (${githubRosterRepoCount} repo${githubRosterRepoCount === 1 ? "" : "s"})`
              : "Sign in with GitHub to load rosters"}
          </p>
        </div>
        <div className="rounded-xl border border-border dash-surface-inset p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <IconGitBranch className="h-4 w-4" aria-hidden />
            Multi-repo presence
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {hasGithubData ? multiRepoDevs.length : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasGithubData
              ? "Collaborators listed on 2+ GitHub repos"
              : "Requires GitHub collaborator data"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {hasGithubData ? (
          <section className="dash-panel p-5 sm:p-6 lg:col-span-2">
            <h2 className="text-base font-semibold text-foreground">
              Who appears on the most repos?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sorted by number of GitHub repositories where each person is a
              collaborator — helpful for staffing, reviewers, and onboarding.
            </p>
            {crosswalk.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No collaborators returned for tracked repos yet.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {crosswalk.slice(0, 12).map((c) => (
                  <li
                    key={c.login}
                    className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3 dark:bg-black/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatar_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-foreground hover:underline"
                      >
                        {c.login}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        <span className="tabular-nums font-semibold text-muted-foreground">
                          {c.repos.length}
                        </span>{" "}
                        repo{c.repos.length === 1 ? "" : "s"}
                        {c.fullAccessRepos.length > 0 ? (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-muted-foreground">
                              Full access: {c.fullAccessRepos.length}
                            </span>
                          </>
                        ) : null}
                      </p>
                      <p
                        className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/70"
                        title={c.repos.join(", ")}
                      >
                        {c.repos.join(", ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {spanningAdmins.length > 0 ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100/85">
                <IconAlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
                  aria-hidden
                />
                <span>
                  <strong className="font-semibold text-amber-900 dark:text-amber-50">
                    {spanningAdmins.length}
                  </strong>{" "}
                  people have{" "}
                  <span className="whitespace-nowrap">full access</span> on more
                  than one repo — double-check that matches how you delegate
                  admin duties.
                </span>
              </p>
            ) : null}
          </section>
        ) : (
          <section className="dash-panel p-5 sm:p-6 lg:col-span-2">
            <h2 className="text-base font-semibold text-foreground">
              Collaboration map
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with GitHub to load per-repo collaborator rosters. Then
              you&apos;ll see who spans multiple repositories and where full
              access is concentrated.
            </p>
            <Link
              href="/dashboard/devs#team"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:text-foreground hover:underline"
            >
              Open Team access
              <IconArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        )}

        <section className="dash-panel p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            Repos by roster size
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            GitHub direct collaborators we could count — not org-wide GitHub
            membership. Larger rosters usually mean more review paths.
          </p>
          <ul className="mt-4 space-y-2">
            {reposByRosterSize.slice(0, 8).map((r) => (
              <li key={r.fullName}>
                <Link
                  href={`${hrefFn(r.fullName)}#access`}
                  className={`flex items-center justify-between gap-3 text-sm ${insetListRowClass}`}
                >
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {r.fullName}
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-muted-foreground">
                    {r.collaboratorCount != null
                      ? `${r.collaboratorCount} listed`
                      : r.collaboratorError
                        ? "—"
                        : "Not loaded"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Sort is by collaborator count only — see{" "}
            <Link
              href="/dashboard/organization#risk"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Risk assessment
            </Link>{" "}
            for exposure ranking.
          </p>
        </section>

        <section className="dash-panel p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            Access & membership changes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent collaborator grants and removals across your org.
          </p>
          {peopleActivity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No collaborator add/remove events recorded recently.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {peopleActivity.slice(0, 10).map((e) => (
                <li key={e.id} className={insetListRowClass}>
                  <p className="text-sm font-medium text-foreground">{e.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.repo}{" "}
                    <span className="text-muted-foreground/80">
                      · {formatShortDate(e.at)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}

          {membershipActivity.length > 0 ? (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                Repo membership (tracked / removed)
              </h3>
              <ul className="mt-2 space-y-2">
                {membershipActivity.slice(0, 6).map((e) => (
                  <li
                    key={e.id}
                    className="text-xs text-muted-foreground"
                  >
                    <span className="text-muted-foreground">{e.label}</span> ·{" "}
                    {e.repo}{" "}
                    <span className="text-foreground/40">
                      · {formatShortDate(e.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      {gitlabRepoNames.length > 0 ? (
        <section className="dash-panel p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            GitLab — manage people there
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ownbase doesn&apos;t sync GitLab member lists. Add or remove people
            under each project&apos;s Members screen on GitLab.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {gitlabRepoNames.map((name) => (
              <li key={name}>
                <Link
                  href={hrefFn(name)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/45"
                >
                  {name}
                  <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
