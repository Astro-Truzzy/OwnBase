"use client";

import { useState } from "react";
import { IconLoader2, IconLogout } from "@tabler/icons-react";
import { navigateToServerSignOut } from "@/lib/auth/hard-sign-out";

export function DashboardLogoutButton() {
  const [pending, setPending] = useState(false);

  function signOut() {
    setPending(true);
    try {
      navigateToServerSignOut();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={pending}
      aria-label="Log out"
      className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/15 bg-[#08101f]/90 px-3 py-1.5 text-sm font-medium text-cyan-100/85 transition-colors hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-200 disabled:pointer-events-none disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070e1b]"
      aria-busy={pending}
    >
      {pending ? (
        <IconLoader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <IconLogout className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="hidden sm:inline" aria-hidden>
        Log out
      </span>
    </button>
  );
}
