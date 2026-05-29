"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconLoader2,
  IconSend,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react";
import type { CommitDetail } from "@/lib/repo-commit-detail";
import { fileTouchActionLabel, formatActivityTimestamp } from "@/lib/repo-activity";
import { MarkdownContent } from "@/components/MarkdownContent";
import { cn } from "@/lib/utils";

type ChatTurn = { role: "user" | "assistant"; content: string };

type CommitDetailClientProps = {
  owner: string;
  name: string;
  repoLabel: string;
  backHref: string;
  initialCommit: CommitDetail;
};

export function CommitDetailClient({
  owner,
  name,
  repoLabel,
  backHref,
  initialCommit,
}: CommitDetailClientProps) {
  const [commit] = useState(initialCommit);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() => new Set());
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const { relative, absolute } = formatActivityTimestamp(commit.timestamp);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading, insightLoading]);

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const sendInsight = useCallback(
    async (userText: string, seedMessages: ChatTurn[]) => {
      setChatError(null);
      const nextMessages: ChatTurn[] = [
        ...seedMessages,
        { role: "user", content: userText },
      ];
      setMessages(nextMessages);
      setChatLoading(true);
      try {
        const res = await fetch("/api/dashboard/repo/commit/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ commit, messages: nextMessages }),
        });
        const data = (await res.json()) as {
          reply?: string;
          error?: string;
          warning?: string;
        };
        if (!res.ok) {
          setChatError(data.error ?? "Could not get AI insight.");
          return;
        }
        const reply = data.reply ?? "";
        if (!reply) {
          setChatError(data.warning ?? data.error ?? "No response.");
          return;
        }
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        if (data.warning) setChatError(data.warning);
      } catch {
        setChatError("Network error.");
      } finally {
        setChatLoading(false);
        setInsightLoading(false);
      }
    },
    [commit],
  );

  async function explainCommit() {
    if (insightLoading || chatLoading) return;
    setInsightLoading(true);
    const prompt =
      "Explain what this commit does in plain language. Cover the main intent, affected areas, and any risks or follow-ups.";
    await sendInsight(prompt, []);
  }

  async function sendChat() {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput("");
    await sendInsight(text, messages);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          ← Back to {repoLabel}
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/70">
              Commit {commit.shortSha}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {commit.message.split("\n")[0]}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                {commit.authorAvatar ? (
                  <img
                    src={commit.authorAvatar}
                    alt=""
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <IconUser className="h-4 w-4" aria-hidden />
                )}
                {commit.author}
              </span>
              <span aria-hidden>·</span>
              <time dateTime={commit.timestamp} title={absolute}>
                {absolute} ({relative})
              </time>
              <span aria-hidden>·</span>
              <span>
                <span className="text-emerald-300/90">+{commit.stats.additions}</span>
                {" / "}
                <span className="text-red-600/90 dark:text-red-300/90">−{commit.stats.deletions}</span>
                {" · "}
                {commit.stats.filesChanged} files
              </span>
            </div>
          </div>
          {commit.url && (
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border dash-surface-inset px-3 py-2 text-sm text-foreground transition hover:border-primary/35"
            >
              Open on {commit.provider === "gitlab" ? "GitLab" : "GitHub"}
              <IconExternalLink className="h-4 w-4" aria-hidden />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="dash-panel space-y-3 p-5 sm:p-6 xl:col-span-3">
          <h2 className="text-lg font-medium text-foreground">
            Files changed ({commit.files.length})
          </h2>
          <ul className="space-y-2">
            {commit.files.map((file) => {
              const open = expandedFiles.has(file.path);
              return (
                <li
                  key={file.path}
                  className="overflow-hidden rounded-xl border border-border dash-surface-inset"
                >
                  <button
                    type="button"
                    onClick={() => toggleFile(file.path)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-primary/5"
                  >
                    {open ? (
                      <IconChevronDown className="h-4 w-4 shrink-0 text-primary/70" />
                    ) : (
                      <IconChevronRight className="h-4 w-4 shrink-0 text-primary/70" />
                    )}
                    <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                      {file.path}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground/80">
                      {fileTouchActionLabel(file.action)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground/70">
                      +{file.additions} / −{file.deletions}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border px-3 py-3">
                      {file.previousPath && (
                        <p className="mb-2 text-xs text-muted-foreground">
                          Renamed from{" "}
                          <span className="font-mono">{file.previousPath}</span>
                        </p>
                      )}
                      {file.patch ? (
                        <pre className="app-scrollbar max-h-80 overflow-auto rounded-lg border border-border bg-[#010409] p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                          {file.patch}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground/80">
                          Diff unavailable for this file (may be binary or too
                          large).
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="dash-panel flex max-h-[min(32rem,calc(100dvh-14rem))] flex-col overflow-hidden p-5 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
              <IconSparkles className="h-5 w-5 text-primary" aria-hidden />
              AI insight
            </h2>
            <button
              type="button"
              onClick={() => void explainCommit()}
              disabled={insightLoading || chatLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/25 disabled:opacity-50"
            >
              {insightLoading ? (
                <IconLoader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <IconSparkles className="h-3.5 w-3.5" aria-hidden />
              )}
              Explain commit
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div
              ref={messagesScrollRef}
              className="app-scrollbar min-h-48 max-h-full flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-border bg-muted/40 p-3"
              role="log"
              aria-live="polite"
              aria-label="AI conversation"
            >
              {messages.length === 0 && !insightLoading && (
                <p className="text-sm text-muted-foreground">
                  Ask what this commit changed, whether it is risky, or how it
                  affects a specific area. Click &ldquo;Explain commit&rdquo; for
                  a quick summary.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-4 bg-primary/15 text-foreground"
                      : "mr-2 bg-muted/40 text-foreground/90",
                  )}
                >
                  {m.role === "assistant" ? (
                    <MarkdownContent content={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              ))}
              {(chatLoading || insightLoading) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Analyzing changes…
                </div>
              )}
            </div>

            {chatError && (
              <p className="shrink-0 text-xs text-amber-200/90">{chatError}</p>
            )}

            <div className="flex shrink-0 gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
                placeholder="Ask about this commit…"
                disabled={chatLoading}
                className="min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void sendChat()}
                disabled={chatLoading || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                aria-label="Send"
              >
                <IconSend className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
