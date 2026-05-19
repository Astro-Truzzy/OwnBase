"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
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
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const phraseMatches =
    confirmEmail.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();
  const canConfirm = acknowledged && phraseMatches && !isDeleting;

  useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        setDialogOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen, isDeleting]);

  function openDialog() {
    setAcknowledged(false);
    setConfirmEmail("");
    setError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isDeleting) return;
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!canConfirm) return;
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
      <section className="dash-panel border border-rose-500/25 bg-rose-950/20 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/35 bg-rose-500/10 text-rose-300">
            <IconAlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-rose-50">Delete account</h2>
            <p className="mt-1 text-sm text-rose-100/75">
              Permanently remove your Ownbase account, profile, tracked repositories,
              uploads, summaries, and connected integrations. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={openDialog}
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-rose-500/45 bg-rose-600/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              Delete my account
            </button>
          </div>
        </div>
      </section>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={closeDialog}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-desc"
            className="w-full max-w-md rounded-xl border border-rose-500/35 bg-[#0c121c] p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="delete-account-title"
              className="text-lg font-semibold text-rose-50"
            >
              Delete your account?
            </h3>
            <p id="delete-account-desc" className="mt-2 text-sm text-cyan-100/80">
              This permanently deletes your account and all associated data,
              including:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cyan-100/75">
              <li>Profile and settings</li>
              <li>Tracked repositories and activity history</li>
              <li>AI summaries and uploaded project files</li>
              <li>GitHub connection tokens and notification preferences</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-rose-200/90">
              You will be signed out immediately. You cannot recover this account
              after deletion.
            </p>

            <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-cyan-100/85">
              <input
                type="checkbox"
                checked={acknowledged}
                disabled={isDeleting}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-rose-400/50"
              />
              <span>I understand this action is permanent and irreversible.</span>
            </label>

            <div className="mt-4">
              <label
                htmlFor="delete-account-email"
                className="mb-1 block text-sm font-medium text-cyan-100"
              >
                Type {confirmPhrase.includes("@") ? "your email" : "your account ID"} to
                confirm
              </label>
              <input
                id="delete-account-email"
                type="email"
                autoComplete="off"
                disabled={isDeleting}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={confirmPhrase}
                className="dash-input w-full rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500/40 focus:ring-offset-2 focus:ring-offset-[#0c121c]"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                disabled={isDeleting}
                onClick={closeDialog}
                className="inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-muted/40 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canConfirm}
                onClick={() => void handleDelete()}
                className="inline-flex justify-center rounded-lg border border-rose-500/50 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
