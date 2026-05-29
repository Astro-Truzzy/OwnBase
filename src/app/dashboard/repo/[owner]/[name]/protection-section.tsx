"use client";

import { useState } from "react";
import { IconShield, IconDownload } from "@tabler/icons-react";
import type { ActivityLogRow } from "../../../../../lib/db/types";

interface ProtectionSectionProps {
  owner: string;
  name: string;
  activityEntries: ActivityLogRow[];
}

const ACTION_LABELS: Record<string, string> = {
  collaborator_added: "Access granted",
  collaborator_removed: "Access revoked",
  repo_tracked: "Added to organization",
  repo_untracked: "Removed from organization",
};

function formatIso(iso: string): string {
  try {
    return new Date(iso).toISOString();
  } catch {
    return iso;
  }
}

export function ProtectionSection({
  owner,
  name,
  activityEntries,
}: ProtectionSectionProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    const data = activityEntries.map((e) => ({
      at: formatIso(e.created_at),
      action: e.action_type,
      label: ACTION_LABELS[e.action_type] ?? e.action_type,
      details: e.details,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ownbase-audit-${owner}-${name}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  return (
    <section className="dash-panel p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <IconShield className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-lg font-medium text-foreground">
          Protect your digital assets
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Keep a record of access and organization changes. Export the audit log
        for compliance or long-term archiving. Your code stays on GitHub; we
        help you track who has access and what changed.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || activityEntries.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border dash-surface-inset px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-muted/60 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          <IconDownload className="h-4 w-4" aria-hidden />
          {exporting ? "Exporting…" : "Export audit log (JSON)"}
        </button>
      </div>
    </section>
  );
}
