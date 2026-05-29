"use client";

import { useState } from "react";
import { IconMail } from "@tabler/icons-react";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";

import type { ReportScheduleInitial } from "./organization-report-types";

export function ReportEmailScheduleForm(props: {
  initial: ReportScheduleInitial;
  defaultEmail: string;
}) {
  const { initial, defaultEmail } = props;
  const [enabled, setEnabled] = useState(initial.enabled);
  const [cadence, setCadence] = useState<"weekly" | "monthly">(initial.cadence);
  const [email, setEmail] = useState(
    initial.destination_email || defaultEmail || "",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/reports/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, cadence, destination_email: email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save preferences.");
        return;
      }
      setMessage(
        "Your digest schedule is saved. You'll receive summaries at the cadence you selected.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dash-panel rounded-xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          <IconMail className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Scheduled email digest
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Get a periodic email with portfolio coverage and links to your
            reports. Choose weekly or monthly delivery and the inbox where
            digests should go.
          </p>
          {initial.last_sent_at ? (
            <p className="mt-2 text-[11px] text-muted-foreground/80">
              Last send (UTC): {initial.last_sent_at}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-border"
          />
          Enable scheduled digests
        </label>
        <DashboardSelect
          label="Cadence"
          value={cadence}
          onChange={(next) =>
            setCadence(next === "monthly" ? "monthly" : "weekly")
          }
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
          triggerClassName="dash-input mt-1 shadow-none"
        />
      </div>
      <div className="mt-4">
        <label
          htmlFor="report-digest-email"
          className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          Destination email
        </label>
        <input
          id="report-digest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="dash-input mt-1 w-full px-3 py-2 text-sm"
          placeholder="you@company.com"
        />
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg border border-primary/40 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save schedule"}
      </button>
    </form>
  );
}
