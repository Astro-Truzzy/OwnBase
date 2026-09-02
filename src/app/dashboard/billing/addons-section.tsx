"use client";

import { useState } from "react";
import { IconCheck, IconPlus } from "@tabler/icons-react";
import { ADDONS } from "@/lib/pricing-tiers";
import { subscribeAddonAction, getAddonManageLinkAction } from "./actions";

type AddonType = (typeof ADDONS)[number]["type"];

interface AddonsSectionProps {
  /** Add-ons with an active Paystack subscription (regardless of whether they currently apply). */
  activeAddons: AddonType[];
  /** Add-ons whose bonus capacity is eligible under the current plan. */
  eligibleAddons: AddonType[];
}

function AddonRow({
  addon,
  active,
  eligible,
}: {
  addon: (typeof ADDONS)[number];
  active: boolean;
  eligible: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const applying = active && eligible;

  async function handleBuy() {
    setError(null);
    setPending(true);
    try {
      const result = await subscribeAddonAction(addon.type);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.href = result.redirectUrl;
    } finally {
      setPending(false);
    }
  }

  async function handleManage() {
    setError(null);
    setPending(true);
    try {
      const result = await getAddonManageLinkAction(addon.type);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.open(result.link, "_blank", "noopener,noreferrer");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 dark:bg-surface/50">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            {addon.name}
            {active && (
              <span
                className={
                  applying
                    ? "inline-flex items-center gap-1 rounded-full border border-success-border bg-success-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success"
                    : "inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning"
                }
              >
                {applying ? <IconCheck className="h-3 w-3" aria-hidden /> : null}
                {applying ? "Active" : "Active — not applying"}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {active && !applying
              ? `Still billed, but your current plan isn't eligible (${addon.appliesTo} only).`
              : addon.appliesTo}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-foreground">
          {addon.price}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        {active ? (
          <button
            type="button"
            onClick={() => void handleManage()}
            disabled={pending}
            className="dash-btn-secondary inline-flex w-fit items-center gap-1.5 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {pending ? "Opening…" : "Manage / cancel →"}
          </button>
        ) : eligible ? (
          <button
            type="button"
            onClick={() => void handleBuy()}
            disabled={pending}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-primary/40 bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:brightness-105 disabled:opacity-50"
          >
            <IconPlus className="h-3.5 w-3.5" aria-hidden />
            {pending ? "Redirecting…" : "Add"}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Not available on your current plan
          </span>
        )}
        {error && <p className="text-xs text-error-text">{error}</p>}
      </div>
    </div>
  );
}

export function AddonsSection({ activeAddons, eligibleAddons }: AddonsSectionProps) {
  return (
    <div className="dash-panel p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-foreground">Add-ons</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Outgrow a tier mid-cycle? Add capacity without upgrading. Billed
        separately from your plan; cancel any time.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ADDONS.map((addon) => (
          <AddonRow
            key={addon.type}
            addon={addon}
            active={activeAddons.includes(addon.type)}
            eligible={eligibleAddons.includes(addon.type)}
          />
        ))}
      </div>
    </div>
  );
}
