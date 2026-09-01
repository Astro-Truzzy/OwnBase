"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconClockX,
  IconClockExclamation,
  IconClockPlus,
  IconTrash,
  IconCheck,
} from "@tabler/icons-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ACCESS_LEVEL_META } from "@/lib/access/levels";
import { setAccessLevelAction } from "../repo/actions";
import { extendAccessExpiryAction } from "./actions";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Deterministic UTC formatting so server and client markup agree. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export type ExpiringGrant = {
  login: string;
  displayName: string;
  fullName: string;
  owner: string;
  name: string;
  level: "none" | "read" | "write" | "admin";
  expiresAt: string;
  state: "expired" | "expiring";
};

type Message = { type: "success" | "error"; text: string };

export function ExpiringAccessQueue({
  grants,
  locked,
  onMessage,
}: {
  grants: ExpiringGrant[];
  locked: boolean;
  onMessage: (message: Message) => void;
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmGrant, setConfirmGrant] = useState<ExpiringGrant | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const keyFor = (g: ExpiringGrant) => `${g.login}|${g.fullName}`;

  async function extend(grant: ExpiringGrant) {
    setBusyKey(keyFor(grant));
    const res = await extendAccessExpiryAction(grant.fullName, grant.login, 30);
    setBusyKey(null);
    if (res.success) {
      onMessage({
        type: "success",
        text: `Extended ${grant.login}’s access on ${grant.name} by 30 days.`,
      });
      router.refresh();
    } else {
      onMessage({
        type: "error",
        text: res.error ?? "Could not extend the expiry date.",
      });
    }
  }

  async function revoke() {
    if (!confirmGrant) return;
    setConfirmBusy(true);
    setConfirmError(null);
    const res = await setAccessLevelAction(
      confirmGrant.owner,
      confirmGrant.name,
      confirmGrant.login,
      "none",
    );
    setConfirmBusy(false);
    if (res.success) {
      const removed = confirmGrant;
      setConfirmGrant(null);
      onMessage({
        type: "success",
        text: `Removed ${removed.login} from ${removed.name}.`,
      });
      router.refresh();
    } else {
      setConfirmError(res.error ?? "Could not revoke access.");
    }
  }

  const expiredCount = grants.filter((g) => g.state === "expired").length;

  return (
    <section
      aria-labelledby="expiring-access-heading"
      className="dash-panel p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="expiring-access-heading"
          className="text-lg font-semibold text-foreground"
        >
          Expiring access
        </h2>
        {grants.length > 0 && (
          <StatusPill
            tone={expiredCount > 0 ? "danger" : "warning"}
            icon={expiredCount > 0 ? IconClockX : IconClockExclamation}
          >
            {expiredCount > 0
              ? `${expiredCount} past due`
              : `${grants.length} lapsing soon`}
          </StatusPill>
        )}
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground">
        Ownbase never revokes access on its own. Grants past their date stay
        active until you remove or extend them here.
      </p>

      {grants.length === 0 ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-success-border bg-success-subtle px-4 py-3 text-sm text-success">
          <IconCheck className="h-4 w-4 shrink-0" aria-hidden />
          <span>No access grants are expired or lapsing in the next 7 days.</span>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto app-scrollbar">
          <table className="w-full min-w-md border-collapse text-sm">
            <caption className="sr-only">
              Repository access grants that have expired or lapse within seven
              days, with actions to revoke or extend each one.
            </caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Developer
                </th>
                <th scope="col" className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Repository
                </th>
                <th scope="col" className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Level
                </th>
                <th scope="col" className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Expiry
                </th>
                {!locked && (
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => {
                const key = keyFor(grant);
                const busy = busyKey === key;
                return (
                  <tr key={key} className="border-b border-border last:border-0">
                    <th scope="row" className="py-3 pr-3 text-left font-normal">
                      <span className="block font-medium text-foreground">
                        {grant.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{grant.login}
                      </span>
                    </th>
                    <td className="px-3 py-3">
                      <span className="block max-w-52 truncate text-foreground" title={grant.fullName}>
                        {grant.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {ACCESS_LEVEL_META[grant.level].label}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill
                        tone={grant.state === "expired" ? "danger" : "warning"}
                        icon={
                          grant.state === "expired"
                            ? IconClockX
                            : IconClockExclamation
                        }
                      >
                        {grant.state === "expired" ? "Expired" : "Expires"}{" "}
                        {formatDate(grant.expiresAt)}
                      </StatusPill>
                    </td>
                    {!locked && (
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void extend(grant)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                              busy && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <IconClockPlus className="h-3.5 w-3.5" aria-hidden />
                            {busy ? "Extending…" : "Extend 30d"}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setConfirmError(null);
                              setConfirmGrant(grant);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-danger-border bg-danger-subtle px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <IconTrash className="h-3.5 w-3.5" aria-hidden />
                            Revoke
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmGrant !== null}
        tone="danger"
        title="Revoke access?"
        description={
          confirmGrant
            ? `Remove ${confirmGrant.login} from ${confirmGrant.name}? They lose access on GitHub immediately. The last admin of a repository is never removed.`
            : undefined
        }
        confirmLabel="Revoke"
        busyLabel="Revoking…"
        busy={confirmBusy}
        error={confirmError}
        onCancel={() => {
          if (!confirmBusy) {
            setConfirmGrant(null);
            setConfirmError(null);
          }
        }}
        onConfirm={revoke}
      />
    </section>
  );
}
