"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrowRight, IconFolder, IconTrash } from "@tabler/icons-react";
import type { GitHubCollaborator } from "../../../lib/github/types";
import { getAccessLevelLabel } from "../../../lib/github/types";
import { removeCollaboratorAction } from "../repo/actions";

interface DevsRepoSectionProps {
  fullName: string;
  owner: string;
  name: string;
  collaborators: GitHubCollaborator[];
  error?: string;
}

function repoDetailHref(fullName: string): string {
  const [repoOwner, ...nameParts] = fullName.split("/");
  const repoName = nameParts.join("/");
  return `/dashboard/repo/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}`;
}

export function DevsRepoSection({
  fullName,
  owner,
  name,
  collaborators,
  error,
}: DevsRepoSectionProps) {
  const router = useRouter();
  const [removingLogin, setRemovingLogin] = useState<string | null>(null);

  async function handleRevoke(login: string) {
    if (!confirm(`Remove ${login} from ${fullName}? They will lose access.`)) return;
    setRemovingLogin(login);
    const result = await removeCollaboratorAction(owner, name, login);
    setRemovingLogin(null);
    if (result.success) router.refresh();
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={repoDetailHref(fullName)}
          className="inline-flex w-fit items-center gap-2 rounded-lg font-medium text-foreground transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          <IconFolder className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          {fullName}
        </Link>
        <Link
          href={repoDetailHref(fullName)}
          className="inline-flex w-fit items-center gap-1.5 rounded px-2 py-1 -mr-2 text-sm text-muted transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          Manage on repo
          <IconArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {error && <p className="mt-3 text-sm text-muted">{error}</p>}
      {!error && collaborators.length === 0 && (
        <p className="mt-4 text-sm text-muted">No collaborators yet. Open the repo to grant access.</p>
      )}

      {!error && collaborators.length > 0 && (
        <div className="mt-4 overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 font-medium">Developer</th>
                <th className="py-2 font-medium">Access</th>
                <th className="py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((collab) => (
                <tr key={collab.id} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={collab.avatar_url}
                        alt=""
                        className="h-7 w-7 rounded-full border border-border object-cover"
                        loading="lazy"
                      />
                      <a
                        href={collab.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-foreground hover:underline"
                      >
                        {collab.login}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 text-muted">{getAccessLevelLabel(collab)}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(collab.login)}
                      disabled={removingLogin === collab.login}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background dark:text-red-400"
                      aria-label={`Revoke access for ${collab.login}`}
                    >
                      <IconTrash className="h-3.5 w-3.5" aria-hidden />
                      {removingLogin === collab.login ? "Revoking…" : "Revoke"}
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
