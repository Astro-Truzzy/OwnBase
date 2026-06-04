import type { Metadata } from "next";
import { IconShieldLock } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Incorrect email or password.",
  not_configured: "ADMIN_PASSWORD is not set. Add it to your environment variables.",
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const errorMessage = params.error ? (ERROR_MESSAGES[params.error] ?? "An error occurred.") : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <IconShieldLock className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Admin Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Internal business dashboard · OwnBase
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form method="post" action="/api/admin/auth/login" className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Admin email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Admin password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Not a customer-facing page · For business owner use only
        </p>
      </div>
    </div>
  );
}
