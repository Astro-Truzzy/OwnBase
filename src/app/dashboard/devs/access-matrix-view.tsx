"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUserPlus,
  IconSearch,
  IconBrandGitlab,
  IconAlertTriangle,
  IconUser,
  IconUsersGroup,
} from "@tabler/icons-react";
import { MatrixCell } from "@/components/dashboard/matrix-cell";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FeatureLockedNotice } from "@/components/dashboard/feature-lock";
import { ORG_ROLE_META, type AccessLevel, type OrgRole } from "@/lib/access/levels";
import {
  cellKey,
  type AccessMatrix,
  type MatrixCellModel,
  type MatrixRepo,
} from "@/lib/access/access-matrix";
import {
  setAccessLevelAction,
  setMemberRoleAction,
  upsertMemberAction,
  type ManageAccessResult,
} from "../repo/actions";
import { AccessGrantForm, type GrantResult } from "./access-grant-form";
import { MemberAccessDrawer } from "./member-access-drawer";
import { cn } from "@/lib/utils";

type StatusMessage = { type: "success" | "error"; text: string };

type PendingConfirm =
  | { kind: "cell"; repo: MatrixRepo; login: string }
  | { kind: "bulk"; logins: string[] };

const ROLE_PILL_TONE: Record<OrgRole, "info" | "neutral"> = {
  admin: "info",
  developer: "neutral",
  viewer: "neutral",
};

