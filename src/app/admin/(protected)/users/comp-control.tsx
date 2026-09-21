"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { cn } from "@/lib/utils";
import { clearCompAction, setCompAction, type CompResult } from "./actions";

const TIERS = [
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "agency", label: "Agency" },
] as const;

const MONTH_PRESETS = [1, 3, 6, 12];
const DEFAULT_MONTHS = 6;

function isPaidTier(value: string): boolean {
  return TIERS.some((t) => t.value === value);
}

interface CompControlProps {
  userId: string;
  email: string;
  isComp: boolean;
  /** Current effective tier, so the dialog opens on something sensible. */
  currentPlan: string;
}

/**
 * Per-row comp control. Grants a paid tier without payment (flagging the
 * account so it stays out of revenue figures), or ends an existing comp.
 *
 * Writes go through server actions — see ./actions.ts for why they need the
 * service-role client and their own authorisation check.
 */
export function CompControl({ userId, email, isComp, currentPlan }: CompControlProps) {
  const [mode, setMode] = useState<"grant" | "clear" | null>(null);
  const [tier, setTier] = useState<string>(isPaidTier(currentPlan) ? currentPlan : "agency");
  const [months, setMonths] = useState<number>(DEFAULT_MONTHS);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function openGrant() {
    setTier(isPaidTier(currentPlan) ? currentPlan : "agency");
    setMonths(DEFAULT_MONTHS);
    setError(null);
    setMode("grant");
  }

  function openClear() {
    setError(null);
    setMode("clear");
  }

  function close() {
    if (busy) return;
    setMode(null);
    setError(null);
  }

  function run(action: () => Promise<CompResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      // Stay open on failure so the message is readable next to the form.
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setMode(null);
    });
  }

  const tierLabel = TIERS.find((t) => t.value === tier)?.label ?? tier;

  return (
    <>
      <button
        type="button"
        onClick={isComp ? openClear : openGrant}
        className={cn(
          "rounded-md border px-2 py-1 text-xs font-medium transition",
          isComp
            ? "border-amber-400/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {isComp ? "End comp" : "Comp…"}
      </button>

      <ConfirmDialog
        open={mode === "grant"}
        tone="default"
        title="Comp a paid tier"
        confirmLabel="Grant comp"
        busyLabel="Granting…"
        busy={busy}
        error={error}
        onConfirm={() => run(() => setCompAction(userId, tier, months))}
        onCancel={close}
        description={
          <>
            Grant <span className="font-semibold text-foreground">{tierLabel}</span> to{" "}
            <span className="font-mono text-xs text-foreground">{email}</span> without payment.
            They get full {tierLabel} access for the whole period, but the account is marked as
            comped and excluded from revenue figures.
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Tier</p>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setTier(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50",
                    tier === option.value
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Duration</p>
            <div className="flex flex-wrap items-center gap-2">
              {MONTH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={busy}
                  onClick={() => setMonths(preset)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                    months === preset
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {preset} {preset === 1 ? "month" : "months"}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={60}
                disabled={busy}
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
                aria-label="Comp duration in months"
                className="dash-input w-20 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Expires on its own — access drops to trial/free when the period ends.
            </p>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={mode === "clear"}
        tone="warning"
        title="End this comp"
        confirmLabel="End comp"
        busyLabel="Ending…"
        busy={busy}
        error={error}
        onConfirm={() => run(() => clearCompAction(userId))}
        onCancel={close}
        description={
          <>
            End the comp for{" "}
            <span className="font-mono text-xs text-foreground">{email}</span> now. Their access
            drops to trial or free on the next page load, and they start counting as a normal
            (non-paying) account again.
          </>
        }
      />
    </>
  );
}
