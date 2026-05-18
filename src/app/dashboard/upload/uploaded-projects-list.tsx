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
      <p className="mt-4 text-sm text-cyan-100/60">
        No uploads yet. Use the form above to upload a project zip.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2" role="list">
      {projects.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-200/15 bg-[#050b16]/65 px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <IconFolder
              className="h-4 w-4 shrink-0 text-cyan-300/80"
              aria-hidden
            />
            <span className="truncate font-medium text-cyan-50">{p.name}</span>
            <span className="text-cyan-100/55">{formatSize(p.file_size)}</span>
            <span className="text-cyan-100/55">{formatDate(p.created_at)}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`Delete "${p.name}"? This cannot be undone.`))
                return;
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
