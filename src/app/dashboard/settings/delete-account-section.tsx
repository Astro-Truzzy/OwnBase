"use client";

import { useState, useTransition } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { navigateToServerSignOut } from "@/lib/auth/hard-sign-out";
import { deleteAccountAction } from "./actions";

type DeleteAccountSectionProps = {
  /** Email when available; otherwise the account user id (OAuth without email). */
  confirmPhrase: string;
};

export function DeleteAccountSection({
  confirmPhrase,
}: DeleteAccountSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function openDialog() {
    setError(null);
    setDialogOpen(true);
  }

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      const result = await deleteAccountAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialogOpen(false);
      navigateToServerSignOut();
    });
  }

  return (
    <>
      <section className="dash-panel border border-danger-border bg-danger-subtle p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-danger-border bg-card text-danger">
            <IconAlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-danger">
              Delete account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently remove your Ownbase account, profile, tracked
              repositories, uploads, summaries, and connected integrations.
              This cannot be undone.
            </p>
            <button
              type="button"
              onClick={openDialog}
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-danger-border bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Delete my account
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={dialogOpen}
        title="Delete your account?"
        description={
          <>
            <p>
              This permanently deletes your account and all associated data,
              including:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Profile and settings</li>
              <li>Tracked repositories and activity history</li>
              <li>AI summaries and uploaded project files</li>
              <li>GitHub connection tokens and notification preferences</li>
            </ul>
            <p className="mt-4 font-medium text-danger">
              You will be signed out immediately. You cannot recover this
              account after deletion.
            </p>
          </>
        }
        confirmLabel="Yes, delete my account"
        busyLabel="Deleting…"
        tone="danger"
        busy={isDeleting}
        error={error}
        acknowledgeLabel="I understand this action is permanent and irreversible."
        confirmPhrase={confirmPhrase}
        confirmPhraseLabel={
          <>
            Type {confirmPhrase.includes("@") ? "your email" : "your account ID"}{" "}
            to confirm
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) setDialogOpen(false);
        }}
      />
    </>
  );
}
