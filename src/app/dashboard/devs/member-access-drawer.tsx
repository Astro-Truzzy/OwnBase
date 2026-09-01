"use client";

import { useEffect, useId, useRef } from "react";
import {
  IconX,
  IconExternalLink,
  IconUser,
  IconTrash,
  IconBrandGitlab,
} from "@tabler/icons-react";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";
import { MatrixCell } from "@/components/dashboard/matrix-cell";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  ORG_ROLE_META,
  ORG_ROLE_OPTIONS,
  type AccessLevel,
  type OrgRole,
} from "@/lib/access/levels";
import type {
  MatrixCellModel,
  MatrixPerson,
  MatrixRepo,
} from "@/lib/access/access-matrix";

type MemberAccessDrawerProps = {
  person: MatrixPerson;
  repos: MatrixRepo[];
  cellFor: (login: string, fullName: string) => MatrixCellModel | undefined;
  locked: boolean;
  busyKey: string | null;
  savingRole: boolean;
  cellKeyFor: (login: string, fullName: string) => string;
  onCellChange: (repo: MatrixRepo, login: string, level: AccessLevel) => void;
  onRoleChange: (role: OrgRole) => void;
  onRemoveAll: () => void;
  onClose: () => void;
};

/**
 * Right slide-over showing one developer's profile, org role, and per-repo
 * access. Presentational: every mutation is delegated to the parent matrix so
 * confirmation dialogs and refresh stay in one place.
 */
export function MemberAccessDrawer({
  person,
  repos,
  cellFor,
  locked,
  busyKey,
  savingRole,
  cellKeyFor,
  onCellChange,
  onRoleChange,
  onRemoveAll,
  onClose,
}: MemberAccessDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const accessRepos = repos.filter((r) => {
    const c = cellFor(person.login, r.fullName);
    return c && (c.level !== "none" || c.pending);
  });
  const githubAccessCount = accessRepos.filter(
    (r) => r.provider === "github",
  ).length;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="app-scrollbar flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex min-w-0 items-start gap-3">
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.avatarUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                <IconUser className="h-6 w-6" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h2
                id={titleId}
                className="truncate text-lg font-semibold text-foreground"
              >
                {person.displayName}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">@{person.login}</span>
                {person.provider === "gitlab" ? (
                  <StatusPill tone="neutral" icon={IconBrandGitlab}>
                    GitLab
                  </StatusPill>
                ) : null}
                {person.status === "invited" ? (
                  <StatusPill tone="warning">Invited</StatusPill>
                ) : null}
              </div>
              {person.htmlUrl ? (
                <a
                  href={person.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <IconExternalLink className="h-3.5 w-3.5" aria-hidden />
                  View profile
                </a>
              ) : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div>
            <DashboardSelect
              label="Team role"
              value={person.orgRole ?? "developer"}
              onChange={(v) => onRoleChange(v as OrgRole)}
              options={ORG_ROLE_OPTIONS}
              disabled={locked || savingRole}
              triggerClassName="dash-input shadow-none"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {savingRole
                ? "Saving role…"
                : ORG_ROLE_META[person.orgRole ?? "developer"].description}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
              Repository access
            </h3>
            {accessRepos.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                No repository access yet. Use the matrix or “Grant access” to add
                this developer to a repo.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {accessRepos.map((repo) => {
                  const cell = cellFor(person.login, repo.fullName);
                  const key = cellKeyFor(person.login, repo.fullName);
                  return (
                    <li
                      key={repo.fullName}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {repo.provider === "gitlab" ? (
                          <IconBrandGitlab
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        ) : null}
                        <span
                          className="min-w-0 truncate text-sm font-medium text-foreground"
                          title={repo.fullName}
                        >
                          {repo.fullName}
                        </span>
                      </div>
                      <MatrixCell
                        login={person.login}
                        repoFullName={repo.fullName}
                        level={cell?.level ?? "none"}
                        source={cell?.source}
                        drift={cell?.drift}
                        pending={cell?.pending}
                        expiresAt={cell?.expiresAt}
                        expiryState={cell?.expiryState ?? undefined}
                        readOnly={repo.provider !== "github" || locked}
                        disabled={busyKey === key}
                        busy={busyKey === key}
                        onChange={(level) => onCellChange(repo, person.login, level)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {githubAccessCount > 0 && !locked ? (
            <div className="border-t border-border pt-5">
              <button
                type="button"
                onClick={onRemoveAll}
                className="inline-flex items-center gap-2 rounded-lg border border-danger-border bg-danger-subtle px-3.5 py-2 text-sm font-semibold text-danger transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <IconTrash className="h-4 w-4" aria-hidden />
                Remove from all repositories
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Revokes access on every GitHub repo. This cannot remove the last
                admin of a repo.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
