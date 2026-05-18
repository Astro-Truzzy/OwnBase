"use client";

import { authInputClassName } from "@/lib/auth/auth-input";
import { getPasswordResetCallbackUrl } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "Enter your email address." });
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: getPasswordResetCallbackUrl(),
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setIsPending(false);
      return;
    }

    setMessage({
      type: "success",
      text: "If an account exists for that email, we sent a link to reset your password. Check your inbox and spam folder.",
    });
    setIsPending(false);
  }

  return (
    <div className="space-y-4">
      {message && (
        <p
          className="text-sm text-center rounded-lg border p-3"
          style={
            message.type === "error"
              ? {
                  borderColor: "var(--error-border)",
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error-text)",
                }
              : {
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }
          }
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className={authInputClassName}
          disabled={message?.type === "success"}
        />
        <button
          type="submit"
          disabled={isPending || message?.type === "success"}
          className="w-full rounded-lg bg-accent text-white px-4 py-3 text-sm font-medium hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        >
          {isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
