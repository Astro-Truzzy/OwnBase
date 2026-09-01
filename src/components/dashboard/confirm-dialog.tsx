"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type ConfirmTone = "danger" | "warning" | "default";

const TONE: Record<
  ConfirmTone,
  { border: string; iconWrap: string; confirmBtn: string; ring: string }
> = {
  danger: {
    border: "border-danger-border",
    iconWrap: "border-danger-border bg-danger-subtle text-danger",
    confirmBtn:
      "border-danger-border bg-danger text-danger-foreground hover:opacity-90",
    ring: "focus-visible:ring-danger/40",
  },
  warning: {
    border: "border-warning-border",
    iconWrap: "border-warning-border bg-warning-subtle text-warning",
    confirmBtn:
      "border-warning-border bg-warning text-warning-foreground hover:opacity-90",
    ring: "focus-visible:ring-warning/40",
  },
  default: {
    border: "border-border",
    iconWrap: "border-border bg-muted/50 text-foreground",
    confirmBtn:
      "border-primary/40 bg-primary text-primary-foreground hover:opacity-90",
    ring: "focus-visible:ring-primary/40",
  },
};

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  error?: string | null;
  /** When set, an acknowledge checkbox must be ticked before confirming. */
  acknowledgeLabel?: React.ReactNode;
  /** When set, the user must type this exact phrase (case-insensitive) to confirm. */
  confirmPhrase?: string;
  confirmPhraseLabel?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra body content rendered below the description. */
  children?: React.ReactNode;
};

/**
 * Reusable confirmation dialog, generalized from the delete-account flow.
 * `role="alertdialog"`, Escape + backdrop dismiss (disabled while busy), focus
 * moves to Cancel on open, and optional acknowledge / type-to-confirm guards for
 * destructive actions. Danger tone by default; uses semantic tokens.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busyLabel,
  tone = "danger",
  busy = false,
  error,
  acknowledgeLabel,
  confirmPhrase,
  confirmPhraseLabel,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [phrase, setPhrase] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const styles = TONE[tone];

  // Reset guards each time the dialog opens.
  useEffect(() => {
    if (open) {
      setAcknowledged(false);
      setPhrase("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    cancelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const phraseMatches =
    !confirmPhrase ||
    phrase.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();
  const canConfirm =
    (!acknowledgeLabel || acknowledged) && phraseMatches && !busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl shadow-black/50",
          styles.border,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              styles.iconWrap,
            )}
          >
            <IconAlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            {description ? (
              <div
                id={descId}
                className="mt-1.5 text-sm text-muted-foreground"
              >
                {description}
              </div>
            ) : null}
          </div>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        {acknowledgeLabel ? (
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={busy}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span>{acknowledgeLabel}</span>
          </label>
        ) : null}

        {confirmPhrase ? (
          <div className="mt-4">
            <label
              htmlFor={`${titleId}-phrase`}
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {confirmPhraseLabel ?? (
                <>
                  Type <span className="font-semibold">{confirmPhrase}</span> to
                  confirm
                </>
              )}
            </label>
            <input
              id={`${titleId}-phrase`}
              type="text"
              autoComplete="off"
              disabled={busy}
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              placeholder={confirmPhrase}
              className="dash-input w-full rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-danger-border bg-danger-subtle px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={cn(
              "inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
              styles.confirmBtn,
              styles.ring,
            )}
          >
            {busy ? (busyLabel ?? "Working…") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
