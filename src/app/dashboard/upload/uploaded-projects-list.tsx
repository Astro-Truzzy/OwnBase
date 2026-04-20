"use client";

import { useRouter } from "next/navigation";
import { IconFolder, IconTrash } from "@tabler/icons-react";
import { deleteUploadedProjectAction } from "./actions";

interface ProjectRow {
  id: string;
  name: string;
  storage_path: string;
  file_size: number | null;
  created_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadedProjectsList({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        No uploads yet. Use the form above to upload a project zip.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2" role="list">
      {projects.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <IconFolder className="h-4 w-4 text-muted shrink-0" aria-hidden />
            <span className="font-medium text-foreground truncate">{p.name}</span>
            <span className="text-muted">{formatSize(p.file_size)}</span>
            <span className="text-muted">{formatDate(p.created_at)}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
              const ok = await deleteUploadedProjectAction(p.id);
              if (ok) router.refresh();
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label={`Delete ${p.name}`}
          >
            <IconTrash className="h-3.5 w-3.5" aria-hidden />
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
