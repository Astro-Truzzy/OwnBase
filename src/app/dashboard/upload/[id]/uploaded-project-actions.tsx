"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import {
  deleteUploadedProjectAction,
  getUploadedProjectDownloadUrl,
} from "../actions";

export function UploadedProjectActions({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    const result = await getUploadedProjectDownloadUrl(projectId);
    if ("url" in result) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    } else {
      alert(result.error ?? "Download failed.");
    }
    setIsDownloading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    const ok = await deleteUploadedProjectAction(projectId);
    if (ok) {
      router.push("/dashboard/upload");
      router.refresh();
    }
    setIsDeleting(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-[#050b16]/85 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914] disabled:opacity-50"
        aria-label={`Download ${projectName}`}
      >
        <IconDownload className="h-4 w-4" aria-hidden />
        {isDownloading ? "Preparing…" : "Download zip"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-[#050b16]/85 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#050914] disabled:opacity-50"
        aria-label={`Delete ${projectName}`}
      >
        <IconTrash className="h-4 w-4" aria-hidden />
        {isDeleting ? "Deleting…" : "Delete project"}
      </button>
    </div>
  );
}
