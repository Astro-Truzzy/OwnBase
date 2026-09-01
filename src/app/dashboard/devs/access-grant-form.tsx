"use client";

import { useId, useState } from "react";
import { IconUserPlus, IconX } from "@tabler/icons-react";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";
import {
  ACCESS_LEVEL_META,
  ORG_ROLE_OPTIONS,
  levelToGithubPermission,
  type AccessLevel,
  type OrgRole,
} from "@/lib/access/levels";
import type { MatrixRepo } from "@/lib/access/access-matrix";
import {
  addCollaboratorAction,
  upsertMemberAction,
} from "../repo/actions";
import { cn } from "@/lib/utils";

/** Access levels a person can be granted (excludes "none" = remove). */
const GRANTABLE_LEVELS: AccessLevel[] = ["read", "write", "admin"];

export type GrantResult = { type: "success" | "error"; text: string };

type AccessGrantFormProps = {
  /** GitHub repos the owner can grant access on (editable columns only). */
  githubRepos: MatrixRepo[];
  onClose: () => void;
  onDone: (result: GrantResult) => void;
};

/**
 * Inline panel to invite a developer and grant them access to one or more
 * GitHub repos at a chosen level. Grants go through the same server action as
 * the per-repo Access section (GitHub PUT + owner-native record + activity
 * log). With no repos selected it just creates the roster record.
 */
export function AccessGrantForm({
  githubRepos,
  onClose,
  onDone,
}: AccessGrantFormProps) {
  const baseId = useId();
  const [login, setLogin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [orgRole, setOrgRole] = useState<OrgRole>("developer");
  const [level, setLevel] = useState<AccessLevel>("write");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleRepo = (fullName: string) => {
    setSelectedRepos((prev) =>
      prev.includes(fullName)
        ? prev.filter((f) => f !== fullName)
        : [...prev, fullName],
    );
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const cleanLogin = login.trim().replace(/^@/, "");
    if (!cleanLogin) {
      setError("Enter a GitHub username.");
      return;
    }

    setSubmitting(true);

    // Roster-only: create the member record without touching any repo.
    if (selectedRepos.length === 0) {
      const res = await upsertMemberAction({
        login: cleanLogin,
        email: email.trim() || null,
        displayName: displayName.trim() || null,
        orgRole,
        status: "invited",
      });
      setSubmitting(false);
      if (res.success) {
        onDone({
          type: "success",
          text: `Added ${cleanLogin} to your team roster. Grant repo access from the matrix when ready.`,
        });
      } else {
        setError(res.error ?? "Could not add member.");
      }
      return;
    }

    const permission = levelToGithubPermission(level);
    if (!permission) {
      setSubmitting(false);
      setError("Choose a valid access level.");
      return;
    }

    let granted = 0;
    let failed = 0;
    let firstError: string | undefined;
    for (const fullName of selectedRepos) {
      const repo = githubRepos.find((r) => r.fullName === fullName);
      if (!repo) continue;
      const res = await addCollaboratorAction(
        repo.owner,
        repo.name,
        cleanLogin,
        permission,
        {
          orgRole,
          expiresAt: expiresAt || null,
          email: email.trim() || null,
          displayName: displayName.trim() || null,
        },
      );
      if (res.success) granted += 1;
      else {
        failed += 1;
        firstError = firstError ?? res.error;
      }
    }

    setSubmitting(false);

    if (granted > 0 && failed === 0) {
      onDone({
        type: "success",
        text: `Invited ${cleanLogin} to ${granted} repo${granted === 1 ? "" : "s"} as “${ACCESS_LEVEL_META[level].label}”. GitHub has emailed the invitation.`,
      });
    } else if (granted > 0) {
      onDone({
        type: "success",
        text: `Granted ${cleanLogin} access to ${granted} repo${granted === 1 ? "" : "s"}; ${failed} failed${firstError ? ` (${firstError})` : ""}.`,
      });
    } else {
      setError(firstError ?? "Could not grant access on the selected repos.");
    }
  }

  return (
    <section
      aria-label="Grant access to a developer"
      className="rounded-xl border border-primary/25 bg-primary/[0.04] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <IconUserPlus className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Grant access
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Invite a developer by GitHub username and choose which repos they
              can access.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Close grant access panel"
        >
          <IconX className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`${baseId}-login`}
              className="mb-1 block text-sm font-medium text-foreground"
            >
              GitHub username <span className="text-danger">*</span>
            </label>
            <input
              id={`${baseId}-login`}
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onFocus={() => setError(null)}
              placeholder="e.g. octocat"
              autoComplete="off"
              className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor={`${baseId}-name`}
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Display name{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              id={`${baseId}-name`}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ada Lovelace"
              className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              disabled={submitting}
            />
          </div>
          <div>
            <label
              htmlFor={`${baseId}-email`}
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              id={`${baseId}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="off"
              className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              disabled={submitting}
            />
          </div>
          <div>
            <DashboardSelect
              label="Team role"
              value={orgRole}
              onChange={(v) => setOrgRole(v as OrgRole)}
              options={ORG_ROLE_OPTIONS}
              disabled={submitting}
              triggerClassName="dash-input shadow-none"
            />
          </div>
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium text-foreground">
            Repositories to grant
          </legend>
          {githubRepos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No GitHub repos available. Add a repo to your organization first,
              or add this person to the roster without repo access.
            </p>
          ) : (
            <div className="max-h-44 space-y-1.5 overflow-y-auto app-scrollbar">
              {githubRepos.map((repo) => {
                const checked = selectedRepos.includes(repo.fullName);
                return (
                  <label
                    key={repo.fullName}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRepo(repo.fullName)}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="min-w-0 truncate text-foreground">
                      {repo.fullName}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <DashboardSelect
              label="Access level"
              value={level}
              onChange={(v) => setLevel(v as AccessLevel)}
              options={GRANTABLE_LEVELS.map((v) => ({
                value: v,
                label: ACCESS_LEVEL_META[v].label,
              }))}
              disabled={submitting || selectedRepos.length === 0}
              triggerClassName="dash-input shadow-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {ACCESS_LEVEL_META[level].description}
            </p>
          </div>
          <div>
            <label
              htmlFor={`${baseId}-expiry`}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Access expires{" "}
              <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              id={`${baseId}-expiry`}
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={submitting || selectedRepos.length === 0}
              className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Shown as an expiry badge now; automatic revoke arrives soon.
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-danger-border bg-danger-subtle px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <IconUserPlus className="h-4 w-4" aria-hidden />
            {submitting
              ? "Granting…"
              : selectedRepos.length === 0
                ? "Add to roster"
                : `Grant access${selectedRepos.length > 1 ? ` (${selectedRepos.length})` : ""}`}
          </button>
        </div>
      </form>
    </section>
  );
}
