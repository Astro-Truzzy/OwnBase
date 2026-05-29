"use client";

import { useState, useTransition } from "react";
import { IconUserPlus, IconTrash, IconExternalLink } from "@tabler/icons-react";
import { getAccessLevelLabel } from "../../../../../lib/github/types";
import type { GitHubCollaborator } from "../../../../../lib/github/types";
import {
  addCollaboratorAction,
  removeCollaboratorAction,
  type ManageAccessResult,
} from "../../actions";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";

interface AccessSectionProps {
  owner: string;
  name: string;
  collaborators: GitHubCollaborator[];
  error?: string | null;
}

const GITHUB_ACCESS_URL = (owner: string, repo: string) =>
  `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/settings/access`;

const PERMISSION_OPTIONS: {
  label: string;
  value: "pull" | "push" | "admin";
}[] = [
  { label: "View only", value: "pull" },
  { label: "Can edit", value: "push" },
  { label: "Full access", value: "admin" },
];

export function AccessSection({
  owner,
  name,
  collaborators,
  error,
}: AccessSectionProps) {
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<"pull" | "push" | "admin">(
    "push",
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [removingLogin, setRemovingLogin] = useState<string | null>(null);
  const [isAddPending, startAddTransition] = useTransition();

  const clearMessage = () => setMessage(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    const value = username.trim().replace(/^@/, "");
    if (!value) {
      setMessage({ type: "error", text: "Enter a GitHub username." });
      return;
    }
    startAddTransition(async () => {
      const result = await addCollaboratorAction(
        owner,
        name,
        value,
        permission,
      );
      if (result.success) {
        setMessage({ type: "success", text: `Access granted to ${value}.` });
        setUsername("");
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Could not add collaborator.",
        });
      }
    });
  };

  const handleRemove = (login: string) => {
    if (
      !confirm(`Remove ${login} from this repository? They will lose access.`)
    )
      return;
    clearMessage();
    setRemovingLogin(login);
    removeCollaboratorAction(owner, name, login).then(
      (result: ManageAccessResult) => {
        setRemovingLogin(null);
        if (result.success) {
          setMessage({
            type: "success",
            text: `${login}’s access has been removed.`,
          });
        } else {
          setMessage({
            type: "error",
            text: result.error ?? "Could not remove access.",
          });
        }
      },
    );
  };

  const manageUrl = GITHUB_ACCESS_URL(owner, name);

  return (
    <section
      id="access"
      className="dash-panel scroll-mt-[calc(64px+0.75rem)] p-6 sm:scroll-mt-[calc(56px+0.75rem)] sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-foreground">Who has access</h2>
        <a
          href={manageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="-ml-1 inline-flex w-fit items-center gap-1.5 rounded px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          <IconExternalLink className="h-4 w-4" aria-hidden />
          Advanced: manage on GitHub
        </a>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Control who has access. Grant new collaborators or revoke access in one
        click—no need to leave this page.
      </p>

      {/* In-app invite form */}
      <form
        onSubmit={handleInvite}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[180px]">
          <label
            htmlFor="invite-username"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            GitHub username
          </label>
          <input
            id="invite-username"
            type="text"
            placeholder="e.g. octocat"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={clearMessage}
            className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            disabled={isAddPending}
            autoComplete="username"
          />
        </div>
        <div className="w-full sm:w-[168px]">
          <label
            htmlFor="invite-permission"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Access level
          </label>
          <DashboardSelect
            id="invite-permission"
            value={permission}
            onChange={(value) =>
              setPermission(value as "pull" | "push" | "admin")
            }
            options={PERMISSION_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            disabled={isAddPending}
            triggerClassName="dash-input shadow-none"
          />
        </div>
        <button
          type="submit"
          disabled={isAddPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border dash-surface-inset px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-muted/60 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          <IconUserPlus className="h-4 w-4" aria-hidden />
          {isAddPending ? "Adding…" : "Grant access"}
        </button>
      </form>

      {message && (
        <p
          role="alert"
          className={`mt-3 text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {message.text}
        </p>
      )}

      {error && <p className="mt-4 text-sm text-muted-foreground">{error}</p>}

      {!error && collaborators.length === 0 && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          No collaborators yet. Use the form above to grant access by GitHub
          username.
        </p>
      )}

      {!error && collaborators.length > 0 && (
        <div className="mt-6 overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Person</th>
                <th className="pb-3 font-medium">Access level</th>
                <th className="pb-3 font-medium w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((collab) => (
                <tr
                  key={collab.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3">
                    <a
                      href={collab.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={collab.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="font-medium text-foreground">
                        {collab.login}
                      </span>
                    </a>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {getAccessLevelLabel(collab)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(collab.login)}
                      disabled={removingLogin === collab.login}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background"
                      aria-label={`Revoke access for ${collab.login}`}
                      title="Revoke access in one click"
                    >
                      <IconTrash className="h-3.5 w-3.5" aria-hidden />
                      {removingLogin === collab.login
                        ? "Revoking…"
                        : "Revoke access"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
