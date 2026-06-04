import type { Metadata } from "next";
import Link from "next/link";
import { IconLock } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Access Denied",
  robots: { index: false, follow: false },
};

export default function AdminUnauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10">
          <IconLock className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is not authorized to access the admin dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
