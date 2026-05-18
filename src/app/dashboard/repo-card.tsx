import Link from "next/link";
import { IconFolder, IconLock, IconWorld } from "@tabler/icons-react";
import type { GitHubRepo } from "../../lib/github/types";
import type { RepoTag } from "../../lib/repo-tags";

interface RepoCardProps {
  repo: GitHubRepo;
  tags?: RepoTag[];
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

/** Path to repo detail (owner/name) for Executive Summary. */
function repoDetailPath(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export function RepoCard({ repo, tags = [] }: RepoCardProps) {
  return (
    <Link
      href={repoDetailPath(repo.full_name)}
      className="group block rounded-xl border border-cyan-200/18 bg-[#08101f]/90 p-5 shadow-[0_14px_32px_rgba(2,8,24,0.28)] transition-all duration-200 hover:border-cyan-300/40 hover:bg-[#0a1428] hover:shadow-[0_18px_40px_rgba(34,211,238,0.12)] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914] sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-cyan-200 transition-colors group-hover:border-cyan-300/40 group-hover:bg-cyan-400/15">
          <IconFolder className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-cyan-50 transition-colors group-hover:text-cyan-200">
              {repo.name}
            </h3>
            <span
              className="flex shrink-0 items-center gap-1 rounded-md border border-cyan-200/15 bg-[#050b16]/70 px-2.5 py-1 text-xs font-medium text-cyan-100/70"
              title={repo.private ? "Private" : "Public"}
            >
              {repo.private ? (
                <IconLock className="h-3.5 w-3.5" />
              ) : (
                <IconWorld className="h-3.5 w-3.5" />
              )}
              {repo.private ? "Private" : "Public"}
            </span>
          </div>
          {repo.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-cyan-100/65">
              {repo.description}
            </p>
          ) : (
            <p className="mt-1.5 text-sm italic text-cyan-100/50">
              No description
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-cyan-100/55">
        <span>Updated {formatDate(repo.updated_at)}</span>
        <span className="text-cyan-200/30">·</span>
        <span className="font-medium text-cyan-200/90 transition-colors group-hover:text-cyan-100">
          Open overview →
        </span>
      </p>
    </Link>
  );
}
