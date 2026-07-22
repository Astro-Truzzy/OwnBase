"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconActivity,
  IconChartBar,
  IconCreditCard,
  IconLayoutDashboard,
  IconLogout,
  IconMailForward,
  IconServer,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Overview",
    icon: <IconLayoutDashboard className="h-4 w-4" />,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: <IconUsers className="h-4 w-4" />,
    exact: false,
  },
  {
    href: "/admin/revenue",
    label: "Revenue",
    icon: <IconCreditCard className="h-4 w-4" />,
    exact: false,
  },
  {
    href: "/admin/product",
    label: "Product",
    icon: <IconChartBar className="h-4 w-4" />,
    exact: false,
  },
  {
    href: "/admin/outreach",
    label: "Outreach",
    icon: <IconMailForward className="h-4 w-4" />,
    exact: false,
  },
  {
    href: "/admin/system",
    label: "System",
    icon: <IconServer className="h-4 w-4" />,
    exact: false,
  },
];

export function AdminSideNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[10px] font-bold text-white">
          A
        </span>
        <span className="text-sm font-semibold text-foreground">Admin</span>
        <span className="ml-auto inline-flex items-center rounded-full border border-red-400/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
          Internal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Business
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Quick links
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <IconActivity className="h-4 w-4" />
            My Dashboard
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <p className="truncate px-2 text-xs text-muted-foreground">{email}</p>
        <form method="post" action="/api/admin/auth/logout">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
