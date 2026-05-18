"use client";

import Link from "next/link";
import {
  IconFolder,
  IconLock,
  IconWorld,
  IconExternalLink,
} from "@tabler/icons-react";
import type { GitLabProject } from "../../lib/gitlab/types";

interface GitLabProjectCardProps {
  project: GitLabProject;
  isTracked: boolean;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** Detail page for GitLab project (owner=gitlab, name=path_with_namespace). */
function gitlabDetailHref(pathWithNamespace: string): string {
  const encoded = encodeURIComponent(pathWithNamespace);
  return `/dashboard/repo/gitlab/${encoded}`;
}

export function GitLabProjectCard({
  project,
  isTracked,
}: GitLabProjectCardProps) {
  const isPrivate = project.visibility === "private";

  return (
    <div className="rounded-xl border border-cyan-200/18 bg-[#08101f]/90 p-5 shadow-[0_14px_32px_rgba(2,8,24,0.28)] transition-all duration-200 hover:border-cyan-300/40 hover:bg-[#0a1428] hover:shadow-[0_18px_40px_rgba(34,211,238,0.12)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-cyan-200">
          <IconFolder className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-cyan-50">
              {project.name}
            </h3>
            <span
              className="flex shrink-0 items-center gap-1 rounded-md border border-cyan-200/15 bg-[#050b16]/70 px-2.5 py-1 text-xs font-medium text-cyan-100/70"
              title={isPrivate ? "Private" : "Public"}
            >
              {isPrivate ? (
                <IconLock className="h-3.5 w-3.5" />
              ) : (
                <IconWorld className="h-3.5 w-3.5" />
              )}
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>
          {project.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-cyan-100/65">
              {project.description}
            </p>
          ) : (
            <p className="mt-1.5 text-sm italic text-cyan-100/50">
              No description
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={gitlabDetailHref(project.path_with_namespace)}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-cyan-200 transition-colors hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
        >
          Open in Ownbase
        </Link>
        <a
          href={project.web_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-cyan-100/60 transition-colors hover:text-cyan-100"
        >
          <IconExternalLink className="h-4 w-4" aria-hidden />
          GitLab
        </a>
        {isTracked && (
          <span className="rounded-md border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
            In your organization
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-cyan-100/50">
        Updated {formatDate(project.last_activity_at)}
      </p>
    </div>
  );
}
