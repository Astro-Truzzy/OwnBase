"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { IconLoader2, IconX } from "@tabler/icons-react";
import { FileTypeIcon } from "@/components/dashboard/file-type-icon";

const CodeViewer = dynamic(
  () =>
    import("@/components/dashboard/code-viewer").then((m) => m.CodeViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
        <IconLoader2 className="h-5 w-5 animate-spin" aria-hidden />
        Loading preview…
      </div>
    ),
  },
);

type FileFullViewModalProps = {
  open: boolean;
  onClose: () => void;
  filePath: string;
  code: string;
  language: string;
  truncated?: boolean;
};

export function FileFullViewModal({
  open,
  onClose,
  filePath,
  code,
  language,
  truncated,
}: FileFullViewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const fileName = filePath.split("/").pop() ?? filePath;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-full-view-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close full view"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#0c121c] shadow-2xl shadow-black/50 ring-1 ring-primary/20">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-[#0d1117] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileTypeIcon name={fileName} className="h-5 w-5" />
            <h2
              id="file-full-view-title"
              className="truncate font-mono text-sm font-medium text-foreground"
            >
              {filePath}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition hover:border-primary/40 hover:bg-muted hover:text-foreground"
            aria-label="Close full view"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeViewer
            code={code}
            language={language}
            path={filePath}
            truncated={truncated}
            maxHeight="calc(92vh - 7rem)"
            showFooter
          />
        </div>
      </div>
    </div>
  );
}