export function AccessMatrixView({
  matrix,
  locked,
}: {
  matrix: AccessMatrix;
  locked: boolean;
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [showGrant, setShowGrant] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [openLogin, setOpenLogin] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const cellIndex = useMemo(() => {
    const m = new Map<string, MatrixCellModel>();
    for (const c of matrix.cells) m.set(cellKey(c.login, c.fullName), c);
    return m;
  }, [matrix.cells]);

  const cellFor = (login: string, fullName: string) =>
    cellIndex.get(cellKey(login, fullName));

  const githubRepos = useMemo(
    () => matrix.repos.filter((r) => r.provider === "github"),
    [matrix.repos],
  );

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return matrix.people;
    return matrix.people.filter(
      (p) =>
        p.login.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q),
    );
  }, [matrix.people, query]);

  const openPerson = openLogin
    ? (matrix.people.find(
        (p) => p.login.toLowerCase() === openLogin.toLowerCase(),
      ) ?? null)
    : null;

  // --- mutations -----------------------------------------------------------

  async function changeCell(
    repo: MatrixRepo,
    login: string,
    level: AccessLevel,
  ) {
    if (repo.provider !== "github") return;
    setMessage(null);
    const key = cellKey(login, repo.fullName);
    setBusyKey(key);
    const res: ManageAccessResult = await setAccessLevelAction(
      repo.owner,
      repo.name,
      login,
      level,
    );
    setBusyKey(null);
    if (res.success) {
      setMessage({
        type: "success",
        text: `Updated ${login}’s access on ${repo.name}.`,
      });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: res.error ?? "Could not update access.",
      });
    }
  }

  function onCellChange(repo: MatrixRepo, login: string, level: AccessLevel) {
    if (level === "none") {
      setConfirmError(null);
      setConfirm({ kind: "cell", repo, login });
    } else {
      void changeCell(repo, login, level);
    }
  }

  async function changeRole(role: OrgRole) {
    if (!openPerson) return;
    setSavingRole(true);
    setMessage(null);
    const res: ManageAccessResult = openPerson.memberId
      ? await setMemberRoleAction(openPerson.memberId, role)
      : await upsertMemberAction({
          login: openPerson.login,
          displayName: openPerson.displayName,
          avatarUrl: openPerson.avatarUrl,
          htmlUrl: openPerson.htmlUrl,
          orgRole: role,
          status: "active",
        });
    setSavingRole(false);
    if (res.success) {
      setMessage({
        type: "success",
        text: `Set ${openPerson.login}’s role to ${ORG_ROLE_META[role].label}.`,
      });
      router.refresh();
    } else {
      setMessage({ type: "error", text: res.error ?? "Could not update role." });
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    setConfirmBusy(true);
    setConfirmError(null);

    if (confirm.kind === "cell") {
      const res = await setAccessLevelAction(
        confirm.repo.owner,
        confirm.repo.name,
        confirm.login,
        "none",
      );
      setConfirmBusy(false);
      if (res.success) {
        setConfirm(null);
        setMessage({
          type: "success",
          text: `Removed ${confirm.login} from ${confirm.repo.name}.`,
        });
        router.refresh();
      } else {
        setConfirmError(res.error ?? "Could not remove access.");
      }
      return;
    }

    // Bulk revoke: every github repo where each selected person has access.
    let ok = 0;
    let fail = 0;
    let firstError: string | undefined;
    for (const login of confirm.logins) {
      for (const repo of githubRepos) {
        const c = cellFor(login, repo.fullName);
        if (!c || c.level === "none") continue;
        const res = await setAccessLevelAction(
          repo.owner,
          repo.name,
          login,
          "none",
        );
        if (res.success) ok += 1;
        else {
          fail += 1;
          firstError = firstError ?? res.error;
        }
      }
    }
    setConfirmBusy(false);
    setConfirm(null);
    setSelected(new Set());
    if (fail === 0) {
      setMessage({
        type: "success",
        text: `Revoked ${ok} access grant${ok === 1 ? "" : "s"}.`,
      });
    } else {
      setMessage({
        type: ok > 0 ? "success" : "error",
        text: `Revoked ${ok}; ${fail} could not be revoked${firstError ? ` (${firstError})` : ""}.`,
      });
    }
    router.refresh();
  }

  function onGrantDone(result: GrantResult) {
    setShowGrant(false);
    setMessage(result);
    if (result.type === "success") router.refresh();
  }

  // --- selection -----------------------------------------------------------

  const visibleLogins = people.map((p) => p.login);
  const allVisibleSelected =
    visibleLogins.length > 0 && visibleLogins.every((l) => selected.has(l));

  function toggleSelect(login: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(login)) next.delete(login);
      else next.add(login);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleLogins));
  }

  const hasRepos = matrix.repos.length > 0;

  // --- render --------------------------------------------------------------

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter developers…"
            aria-label="Filter developers by name or username"
            className="dash-input w-full rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>
        {!locked ? (
          <button
            type="button"
            onClick={() => {
              setShowGrant((v) => !v);
              setMessage(null);
            }}
            aria-expanded={showGrant}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <IconUserPlus className="h-4 w-4" aria-hidden />
            Grant access
          </button>
        ) : null}
      </div>

      {locked ? <FeatureLockedNotice feature="Access management" /> : null}

      {showGrant && !locked ? (
        <AccessGrantForm
          githubRepos={githubRepos}
          onClose={() => setShowGrant(false)}
          onDone={onGrantDone}
        />
      ) : null}

      {message ? (
        <p
          role="alert"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            message.type === "success"
              ? "border-success-border bg-success-subtle text-success"
              : "border-danger-border bg-danger-subtle text-danger",
          )}
        >
          {message.text}
        </p>
      ) : null}

      {selected.size > 0 && !locked ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-foreground">
            {selected.size} developer{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmError(null);
                setConfirm({ kind: "bulk", logins: [...selected] });
              }}
              className="rounded-lg border border-danger-border bg-danger-subtle px-3 py-1.5 text-sm font-semibold text-danger transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
            >
              Revoke all access
            </button>
          </div>
        </div>
      ) : null}

      {!hasRepos ? (
        <div className="dash-panel p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No repositories in your organization yet. Add repos to see and manage
            developer access here.
          </p>
        </div>
      ) : matrix.people.length === 0 ? (
        <div className="dash-panel flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <IconUsersGroup className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              No developers with access yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {locked
                ? "Subscribe to grant repository access."
                : "Grant access to add developers to your repositories."}
            </p>
          </div>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden p-0">
          <div className="app-scrollbar overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Developers and their access level per repository. Change a level
                to update access on GitHub.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th
                    scope="col"
                    className="sticky left-0 z-20 min-w-56 bg-card px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {!locked ? (
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all developers"
                          className="h-4 w-4 rounded border-border"
                        />
                      ) : null}
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Developer
                      </span>
                    </div>
                  </th>
                  {matrix.repos.map((repo) => (
                    <th
                      key={repo.fullName}
                      scope="col"
                      className="min-w-40 border-l border-border px-3 py-3 text-left align-bottom"
                    >
                      <span
                        className="block max-w-52 truncate font-medium text-foreground"
                        title={repo.fullName}
                      >
                        {repo.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        {repo.provider === "gitlab" ? (
                          <StatusPill tone="neutral" icon={IconBrandGitlab}>
                            GitLab
                          </StatusPill>
                        ) : null}
                        {repo.unavailable && repo.provider === "github" ? (
                          <StatusPill tone="warning" icon={IconAlertTriangle}>
                            Unavailable
                          </StatusPill>
                        ) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((person) => {
                  const isSelected = selected.has(person.login);
                  return (
                    <tr
                      key={person.login}
                      className="border-b border-border last:border-0"
                    >
                      <th
                        scope="row"
                        className={cn(
                          "sticky left-0 z-10 min-w-56 bg-card px-4 py-3 text-left font-normal",
                          isSelected && "bg-primary/[0.06]",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {!locked ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(person.login)}
                              aria-label={`Select ${person.login}`}
                              className="h-4 w-4 shrink-0 rounded border-border"
                            />
                          ) : null}
                          {person.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={person.avatarUrl}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full border border-border object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                              <IconUser className="h-4 w-4" aria-hidden />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setOpenLogin(person.login)}
                            className="min-w-0 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <span className="block truncate font-medium text-foreground hover:text-primary">
                              {person.displayName}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="truncate">@{person.login}</span>
                              {person.orgRole ? (
                                <StatusPill tone={ROLE_PILL_TONE[person.orgRole]}>
                                  {ORG_ROLE_META[person.orgRole].label}
                                </StatusPill>
                              ) : null}
                            </span>
                          </button>
                        </div>
                      </th>
                      {matrix.repos.map((repo) => {
                        const key = cellKey(person.login, repo.fullName);
                        const cell = cellFor(person.login, repo.fullName);
                        return (
                          <td
                            key={repo.fullName}
                            className="border-l border-border px-3 py-3 align-top"
                          >
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
                              onChange={(level) =>
                                onCellChange(repo, person.login, level)
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {people.length === 0 ? (
            <p className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No developers match “{query}”.
            </p>
          ) : null}
        </div>
      )}

      {matrix.hasUnavailableRepos ? (
        <p className="text-xs text-muted-foreground">
          Some repositories couldn’t load live collaborators (token or
          permission). Their columns show the last-known Ownbase records only.
        </p>
      ) : null}

      {openPerson ? (
        <MemberAccessDrawer
          person={openPerson}
          repos={matrix.repos}
          cellFor={cellFor}
          cellKeyFor={cellKey}
          locked={locked}
          busyKey={busyKey}
          savingRole={savingRole}
          onCellChange={onCellChange}
          onRoleChange={changeRole}
          onRemoveAll={() => {
            setConfirmError(null);
            setConfirm({ kind: "bulk", logins: [openPerson.login] });
          }}
          onClose={() => setOpenLogin(null)}
        />
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        tone="danger"
        title={
          confirm?.kind === "bulk"
            ? "Revoke all repository access?"
            : "Remove access?"
        }
        description={
          confirm?.kind === "bulk"
            ? `This removes ${confirm.logins.length === 1 ? confirm.logins[0] : `${confirm.logins.length} developers`} from every GitHub repo they can access. The last admin of a repo is never removed.`
            : confirm
              ? `Remove ${confirm.login} from ${confirm.repo.name}? They will lose access on GitHub.`
              : undefined
        }
        confirmLabel={confirm?.kind === "bulk" ? "Revoke all" : "Remove"}
        busyLabel="Revoking…"
        busy={confirmBusy}
        error={confirmError}
        acknowledgeLabel={
          confirm?.kind === "bulk"
            ? "I understand this revokes access on every repo for the selected developers."
            : undefined
        }
        confirmPhrase={confirm?.kind === "bulk" ? "REVOKE" : undefined}
        onCancel={() => {
          if (!confirmBusy) {
            setConfirm(null);
            setConfirmError(null);
          }
        }}
        onConfirm={runConfirm}
      />
    </section>
  );
}
