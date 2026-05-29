"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  IconBrandGithub,
  IconBrandGitlab,
} from "@tabler/icons-react";
import {
  connectGitHubAccount,
  connectGitLabAccount,
  signInWithGitHubAccount,
} from "@/lib/auth/connect-provider";

const OVERLAY_Z = 10050;

const optionButtonClass =
  "flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-muted px-4 py-3.5 text-left transition hover:border-primary/50 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface DashboardRepoConnectPromptProps {
  open: boolean;
  variant?: "modal" | "banner";
  oauthError?: string | null;
}

export function DashboardRepoConnectPrompt({
  open,
  variant = "modal",
  oauthError = null,
}: DashboardRepoConnectPromptProps) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || variant !== "modal") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, variant]);

  const handleGitHub = () => {
    setMessage(null);
    startTransition(async () => {
      const { error } = await connectGitHubAccount();
      if (error) setMessage(error);
    });
  };

  const handleGitLab = () => {
    setMessage(null);
    startTransition(async () => {
      const { error } = await connectGitLabAccount();
      if (error) setMessage(error);
    });
  };

  const handleSignInWithGitHub = () => {
    setMessage(null);
    startTransition(async () => {
      const { error } = await signInWithGitHubAccount();
      if (error) setMessage(error);
    });
  };

  if (!mounted || !open) return null;

  const displayError = message ?? oauthError;
  const showGitHubSignInHint =
    Boolean(oauthError?.includes("already linked")) ||
    Boolean(message?.includes("already linked"));

  const bodyCopy =
    "Connect GitHub or GitLab to continue. This unlocks repository browsing and setup in Ownbase.";

  if (variant === "banner") {
    return createPortal(
      <div
        className="fixed inset-x-0 top-0 z-10040 border-b border-primary/35 bg-card px-4 py-4 shadow-lg"
        role="status"
        aria-live="polite"
      >
        <p className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Add a repository to continue —{" "}
          </span>
          {bodyCopy}
        </p>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-background/90 backdrop-blur-md"
        style={{ zIndex: OVERLAY_Z }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="repo-connect-title"
        className="fixed left-1/2 top-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary/30 bg-card p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
        style={{ zIndex: OVERLAY_Z + 1 }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Connect your code
        </p>
        <h2
          id="repo-connect-title"
          className="mt-1.5 text-xl font-semibold tracking-tight text-foreground"
        >
          Add a repository to get started
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {bodyCopy}
        </p>
        {displayError ? (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
            {displayError}
          </p>
        ) : null}
        {showGitHubSignInHint ? (
          <button
            type="button"
            onClick={handleSignInWithGitHub}
            disabled={pending}
            className="mt-3 w-full rounded-lg border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-primary/15 disabled:opacity-50"
          >
            Sign in with your existing GitHub account
          </button>
        ) : null}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleGitHub}
            disabled={pending}
            className={optionButtonClass}
          >
            <IconBrandGithub className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Connect GitHub
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Sign in with GitHub to access your repositories
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleGitLab}
            disabled={pending}
            className={optionButtonClass}
          >
            <IconBrandGitlab
              className="h-5 w-5 shrink-0 text-orange-500"
              aria-hidden
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Connect GitLab
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Sign in with GitLab to access your projects
              </span>
            </span>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
