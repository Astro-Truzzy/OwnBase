"use client";

import {
  IconFolder,
  IconCode,
  IconServer,
  IconSettings,
  IconFileText,
  IconBug,
  IconFolderOff,
} from "@tabler/icons-react";
import type { FolderCategoryCount } from "../../../../../lib/github/fetch-repo-tree";

interface FolderStructureSectionProps {
  totalFolders: number;
  byCategory: FolderCategoryCount[];
  loading?: boolean;
  error?: string | null;
}

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Frontend: IconCode,
  Backend: IconServer,
  Shared: IconFolder,
  Config: IconSettings,
  Docs: IconFileText,
  Tests: IconBug,
  Other: IconFolderOff,
};

export function FolderStructureSection({
  totalFolders,
  byCategory,
  loading,
  error,
}: FolderStructureSectionProps) {
  if (loading) {
    return (
      <section className="dash-panel p-6 sm:p-8">
        <h2 className="text-lg font-medium text-foreground">
          Repository structure
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 w-28 animate-pulse rounded-lg bg-cyan-200/10"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dash-panel p-6 sm:p-8">
        <h2 className="text-lg font-medium text-foreground">
          Repository structure
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </section>
    );
  }

  return (
    <section className="dash-panel p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          <IconFolder className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-medium text-foreground">
          Repository structure
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Folders in this repo, grouped by category.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="rounded-xl border border-border dash-surface-inset px-5 py-3">
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {totalFolders}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">folders total</span>
        </div>
        {byCategory.map(({ category, count }) => {
          const Icon = CATEGORY_ICONS[category] ?? IconFolder;
          return (
            <div
              key={category}
              className="flex items-center gap-3 rounded-xl border border-border dash-surface-inset px-4 py-3"
            >
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <span className="font-semibold tabular-nums text-foreground">
                  {count}
                </span>
                <span className="ml-1.5 text-sm text-muted-foreground">
                  {category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
