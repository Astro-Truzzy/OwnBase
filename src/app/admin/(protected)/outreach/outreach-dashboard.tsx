"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconMail,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconSearch,
  IconSend,
  IconUser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { OutreachLead, OutreachMessage } from "@/lib/outreach/types";

type Escalation = OutreachMessage & {
  lead?: Pick<OutreachLead, "id" | "name" | "email" | "track">;
};

type Stats = {
  total: number;
  byStatus: Record<string, number>;
  byTrack: Record<string, number>;
  escalated: number;
  drafts: number;
};

type Tab = "leads" | "discover" | "inbox";

function TrackBadge({ track }: { track: string }) {
  const isBuild = track === "website_build";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
        isBuild
          ? "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "border-cyan-400/30 bg-cyan-500/10 text-accent",
      )}
    >
      {isBuild ? "Build site" : "OwnBase"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function OutreachDashboard() {
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [missingTable, setMissingTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTrack, setFilterTrack] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OutreachMessage | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("restaurants in Lagos");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    website_url: "",
    track: "" as "" | "website_build" | "ownbase",
  });

  const [emailEdit, setEmailEdit] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterTrack) params.set("track", filterTrack);
      if (filterStatus) params.set("status", filterStatus);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/outreach/leads?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setLeads(data.leads ?? []);
      setStats(data.stats ?? null);
      setEscalations(data.escalations ?? []);
      setMissingTable(Boolean(data.missingTable));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterTrack, filterStatus, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId],
  );

  useEffect(() => {
    setEmailEdit(selected?.email ?? "");
    setDraft(null);
    if (!selected) return;
    void (async () => {
      const res = await fetch(`/api/admin/outreach/draft?leadId=${selected.id}`);
      const data = await res.json();
      if (res.ok && data.message) setDraft(data.message);
    })();
  }, [selected?.id]);

  async function runDiscover() {
    setBusy("discover");
    setNotice(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        query,
        maxResults: 20,
        enrichEmails: true,
      };
      if (lat && lng) {
        payload.lat = Number(lat);
        payload.lng = Number(lng);
      }
      const res = await fetch("/api/admin/outreach/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discover failed");
      setNotice(
        `Found ${data.discovered} places · created ${data.created}` +
          (data.skipped ? ` · skipped ${data.skipped}` : ""),
      );
      setTab("leads");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discover failed");
    } finally {
      setBusy(null);
    }
  }

  async function createManual() {
    setBusy("manual");
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manual,
          track: manual.track || undefined,
          email: manual.email || null,
          website_url: manual.website_url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setShowManual(false);
      setManual({
        name: "",
        email: "",
        phone: "",
        category: "",
        address: "",
        website_url: "",
        track: "",
      });
      setNotice(`Added ${data.lead.name}`);
      await load();
      setSelectedId(data.lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveEmail() {
    if (!selected) return;
    setBusy("email");
    try {
      const res = await fetch("/api/admin/outreach/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, email: emailEdit || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setNotice("Email saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateDraft() {
    if (!selected) return;
    setBusy("draft");
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      setDraft(data.message);
      setNotice("Draft generated — review before sending");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveDraftEdits() {
    if (!draft) return;
    setBusy("save-draft");
    try {
      const res = await fetch("/api/admin/outreach/draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: draft.id,
          subject: draft.subject,
          body_text: draft.body_text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDraft(data.message);
      setNotice("Draft saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendDraft() {
    if (!draft) return;
    if (!confirm("Send this email now? This cannot be undone.")) return;
    setBusy("send");
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: draft.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setDraft(null);
      setNotice(`Sent to ${data.to}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(null);
    }
  }

  async function escalateAction(
    messageId: string,
    action: "dismiss" | "close_lead" | "suppress" | "reply",
  ) {
    setBusy(`esc-${messageId}`);
    setError(null);
    try {
      const res = await fetch("/api/admin/outreach/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          action,
          replyText: action === "reply" ? replyText : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setReplyFor(null);
      setReplyText("");
      setNotice(`Escalation ${action.replace(/_/g, " ")} done`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Outreach</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Find local businesses, draft cold emails, approve sends, triage replies
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <IconRefresh className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <IconPlus className="h-4 w-4" />
            Add lead
          </button>
        </div>
      </div>

      {stats && !missingTable && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Leads", value: stats.total },
            { label: "Build site", value: stats.byTrack.website_build ?? 0 },
            { label: "OwnBase", value: stats.byTrack.ownbase ?? 0 },
            { label: "Drafts", value: stats.drafts },
            { label: "Needs you", value: stats.escalated },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {missingTable && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/8 px-5 py-4 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Database migration required
          </p>
          <p className="mt-1 text-amber-700/90 dark:text-amber-400/90">
            Apply{" "}
            <code className="font-mono text-xs">
              supabase/migrations/20260713180000_outreach_leads.sql
            </code>{" "}
            in the Supabase SQL editor (restore the project if paused), then refresh.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/8 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}

      {showManual && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Manual lead</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Business name *"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["category", "Category"],
                ["address", "Address"],
                ["website_url", "Website URL"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs text-muted-foreground">
                {label}
                <input
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  value={manual[key]}
                  onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="block text-xs text-muted-foreground">
              Track
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={manual.track}
                onChange={(e) =>
                  setManual((m) => ({
                    ...m,
                    track: e.target.value as typeof manual.track,
                  }))
                }
              >
                <option value="">Auto</option>
                <option value="website_build">Build site</option>
                <option value="ownbase">OwnBase</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={!manual.name.trim() || busy === "manual"}
            onClick={() => void createManual()}
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy === "manual" ? "Saving…" : "Save lead"}
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(
          [
            ["leads", "Leads"],
            ["discover", "Discover"],
            ["inbox", `Inbox${stats?.escalated ? ` (${stats.escalated})` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <IconSearch className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Uses Google Places Text Search (server-side). Requires{" "}
              <code className="font-mono text-xs">GOOGLE_PLACES_API_KEY</code> with no HTTP-referrer
              restriction. No real website →
              Build site; otherwise OwnBase. Optional Hunter enrichment with{" "}
              <code className="font-mono text-xs">HUNTER_API_KEY</code>.
            </p>
          </div>
          <label className="block text-xs text-muted-foreground">
            Search query
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "plumbers near Yaba Lagos"'
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-muted-foreground">
              Lat (optional)
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="6.5244"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Lng (optional)
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="3.3792"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!query.trim() || busy === "discover"}
            onClick={() => void runDiscover()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            <IconMapPin className="h-4 w-4" />
            {busy === "discover" ? "Searching…" : "Run discovery"}
          </button>
        </div>
      )}

      {tab === "inbox" && (
        <div className="space-y-3">
          {escalations.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No replies needing your attention.
            </p>
          ) : (
            escalations.map((msg) => (
              <div key={msg.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <IconUser className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{msg.lead?.name ?? "Unknown"}</span>
                  {msg.lead?.track && <TrackBadge track={msg.lead.track} />}
                  {msg.intent && <StatusBadge status={msg.intent} />}
                  <span className="text-xs text-muted-foreground">{msg.lead?.email}</span>
                </div>
                {msg.triage_notes && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">{msg.triage_notes}</p>
                )}
                <p className="text-xs font-medium text-muted-foreground">{msg.subject}</p>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm text-foreground">
                  {msg.body_text}
                </pre>
                {replyFor === msg.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-border bg-background p-3 text-sm"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Your reply…"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!replyText.trim() || busy === `esc-${msg.id}`}
                        onClick={() => void escalateAction(msg.id, "reply")}
                        className="h-8 rounded-lg bg-accent px-3 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Send reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyFor(null)}
                        className="h-8 rounded-lg border border-border px-3 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyFor(msg.id);
                        setReplyText("");
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-medium text-white"
                    >
                      <IconMail className="h-3.5 w-3.5" />
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => void escalateAction(msg.id, "dismiss")}
                      className="h-8 rounded-lg border border-border px-3 text-xs"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => void escalateAction(msg.id, "close_lead")}
                      className="h-8 rounded-lg border border-border px-3 text-xs"
                    >
                      Close lead
                    </button>
                    <button
                      type="button"
                      onClick={() => void escalateAction(msg.id, "suppress")}
                      className="h-8 rounded-lg border border-red-400/40 px-3 text-xs text-red-600"
                    >
                      Suppress email
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "leads" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                className="h-9 flex-1 min-w-[140px] rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
              >
                <option value="">All tracks</option>
                <option value="website_build">Build site</option>
                <option value="ownbase">OwnBase</option>
              </select>
              <select
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {[
                  "new",
                  "enriched",
                  "drafted",
                  "sent",
                  "replied",
                  "escalated",
                  "closed",
                  "unsubscribed",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              {loading ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : leads.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No leads yet. Use Discover or Add lead.
                </p>
              ) : (
                <div className="max-h-[560px] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Business
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Track
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedId(lead.id)}
                          className={cn(
                            "cursor-pointer border-b border-border/50 hover:bg-muted/30",
                            selectedId === lead.id && "bg-accent/5",
                          )}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{lead.name}</p>
                            <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                              {lead.category || lead.address || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <TrackBadge track={lead.track} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={lead.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {lead.email || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-4">
            {!selected ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Select a lead to draft and send
              </p>
            ) : (
              <>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <TrackBadge track={selected.track} />
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[selected.category, selected.address, selected.phone]
                      .filter(Boolean)
                      .join(" · ") || "No details"}
                  </p>
                  {selected.website_url && (
                    <a
                      href={selected.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-accent hover:underline"
                    >
                      {selected.website_url}
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-muted-foreground">Email</label>
                  <div className="flex gap-2">
                    <input
                      className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                      value={emailEdit}
                      onChange={(e) => setEmailEdit(e.target.value)}
                      placeholder="owner@business.com"
                    />
                    <button
                      type="button"
                      onClick={() => void saveEmail()}
                      disabled={busy === "email"}
                      className="h-9 rounded-lg border border-border px-3 text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void generateDraft()}
                  disabled={busy === "draft"}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50"
                >
                  <IconRobot className="h-4 w-4" />
                  {busy === "draft" ? "Generating…" : "Generate AI draft"}
                </button>

                {draft && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <label className="block text-xs text-muted-foreground">Subject</label>
                    <input
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      value={draft.subject ?? ""}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, subject: e.target.value } : d))
                      }
                    />
                    <label className="block text-xs text-muted-foreground">Body</label>
                    <textarea
                      className="min-h-40 w-full rounded-lg border border-border bg-background p-3 text-sm"
                      value={draft.body_text}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, body_text: e.target.value } : d))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveDraftEdits()}
                        disabled={busy === "save-draft"}
                        className="h-9 flex-1 rounded-lg border border-border text-sm"
                      >
                        Save edits
                      </button>
                      <button
                        type="button"
                        onClick={() => void sendDraft()}
                        disabled={busy === "send" || !selected.email}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-50"
                      >
                        <IconSend className="h-4 w-4" />
                        {busy === "send" ? "Sending…" : "Approve & send"}
                      </button>
                    </div>
                    {!selected.email && (
                      <p className="text-xs text-amber-600">Add an email before sending.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
