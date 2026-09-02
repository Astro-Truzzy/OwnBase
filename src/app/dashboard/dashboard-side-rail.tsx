"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import {
  IconBuilding,
  IconCreditCard,
  IconGitBranch,
  IconHistory,
  IconLayoutDashboard,
  IconShieldCheck,
  IconSparkles,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_TAB_CHANGED,
  isDashboardHomePath,
  readDashboardTabHash,
  setDashboardTabHash,
  type DashboardTabKey,
} from "./dashboard-tab-hash";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  navId: string;
  match: string[];
  dashboardTab?: DashboardTabKey;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Work",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: <IconLayoutDashboard className="h-4 w-4" />,
        navId: "overview",
        match: ["/dashboard"],
        dashboardTab: "dashboard",
      },
      {
        href: "/dashboard#portfolio",
        label: "Repositories",
        icon: <IconGitBranch className="h-4 w-4" />,
        navId: "repositories",
        match: ["/dashboard"],
        dashboardTab: "portfolio",
      },
      {
        href: "/dashboard/organization",
        label: "Organization",
        icon: <IconBuilding className="h-4 w-4" />,
        navId: "organization",
        match: ["/dashboard/organization"],
      },
      {
        href: "/dashboard/devs",
        label: "Team & Access",
        icon: <IconUsers className="h-4 w-4" />,
        navId: "team",
        match: ["/dashboard/devs"],
      },
      {
        href: "/dashboard/activity",
        label: "Activity Log",
        icon: <IconHistory className="h-4 w-4" />,
        navId: "activity",
        match: ["/dashboard/activity"],
      },
      {
        href: "/dashboard/continuity",
        label: "Continuity",
        icon: <IconShieldCheck className="h-4 w-4" />,
        navId: "continuity",
        match: ["/dashboard/continuity"],
      },
      {
        href: "/dashboard/ai",
        label: "AI Insights",
        icon: <IconSparkles className="h-4 w-4" />,
        navId: "ai-insights",
        match: ["/dashboard/ai"],
      },
      {
        href: "/dashboard/upload",
        label: "Uploads",
        icon: <IconUpload className="h-4 w-4" />,
        navId: "uploads",
        match: ["/dashboard/upload"],
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        href: "/dashboard/billing",
        label: "Billing",
        icon: <IconCreditCard className="h-4 w-4" />,
        navId: "billing",
        match: ["/dashboard/billing"],
      },
    ],
  },
];

export function DashboardSideRail({ onItemClick }: { onItemClick?: () => void } = {}) {
  const pathname = usePathname();
  const [hash, setHash] = useState<DashboardTabKey>("dashboard");

  useEffect(() => {
    const readHash = () => {
      if (isDashboardHomePath(pathname)) {
        setHash(readDashboardTabHash());
      } else {
        setHash("dashboard");
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener(DASHBOARD_TAB_CHANGED, readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener(DASHBOARD_TAB_CHANGED, readHash);
    };
  }, [pathname]);

  function pathMatchesItem(item: NavItem): boolean {
    return item.match.some((m) =>
      m === "/dashboard"
        ? isDashboardHomePath(pathname)
        : pathname.startsWith(m),
    );
  }

  function handleDashboardTabClick(
    event: MouseEvent<HTMLAnchorElement>,
    tab: DashboardTabKey,
  ) {
    if (!isDashboardHomePath(pathname)) return;
    event.preventDefault();
    setDashboardTabHash(tab);
  }

  return (
    <nav
      data-tour="side-nav"
      className="app-scrollbar flex-1 overflow-y-auto px-3 py-4"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-6 last:mb-0">
          <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">
            {group.title}
          </div>
          {group.items.map((item) => {
            const onDashboardHome = isDashboardHomePath(pathname);
            const isActive =
              onDashboardHome && item.dashboardTab
                ? hash === item.dashboardTab
                : pathMatchesItem(item);
            return (
              <Link
                key={item.navId}
                href={item.href}
                onClick={(event) => {
                  if (item.dashboardTab) {
                    handleDashboardTabClick(event, item.dashboardTab);
                  }
                  onItemClick?.();
                }}
                className={cn(
                  "group relative mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-muted/70 font-semibold text-foreground before:absolute before:left-0 before:top-1/2 before:h-[55%] before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-muted/45 hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
