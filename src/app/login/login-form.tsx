"use client";

import { authInputClassName } from "@/lib/auth/auth-input";
import { launchOAuthAuthorizeUrl } from "@/lib/auth/oauth-return";
import {
  DEFAULT_POST_AUTH_PATH,
  getAuthCallbackUrl,
  sanitizeAuthRedirect,
} from "@/lib/auth/redirects";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LoginFormProps {
  redirectTo?: string;
  error?: string;
  signedOut?: boolean;
  passwordReset?: boolean;
}

export function LoginForm({ redirectTo, error, signedOut, passwordReset }: LoginFormProps) {
  const router = useRouter();
  const next = sanitizeAuthRedirect(redirectTo ?? DEFAULT_POST_AUTH_PATH);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!signedOut) return;
    try {
      for (const store of [localStorage, sessionStorage]) {
        const keys: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && (k.startsWith("sb-") || k.toLowerCase().includes("supabase-auth")))
            keys.push(k);
        }
        keys.forEach((k) => store.removeItem(k));
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [signedOut]);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Enter your email and password." });
      return;
    }
    setIsPending(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setMessage({ type: "error", text: err.message });
      setIsPending(false);
      return;
    }
    router.refresh();
    router.push(next);
  }

  async function signInWithGoogle() {
    setMessage(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(next),
        queryParams: { prompt: "select_account" },
        skipBrowserRedirect: true,
      },
    });
    if (err) {
      setMessage({
        type: "error",
        text: err.message.includes("not enabled")
          ? "Google sign-in is not enabled. Enable it in Supabase Dashboard → Authentication → Providers → Google, or use email / another provider."
          : err.message,
      });
      return;
    }
    if (data?.url) launchOAuthAuthorizeUrl(data.url);
  }

  async function signInWithGitHub() {
    setMessage(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: getAuthCallbackUrl(next),
        scopes: "repo",
        queryParams: { prompt: "select_account" },
        skipBrowserRedirect: true,
      },
    });
    if (err) {
      setMessage({
        type: "error",
        text: err.message.includes("not enabled")
          ? "GitHub sign-in is not enabled. Enable it in Supabase Dashboard → Authentication → Providers → GitHub, or use email / another provider."
          : err.message,
      });
      return;
    }
    if (data?.url) {
      launchOAuthAuthorizeUrl(data.url);
    }
  }

  async function signInWithGitLab() {
    setMessage(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "gitlab",
      options: {
        redirectTo: getAuthCallbackUrl(next),
        scopes: "read_api read_repository",
        queryParams: { prompt: "login" },
        skipBrowserRedirect: true,
      },
    });
    if (err) {
      setMessage({
        type: "error",
        text: err.message.includes("not enabled")
          ? "GitLab sign-in is not enabled. Enable it in Supabase Dashboard → Authentication → Providers → GitLab, or use email / another provider."
          : err.message,
      });
      return;
    }
    if (data?.url) launchOAuthAuthorizeUrl(data.url);
  }

  return (
    <div className="space-y-4">
      {signedOut && (
        <p className="text-sm text-center rounded-lg border border-border bg-surface px-3 py-2 text-foreground">
          You&apos;ve been signed out. Sign in again to continue.
        </p>
      )}
      {passwordReset && (
        <p className="text-sm text-center rounded-lg border border-border bg-surface px-3 py-2 text-foreground">
          Your password was updated. Sign in with your new password.
        </p>
      )}
      {error === "auth" && (
        <p
          className="text-sm text-center rounded-lg border p-3"
          style={{
            borderColor: "var(--error-border)",
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
          }}
        >
          Sign in failed. Please try again.
        </p>
      )}
      {message && (
        <p
          className="text-sm text-center rounded-lg border p-3"
          style={{
            borderColor: "var(--error-border)",
            backgroundColor: "var(--error-bg)",
            color: "var(--error-text)",
          }}
        >
          {message.text}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3.5 text-sm font-medium text-foreground hover:bg-border/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={signInWithGitHub}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3.5 text-sm font-medium text-foreground hover:bg-border/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          <GitHubIcon className="h-5 w-5 shrink-0" />
          Continue with GitHub
        </button>
        <button
          type="button"
          onClick={signInWithGitLab}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3.5 text-sm font-medium text-foreground hover:bg-border/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          <GitLabIcon className="h-5 w-5 shrink-0" />
          Continue with GitLab
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted">Or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className={authInputClassName}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className={authInputClassName}
        />
        <p className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-foreground underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded"
          >
            Forgot password?
          </Link>
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-accent text-white px-4 py-3 text-sm font-medium hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        >
          {isPending ? "Signing in…" : "Sign in with email"}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={
            next === DEFAULT_POST_AUTH_PATH
              ? "/signup"
              : `/signup?redirectTo=${encodeURIComponent(next)}`
          }
          className="font-medium text-foreground underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.919 1.263C4.783.84 4.252.84 4.116 1.263L1.452 9.449.11 13.587a.924.924 0 00.331 1.023L12 23.054l11.559-8.444a.92.92 0 00.396-1.023z" />
    </svg>
  );
}
