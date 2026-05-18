"use client";

import { useState } from "react";
import { IconMail } from "@tabler/icons-react";

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
        "Saved. Digests send when your host runs the cron job against /api/cron/report-digest with CRON_SECRET and outbound mail (Resend) configured.",
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
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-cyan-200/15 bg-[#050b16]/85 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-cyan-200">
          <IconMail className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-cyan-50">
            Scheduled email digest
          </h3>
          <p className="mt-1 text-xs text-cyan-100/60">
            Store cadence and inbox. Sending requires a scheduled GET to{" "}
            <code className="rounded bg-black/40 px-1 py-px text-[10px] text-cyan-200/90">
              /api/cron/report-digest
            </code>{" "}
            with{" "}
            <code className="rounded bg-black/40 px-1 py-px text-[10px] text-cyan-200/90">
              Authorization: Bearer CRON_SECRET
            </code>
            , plus{" "}
            <code className="rounded bg-black/40 px-1 py-px text-[10px] text-cyan-200/90">
              RESEND_API_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-black/40 px-1 py-px text-[10px] text-cyan-200/90">
              RESEND_FROM_EMAIL
            </code>
            .
          </p>
          {initial.last_sent_at ? (
            <p className="mt-2 text-[11px] text-cyan-100/45">
              Last send (UTC): {initial.last_sent_at}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-cyan-100/85">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-cyan-200/30"
          />
          Enable scheduled digests
        </label>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/55">
            Cadence
          </span>
          <select
            value={cadence}
            onChange={(e) =>
              setCadence(e.target.value === "monthly" ? "monthly" : "weekly")
            }
            className="mt-1 w-full rounded-lg border border-cyan-200/15 bg-black/40 px-3 py-2 text-sm text-cyan-50"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label
          htmlFor="report-digest-email"
          className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/55"
        >
          Destination email
        </label>
        <input
          id="report-digest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-cyan-200/15 bg-black/40 px-3 py-2 text-sm text-cyan-50 placeholder:text-cyan-100/35"
          placeholder="you@company.com"
        />
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-400/95">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-emerald-200/90">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg border border-cyan-300/35 bg-linear-to-r from-cyan-500/90 to-violet-600/85 px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save schedule"}
      </button>
    </form>
  );
}
