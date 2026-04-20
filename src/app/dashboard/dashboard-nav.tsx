"use client";

import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import type { User } from "@supabase/supabase-js";

interface ProfileSnapshot {
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
}

interface DashboardNavProps {
  user: User;
  profile?: ProfileSnapshot | null;
}

function getInitials(user: User, profile?: ProfileSnapshot | null): string {
  if (profile?.first_name || profile?.last_name) {
    const f = (profile.first_name ?? "").trim();
    const l = (profile.last_name ?? "").trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (l) return l.slice(0, 2).toUpperCase();
  }
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name && typeof name === "string") {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  }
  const email = user.email ?? user.user_metadata?.email ?? "";
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  const displayLabel =
    profile?.first_name || profile?.last_name
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
      : user.email ?? user.user_metadata?.email ?? "Account";
  const initials = getInitials(user, profile);

  return (
    <nav className="flex items-center gap-2 sm:gap-4">
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-semibold"
          aria-hidden
        >
          {initials}
        </div>
        <span className="text-sm text-foreground truncate max-w-[180px]" title={user.email ?? displayLabel}>
          {displayLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:border-border hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      >
        <IconLogout className="h-4 w-4 shrink-0" aria-hidden />
        Sign out
      </button>
    </nav>
  );
}
