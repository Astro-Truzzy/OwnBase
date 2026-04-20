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
      className="group block rounded-xl border border-border bg-surface/80 p-5 sm:p-6 transition-all duration-200 hover:border-accent/40 hover:bg-surface hover:shadow-lg hover:shadow-accent/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
          <IconFolder className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-foreground group-hover:text-accent transition-colors">
              {repo.name}
            </h3>
            <span
              className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-muted"
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
            <p className="mt-1.5 line-clamp-2 text-sm text-muted leading-relaxed">
              {repo.description}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-muted italic">
              No description
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span>Updated {formatDate(repo.updated_at)}</span>
        <span className="text-border">·</span>
        <span className="font-medium text-foreground/80 group-hover:text-accent transition-colors">
          Open overview →
        </span>
      </p>
    </Link>
  );
}
