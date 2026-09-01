"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUserMinus,
  IconUser,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconLogout,
} from "@tabler/icons-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";
import type { AccessMatrix } from "@/lib/access/access-matrix";
import {
  buildOffboardingPlan,
  type OffboardingRunRow,
  type OffboardingStepKey,
} from "@/lib/continuity/offboarding";
import { setAccessLevelAction } from "../repo/actions";
import {
  cancelOffboardingAction,
  completeOffboardingAction,
  setOffboardingStepAction,
  startOffboardingAction,
} from "./actions";
import { cn } from "@/lib/utils";

type Message = { type: "success" | "error"; text: string };

export function OffboardingSection({
  matrix,
  runs,
  locked,
  now,
  onMessage,
}: {
  matrix: AccessMatrix;
  runs: OffboardingRunRow[];
  locked: boolean;
  now: number;
  onMessage: (message: Message) => void;
}) {
  const router = useRouter();
  const [selectedLogin, setSelectedLogin] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"revoke_all" | "complete" | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const openRuns = useMemo(
    () => runs.filter((r) => r.status === "in_progress"),
    [runs],
  );
  const completedRuns = useMemo(
    () => runs.filter((r) => r.status === "completed").slice(0, 5),
    [runs],
  );

  const peopleOptions = useMemo(
    () =>
      matrix.people.map((p) => ({
        value: p.login,
        label:
          p.displayName === p.login
            ? `@${p.login}`
            : `${p.displayName} (@${p.login})`,
      })),
    [matrix.people],
  );

  // The active login: an explicit pick, else the first open run.
  const activeLogin = selectedLogin || openRuns[0]?.login || "";

  const plan = useMemo(() => {
    if (!activeLogin) return null;
    const run =
      openRuns.find(
        (r) => r.login.toLowerCase() === activeLogin.toLowerCase(),
      ) ?? null;
    return buildOffboardingPlan({ login: activeLogin, matrix, run, now });
  }, [activeLogin, matrix, openRuns, now]);

  async function startRun() {
    if (!plan) return;
    setBusy(true);
    const res = await startOffboardingAction({
      login: plan.login,
      memberId: plan.memberId,
    });
    setBusy(false);
    if (res.success) {
      onMessage({
        type: "success",
        text: `Started offboarding for ${plan.login}.`,
      });
      router.refresh();
    } else {
      onMessage({
        type: "error",
        text: res.error ?? "Could not start the offboarding run.",
      });
    }
  }

  async function toggleStep(step: OffboardingStepKey, done: boolean) {
    if (!plan?.run) return;
    setBusy(true);
    const res = await setOffboardingStepAction(plan.run.id, step, done);
    setBusy(false);
    if (res.success) router.refresh();
    else {
      onMessage({
        type: "error",
        text: res.error ?? "Could not save that step.",
      });
    }
  }

  async function runConfirm() {
    if (!plan) return;
    setConfirmBusy(true);
    setConfirmError(null);

    if (confirm === "revoke_all") {
      let ok = 0;
      let failed = 0;
      let firstError: string | undefined;
      for (const fullName of plan.steps.find((s) => s.key === "revoke_access")
        ?.repos ?? []) {
        const repo = matrix.repos.find((r) => r.fullName === fullName);
        if (!repo || repo.provider !== "github") continue;
        const res = await setAccessLevelAction(
          repo.owner,
          repo.name,
          plan.login,
          "none",
        );
        if (res.success) ok += 1;
        else {
          failed += 1;
          firstError = firstError ?? res.error;
        }
      }
      setConfirmBusy(false);
      setConfirm(null);
      onMessage(
        failed === 0
          ? {
              type: "success",
              text: `Revoked ${ok} grant${ok === 1 ? "" : "s"} for ${plan.login}.`,
            }
          : {
              type: ok > 0 ? "success" : "error",
              text: `Revoked ${ok}; ${failed} could not be revoked${firstError ? ` (${firstError})` : ""}.`,
            },
      );
      router.refresh();
      return;
    }

    if (confirm === "complete" && plan.run) {
      const res = await completeOffboardingAction(plan.run.id);
      setConfirmBusy(false);
      if (res.success) {
        setConfirm(null);
        setSelectedLogin("");
        onMessage({
          type: "success",
          text: `${plan.login} is offboarded. The run is recorded in your audit log.`,
        });
        router.refresh();
      } else {
        setConfirmError(res.error ?? "Could not complete the offboarding run.");
      }
    }
  }

  async function cancelRun() {
    if (!plan?.run) return;
    setBusy(true);
    const res = await cancelOffboardingAction(plan.run.id);
    setBusy(false);
    if (res.success) {
      onMessage({ type: "success", text: "Offboarding run cancelled." });
      router.refresh();
    } else {
      onMessage({ type: "error", text: res.error ?? "Could not cancel." });
    }
  }

  const revokeStep = plan?.steps.find((s) => s.key === "revoke_access");

  return (
    <section
      aria-labelledby="offboarding-heading"
      className="dash-panel p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="offboarding-heading"
          className="text-lg font-semibold text-foreground"
        >
          Offboarding
        </h2>
        {openRuns.length > 0 && (
          <StatusPill tone="warning" icon={IconUserMinus}>
            {openRuns.length} in progress
          </StatusPill>
        )}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Walk a departing developer off your repositories without leaving loose
        ends. Verified steps are checked against live access data.
      </p>

      {matrix.people.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No developers have access yet. Grant access from Team &amp; Access
          first.
        </p>
      ) : (
        <>
          <div className="mt-4 max-w-sm">
            <DashboardSelect
              label="Developer"
              value={activeLogin}
              onChange={setSelectedLogin}
              options={peopleOptions}
              placeholder="Choose a developer…"
              disabled={locked || busy}
              triggerClassName="dash-input shadow-none"
            />
          </div>

          {plan && (
            <div className="mt-5 rounded-xl border border-border p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                    <IconUser className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {plan.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{plan.login} ·{" "}
                      {plan.accessibleRepos.length === 0
                        ? "no repository access"
                        : `${plan.accessibleRepos.length} ${plan.accessibleRepos.length === 1 ? "repo" : "repos"}`}
                    </p>
                  </div>
                </div>

                {!locked && (
                  <div className="flex flex-wrap gap-2">
                    {!plan.run ? (
                      <button
                        type="button"
                        onClick={() => void startRun()}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                      >
                        <IconLogout className="h-4 w-4" aria-hidden />
                        Start offboarding
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void cancelRun()}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                        >
                          <IconX className="h-4 w-4" aria-hidden />
                          Cancel run
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmError(null);
                            setConfirm("complete");
                          }}
                          disabled={busy || !plan.readyToComplete}
                          title={
                            plan.readyToComplete
                              ? undefined
                              : "Clear every verified step first."
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-success-border bg-success-subtle px-3.5 py-2 text-sm font-semibold text-success transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-success/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <IconCheck className="h-4 w-4" aria-hidden />
                          Complete offboarding
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!plan.run && (
                <p className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Checklist progress is saved once you start the run. Verified
                  steps below already reflect live access.
                </p>
              )}

              <ul className="mt-4 space-y-2.5">
                {plan.steps.map((step) => {
                  const inputId = `offboard-step-${step.key}`;
                  return (
                    <li
                      key={step.key}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start gap-3">
                        {step.verifiable ? (
                          <span
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              step.done
                                ? "border-success-border bg-success-subtle text-success"
                                : "border-warning-border bg-warning-subtle text-warning",
                            )}
                          >
                            {step.done ? (
                              <IconCheck className="h-3 w-3" aria-hidden />
                            ) : (
                              <IconAlertTriangle className="h-3 w-3" aria-hidden />
                            )}
                            <span className="sr-only">
                              {step.done ? "Complete" : "Outstanding"}
                            </span>
                          </span>
                        ) : (
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={step.acknowledged}
                            disabled={locked || busy || !plan.run}
                            onChange={(e) =>
                              void toggleStep(step.key, e.target.checked)
                            }
                            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          {step.verifiable ? (
                            <span className="block text-sm font-medium text-foreground">
                              {step.label}
                            </span>
                          ) : (
                            <label
                              htmlFor={inputId}
                              className="block cursor-pointer text-sm font-medium text-foreground"
                            >
                              {step.label}
                            </label>
                          )}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {step.description}
                          </p>

                          {step.verifiable && step.outstanding > 0 && (
                            <p className="mt-1.5 text-xs text-warning">
                              {step.outstanding}{" "}
                              {step.outstanding === 1
                                ? "repository"
                                : "repositories"}{" "}
                              outstanding: {step.repos.slice(0, 3).join(", ")}
                              {step.repos.length > 3
                                ? ` +${step.repos.length - 3} more`
                                : ""}
                            </p>
                          )}

                          {step.key === "revoke_access" &&
                            !locked &&
                            step.outstanding > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmError(null);
                                  setConfirm("revoke_all");
                                }}
                                disabled={busy}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-danger-border bg-danger-subtle px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:opacity-50"
                              >
                                <IconUserMinus className="h-3.5 w-3.5" aria-hidden />
                                Revoke all {step.outstanding} now
                              </button>
                            )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      {completedRuns.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
            Recently offboarded
          </h3>
          <ul className="mt-2 space-y-1.5">
            {completedRuns.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-foreground">@{run.login}</span>
                <StatusPill tone="success" icon={IconCheck}>
                  {run.completed_at
                    ? `Completed ${run.completed_at.slice(0, 10)}`
                    : "Completed"}
                </StatusPill>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        tone={confirm === "complete" ? "warning" : "danger"}
        title={
          confirm === "complete"
            ? "Complete offboarding?"
            : "Revoke all repository access?"
        }
        description={
          confirm === "complete"
            ? `Record ${plan?.login} as offboarded. This writes a permanent entry to your audit log and closes the run.`
            : `Remove ${plan?.login} from ${revokeStep?.outstanding ?? 0} repositor${(revokeStep?.outstanding ?? 0) === 1 ? "y" : "ies"} on GitHub. The last admin of a repository is never removed.`
        }
        confirmLabel={confirm === "complete" ? "Complete" : "Revoke all"}
        busyLabel={confirm === "complete" ? "Completing…" : "Revoking…"}
        busy={confirmBusy}
        error={confirmError}
        acknowledgeLabel={
          confirm === "revoke_all"
            ? "I understand this removes their access on every listed repository."
            : undefined
        }
        confirmPhrase={confirm === "revoke_all" ? "REVOKE" : undefined}
        onCancel={() => {
          if (!confirmBusy) {
            setConfirm(null);
            setConfirmError(null);
          }
        }}
        onConfirm={runConfirm}
      />
    </section>
  );
}
