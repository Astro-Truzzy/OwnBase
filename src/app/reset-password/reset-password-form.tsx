"use client";

import { authInputClassName } from "@/lib/auth/auth-input";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setIsPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.refresh();
    router.push("/login?passwordReset=1");
  }

  return (
    <div className="space-y-4">
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className={authInputClassName}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className={authInputClassName}
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-accent text-white px-4 py-3 text-sm font-medium hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        >
          {isPending ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        <Link
          href="/login"
          className="font-medium text-foreground underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
