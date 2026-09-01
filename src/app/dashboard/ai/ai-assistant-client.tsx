"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconArrowsMaximize,
  IconChevronRight,
  IconFolder,
  IconLoader2,
  IconMessageCircle,
  IconPlus,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";
import { FileFullViewModal } from "@/components/dashboard/file-full-view-modal";
import { FileTypeIcon } from "@/components/dashboard/file-type-icon";
import { DashboardSelect } from "@/components/dashboard/dashboard-select";
import { FeatureLockedNotice } from "@/components/dashboard/feature-lock";
import { MarkdownContent } from "@/components/MarkdownContent";
import { cn } from "@/lib/utils";
import { useAccessStatus } from "../access-status-context";

const CodeViewer = dynamic(
  () =>
    import("@/components/dashboard/code-viewer").then((m) => m.CodeViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
        Highlighting…
      </div>
    ),
  },
);

type TrackedRepoRow = {
  full_name: string;
  repo_name: string;
  repo_owner: string;
};

type BrowserEntry = { name: string; path: string; type: "file" | "dir" };

type ChatTurn = { role: "user" | "assistant"; content: string };

type ContextFile = { path: string; content: string };

interface AiAssistantClientProps {
  initialRepos: TrackedRepoRow[];
}

export function AiAssistantClient({ initialRepos }: AiAssistantClientProps) {
  const locked = useAccessStatus().trialExpired;
  const [repos] = useState(initialRepos);
  const [fullName, setFullName] = useState<string>(initialRepos[0]?.full_name ?? "");
  const [branch, setBranch] = useState("");
  const [dirPath, setDirPath] = useState("");
  const [entries, setEntries] = useState<BrowserEntry[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileText, setFileText] = useState("");
  const [fileTruncated, setFileTruncated] = useState(false);
  const [fileBinary, setFileBinary] = useState(false);
  const [fileLanguage, setFileLanguage] = useState("plaintext");
  const [fileError, setFileError] = useState<string | null>(null);
  const [fullViewOpen, setFullViewOpen] = useState(false);

  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const displayRepoLabel = useMemo(() => {
    const row = repos.find((r) => r.full_name === fullName);
    if (!row) return fullName;
    if (row.repo_owner === "gitlab") return row.full_name.replace(/^gitlab\//, "");
    return row.full_name;
  }, [repos, fullName]);

  const repoOptions = useMemo(
    () =>
      repos.map((repo) => ({
        value: repo.full_name,
        label:
          repo.repo_owner === "gitlab"
            ? repo.full_name.replace(/^gitlab\//, "")
            : repo.full_name,
      })),
    [repos],
  );

  const pathSegments = useMemo(() => {
    if (!dirPath) return [];
    return dirPath.split("/").filter(Boolean);
  }, [dirPath]);

  const loadBrowse = useCallback(async () => {
    if (!fullName) {
      setEntries([]);
      return;
    }
    setBrowseLoading(true);
    setBrowseError(null);
    try {
      const params = new URLSearchParams({ fullName, path: dirPath });
      if (branch) params.set("ref", branch);
      const res = await fetch(`/api/dashboard/ai/browse?${params}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json()) as {
        entries?: BrowserEntry[];
        defaultBranch?: string;
        error?: string;
      };
      if (!res.ok) {
        setBrowseError(data.error ?? "Could not load folder.");
        setEntries([]);
        return;
      }
      if (data.defaultBranch && !branch) {
        setBranch(data.defaultBranch);
      }
      setEntries(data.entries ?? []);
    } catch {
      setBrowseError("Network error loading folder.");
      setEntries([]);
    } finally {
      setBrowseLoading(false);
    }
  }, [fullName, dirPath, branch]);

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  const loadFile = useCallback(
    async (path: string) => {
      if (!fullName) return;
      setFilePath(path);
      setFullViewOpen(false);
      setFileLoading(true);
      setFileError(null);
      setFileText("");
      setFileBinary(false);
      setFileTruncated(false);
      try {
        const params = new URLSearchParams({ fullName, path });
        if (branch) params.set("ref", branch);
        const res = await fetch(`/api/dashboard/ai/file?${params}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json()) as {
          content?: string;
          truncated?: boolean;
          isBinary?: boolean;
          defaultBranch?: string;
          language?: string;
          error?: string;
        };
        if (!res.ok) {
          setFileError(data.error ?? "Could not load file.");
          return;
        }
        if (data.defaultBranch && !branch) {
          setBranch(data.defaultBranch);
        }
        if (data.isBinary) {
          setFileBinary(true);
          return;
        }
        setFileText(data.content ?? "");
        setFileTruncated(Boolean(data.truncated));
        setFileLanguage(data.language ?? "plaintext");
      } catch {
        setFileError("Network error loading file.");
      } finally {
        setFileLoading(false);
      }
    },
    [fullName, branch],
  );

  function onSelectRepo(next: string) {
    setFullName(next);
    setDirPath("");
    setBranch("");
    setFilePath(null);
    setFileText("");
    setFileError(null);
    setEntries([]);
  }

  function onOpenDir(name: string, path: string) {
    setDirPath(path);
    setFilePath(null);
    setFileText("");
    setFileError(null);
  }

  function breadcrumbTo(index: number) {
    const parts = pathSegments.slice(0, index + 1);
    setDirPath(parts.join("/"));
    setFilePath(null);
    setFileText("");
    setFileError(null);
  }

  function goRoot() {
    setDirPath("");
    setFilePath(null);
    setFileText("");
    setFileError(null);
  }

  function addCurrentFileToContext() {
    if (!filePath || fileBinary || !fileText) return;
    setContextFiles((prev) => {
      if (prev.some((f) => f.path === filePath)) return prev;
      if (prev.length >= 8) return prev;
      return [...prev, { path: filePath, content: fileText }];
    });
  }

  function removeContext(path: string) {
    setContextFiles((prev) => prev.filter((f) => f.path !== path));
  }

  async function sendChat() {
    const text = input.trim();
    if (!text || chatLoading) return;
    if (locked) return;
    setChatError(null);
    const nextMessages: ChatTurn[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/dashboard/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          messages: nextMessages,
          contextFiles,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; warning?: string };
      if (!res.ok) {
        setChatError(data.error ?? "Chat failed.");
        return;
      }
      const reply = data.reply ?? "";
      if (!reply) {
        setChatError(data.warning ?? data.error ?? "No response.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (data.warning) {
        setChatError(data.warning);
      } else {
        setChatError(null);
      }
    } catch {
      setChatError("Network error.");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <section className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-border/70 bg-card/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Repository &amp; files</h2>
          <Link
            href="/dashboard/organization"
            className="text-xs font-medium text-primary hover:underline"
          >
            Manage tracked repos
          </Link>
        </div>

        {repos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Track at least one repository under{" "}
            <Link href="/dashboard/organization" className="text-primary underline-offset-2 hover:underline">
              Organization
            </Link>{" "}
            to browse files and ask questions here.
          </p>
        ) : (
          <>
            <DashboardSelect
              label="Repository"
              value={fullName}
              onChange={onSelectRepo}
              options={repoOptions}
            />

            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={goRoot}
                className="rounded px-1.5 py-0.5 font-medium text-foreground hover:bg-muted/60"
              >
                root
              </button>
              {pathSegments.map((seg, i) => (
                <span key={`${seg}-${i}`} className="flex items-center gap-1">
                  <IconChevronRight className="h-3 w-3 opacity-50" aria-hidden />
                  <button
                    type="button"
                    onClick={() => breadcrumbTo(i)}
                    className="rounded px-1.5 py-0.5 hover:bg-muted/60"
                  >
                    {seg}
                  </button>
                </span>
              ))}
            </div>

            <div className="rounded-xl border border-border/60 bg-card/90">
              {browseLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading…
                </div>
              ) : browseError ? (
                <p className="p-4 text-sm text-red-600 dark:text-red-400">{browseError}</p>
              ) : (
                <ul className="max-h-[min(40vh,320px)] divide-y divide-border/40 overflow-y-auto">
                  {entries.map((e) => (
                    <li key={e.path}>
                      <button
                        type="button"
                        onClick={() =>
                          e.type === "dir"
                            ? onOpenDir(e.name, e.path)
                            : void loadFile(e.path)
                        }
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/50",
                          filePath === e.path && e.type === "file" && "bg-primary/10",
                        )}
                      >
                        {e.type === "dir" ? (
                          <IconFolder className="h-4 w-4 shrink-0 text-primary/80" />
                        ) : (
                          <FileTypeIcon name={e.name} />
                        )}
                        <span className="truncate text-foreground">{e.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card/90 ring-1 ring-border/40">
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 overflow-visible border-b border-border/50 bg-muted/50 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 truncate font-mono text-xs text-muted-foreground">
                  {filePath && (
                    <FileTypeIcon name={filePath.split("/").pop() ?? filePath} />
                  )}
                  {filePath ?? "Select a file"}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="group relative">
                    <button
                      type="button"
                      disabled={!filePath || fileBinary || !fileText}
                      onClick={() => setFullViewOpen(true)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition hover:border-primary/40 hover:bg-muted hover:text-primary disabled:opacity-40"
                      aria-label="Full view"
                    >
                      <IconArrowsMaximize className="h-4 w-4" aria-hidden />
                    </button>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground opacity-0 shadow-md ring-1 ring-border/60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      Full view
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!filePath || fileBinary || !fileText || contextFiles.length >= 8}
                    onClick={addCurrentFileToContext}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/35 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary transition enabled:hover:bg-primary/25 disabled:opacity-40"
                  >
                    <IconPlus className="h-3.5 w-3.5" aria-hidden />
                    Include in chat
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-b-xl">
              {fileLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading file…
                </div>
              ) : fileError ? (
                <div className="space-y-2 p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>
                  {fileError.includes("GitHub") && (
                    <p className="text-xs text-muted-foreground">
                      Sign out and sign in again with GitHub to refresh repository
                      access.
                    </p>
                  )}
                </div>
              ) : fileBinary ? (
                <p className="p-4 text-sm text-muted-foreground">
                  This file looks binary or is not shown as text. Choose a source,
                  README, or config file for best results.
                </p>
              ) : filePath && fileText ? (
                <CodeViewer
                  code={fileText}
                  language={fileLanguage}
                  path={filePath}
                  truncated={fileTruncated}
                />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  Pick a file from the list to preview its contents.
                </p>
              )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="flex min-h-[480px] min-w-0 flex-1 flex-col rounded-2xl border border-border/70 bg-card/90 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <IconMessageCircle className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">Ask AI</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Questions about <span className="text-foreground">{displayRepoLabel}</span>
          {contextFiles.length > 0
            ? ` using ${contextFiles.length} attached file(s).`
            : ". Attach files with “Include in chat” for grounded answers."}
        </p>

        {contextFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {contextFiles.map((f) => (
              <span
                key={f.path}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs text-foreground"
              >
                <span className="truncate">{f.path}</span>
                <button
                  type="button"
                  onClick={() => removeContext(f.path)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${f.path}`}
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="app-scrollbar mb-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-border/50 bg-card/85 p-3 min-h-[200px] max-h-[min(50vh,440px)]">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Example: “Summarize what this repo does for a non-technical stakeholder”
              or “Where is authentication handled?”
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-4 border border-primary/25 bg-primary/10 text-foreground"
                  : "mr-4 border border-border/60 bg-muted/30 text-foreground/95",
              )}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.role === "user" ? "You" : "Assistant"}
              </p>
              {m.role === "assistant" ? (
                <MarkdownContent content={m.content} className="text-foreground/95" />
              ) : (
                <div className="whitespace-pre-wrap wrap-break-word">{m.content}</div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden />
              Thinking…
            </div>
          )}
        </div>

        {chatError && (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {chatError}
          </p>
        )}

        {locked && <FeatureLockedNotice feature="Ask AI" className="mb-3" />}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendChat();
              }
            }}
            rows={3}
            disabled={locked}
            placeholder={
              locked
                ? "Subscribe to ask the AI about this repo."
                : "Ask about this repo, its structure, or attached files…"
            }
            className="min-h-[88px] flex-1 resize-y rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            disabled={chatLoading || !input.trim() || locked}
            onClick={() => void sendChat()}
            className="self-end rounded-xl border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/30 disabled:opacity-40"
          >
            <IconSend className="h-5 w-5" aria-hidden />
            <span className="sr-only">Send</span>
          </button>
        </div>
      </section>

      <FileFullViewModal
        open={fullViewOpen && Boolean(filePath && fileText && !fileBinary)}
        onClose={() => setFullViewOpen(false)}
        filePath={filePath ?? ""}
        code={fileText ?? ""}
        language={fileLanguage}
        truncated={fileTruncated}
      />
    </div>
  );
}
