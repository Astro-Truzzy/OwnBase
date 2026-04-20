"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import {
  IconLayoutDashboard,
  IconUpload,
  IconLogout,
  IconBuilding,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/dashboard/upload", label: "Upload", icon: IconUpload },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-screen w-[4.5rem] flex-col items-center gap-2 border-r border-border bg-background/95 py-4 backdrop-blur-sm"
      aria-label="Quick actions"
    >
      {/* Logo / home */}
      <Link
        href="/dashboard"
        className="mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Ownbase Dashboard"
      >
        <IconBuilding className="h-5 w-5" aria-hidden />
      </Link>

      <div className="h-px w-8 shrink-0 bg-border" role="separator" />

      {/* Quick action icons */}
      <nav className="flex flex-1 flex-col gap-1 py-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
                isActive
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-surface/50 text-muted hover:border-accent/30 hover:bg-surface hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {/* Tooltip on hover */}
              <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg group-hover:block group-focus:block">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="h-px w-8 shrink-0 bg-border" role="separator" />

      {/* Sign out at bottom */}
      <button
        type="button"
        onClick={signOut}
        title="Sign out"
        className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/50 text-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Sign out"
      >
        <IconLogout className="h-5 w-5" aria-hidden />
        <span className="pointer-events-none absolute left-full z-10 ml-3 hidden whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg group-hover:block group-focus:block">
          Sign out
        </span>
      </button>
    </aside>
  );
}
