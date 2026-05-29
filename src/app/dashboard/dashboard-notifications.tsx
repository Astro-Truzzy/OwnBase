"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconBell,
  IconChevronDown,
  IconChevronUp,
  IconCreditCard,
  IconFolder,
  IconLoader2,
  IconChartBar,
  IconUpload,
} from "@tabler/icons-react";
import type { DashboardNotification } from "@/lib/dashboard-notifications";

function kindIcon(kind: DashboardNotification["kind"]) {
  switch (kind) {
    case "billing":
      return <IconCreditCard className="h-4 w-4 shrink-0 text-primary" />;
    case "usage":
      return <IconChartBar className="h-4 w-4 shrink-0 text-amber-300/90" />;
    case "setup":
      return <IconFolder className="h-4 w-4 shrink-0 text-violet-300/90" />;
    case "upload":
      return <IconUpload className="h-4 w-4 shrink-0 text-primary" />;
    default:
      return <IconBell className="h-4 w-4 shrink-0 text-primary" />;
  }
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const panelEase = [0.16, 1, 0.3, 1] as const;

export function DashboardNotifications() {
  const reduceMotion = useReducedMotion();
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: panelEase };
  const expandTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: panelEase };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    [],
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/notifications", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: DashboardNotification[];
      };
      setNotifications(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(id: string) {
    const res = await fetch("/api/dashboard/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ notificationId: id }),
    });
    if (!res.ok) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/dashboard/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notifications-panel"
            role="dialog"
            aria-label="Notification list"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={panelTransition}
            style={{ transformOrigin: "top right" }}
            className="z-50 rounded-xl border border-border bg-popover/98 text-popover-foreground shadow-lg backdrop-blur-md max-md:fixed max-md:inset-x-4 max-md:top-32 max-md:mt-0 max-md:w-auto md:absolute md:right-0 md:top-full md:mt-2 md:w-[min(22rem,calc(100vw-1.5rem))]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">
                Notifications
              </p>
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={markingAll || unreadCount === 0}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10 hover:text-primary/80 disabled:pointer-events-none disabled:opacity-40"
              >
                {markingAll ? "Saving…" : "Mark all as read"}
              </button>
            </div>

            <div className="max-h-[min(70vh,24rem)] overflow-y-auto app-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                  <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  You&apos;re all caught up. We&apos;ll surface billing
                  reminders, plan usage, and recent activity here.
                </p>
              ) : (
                <ul className="divide-y divide-border py-1">
                  {notifications.map((n) => {
                    const expanded = expandedId === n.id;
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(n.id)}
                          className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-muted/60 ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                          aria-expanded={expanded}
                        >
                          <span className="mt-0.5">{kindIcon(n.kind)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {n.title}
                              </span>
                              {expanded ? (
                                <IconChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <IconChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {n.summary}
                            </span>
                            <span className="mt-1 text-[11px] text-muted-foreground/80">
                              {formatWhen(n.createdAt)}
                              {!n.read && !expanded ? (
                                <span className="ml-2 text-primary">New</span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              key={`detail-${n.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={expandTransition}
                              className="overflow-hidden border-t border-border bg-muted/30"
                            >
                              <div className="px-3 pb-3 pt-2">
                                {n.detail ? (
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {n.detail}
                                  </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  {n.href ? (
                                    <Link
                                      href={n.href}
                                      className="inline-flex text-xs font-medium text-primary hover:text-primary/80"
                                      onClick={() => setOpen(false)}
                                    >
                                      Open related page →
                                    </Link>
                                  ) : null}
                                  {!n.read ? (
                                    <button
                                      type="button"
                                      onClick={() => void markRead(n.id)}
                                      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                    >
                                      Mark as read
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
