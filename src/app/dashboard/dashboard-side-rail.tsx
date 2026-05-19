"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import {
  IconActivity,
  IconBuilding,
  IconBulb,
  IconCreditCard,
  IconFileText,
  IconGitBranch,
  IconLayoutDashboard,
  IconShield,
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
  match: string[];
  /** When set, selects a dashboard home tab via hash (Overview / Repositories / Activity). */
  dashboardTab?: DashboardTabKey;
  /**
   * Disambiguate multiple links that share the same pathname.
   * - `__default__`: active when hash is empty or equals `defaultHashWhenPresent`.
   * - `string`: active only when hash equals this value.
   */
  hashRule?: string | "__default__";
  defaultHashWhenPresent?: string;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      {
        href: "/dashboard#dashboard",
        label: "Dashboard",
        icon: <IconLayoutDashboard className="h-4 w-4" />,
        match: ["/dashboard"],
        dashboardTab: "dashboard",
      },
      {
        href: "/dashboard#portfolio",
        label: "Portfolio",
        icon: <IconBuilding className="h-4 w-4" />,
        match: ["/dashboard"],
        dashboardTab: "portfolio",
      },
      {
        href: "/dashboard#operations",
        label: "Operations",
        icon: <IconActivity className="h-4 w-4" />,
        match: ["/dashboard"],
        dashboardTab: "operations",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        href: "/dashboard/ai",
        label: "Ask AI",
        icon: <IconSparkles className="h-4 w-4" />,
        match: ["/dashboard/ai"],
      },
      {
        href: "/dashboard/organization#reports",
        label: "Reports",
        icon: <IconFileText className="h-4 w-4" />,
        match: ["/dashboard/organization"],
        hashRule: "__default__",
        defaultHashWhenPresent: "reports",
      },
      {
        href: "/dashboard/devs#insights",
        label: "Insights",
        icon: <IconBulb className="h-4 w-4" />,
        match: ["/dashboard/devs"],
        hashRule: "__default__",
        defaultHashWhenPresent: "insights",
      },
      {
        href: "/dashboard/organization#risk",
        label: "Risk Assessment",
        icon: <IconShield className="h-4 w-4" />,
        match: ["/dashboard/organization"],
        hashRule: "risk",
      },
    ],
  },
  {
    title: "Library",
    items: [
      {
        href: "/dashboard/devs#team",
        label: "Team Access",
        icon: <IconUsers className="h-4 w-4" />,
        match: ["/dashboard/devs"],
        hashRule: "team",
      },
      {
        href: "/dashboard#portfolio",
        label: "Repositories",
        icon: <IconGitBranch className="h-4 w-4" />,
        match: ["/dashboard"],
        dashboardTab: "portfolio",
      },
      {
        href: "/dashboard/upload",
        label: "Uploads",
        icon: <IconUpload className="h-4 w-4" />,
        match: ["/dashboard/upload"],
      },
      {
        href: "/dashboard/billing",
        label: "Billing",
        icon: <IconCreditCard className="h-4 w-4" />,
        match: ["/dashboard/billing"],
      },
    ],
  },
];

export function DashboardSideRail() {
  const pathname = usePathname();
  const [hash, setHash] = useState<DashboardTabKey>("dashboard");

  useEffect(() => {
    const readHash = () => {
      if (isDashboardHomePath(pathname)) {
        setHash(readDashboardTabHash());
      } else {
        const raw = window.location.hash.replace("#", "");
        setHash(raw ? (raw as DashboardTabKey) : "dashboard");
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

  function hashMatchesItem(item: NavItem): boolean {
    if (!item.hashRule) return true;
    const rawHash = window.location.hash.replace("#", "");
    if (item.hashRule === "__default__") {
      const canonical = item.defaultHashWhenPresent ?? "";
      return rawHash === "" || rawHash === canonical;
    }
    return rawHash === item.hashRule;
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
                : pathMatchesItem(item) && hashMatchesItem(item);
            return (
              <Link
                key={`${group.title}-${item.label}`}
                href={item.href}
                onClick={
                  item.dashboardTab
                    ? (event) =>
                        handleDashboardTabClick(event, item.dashboardTab!)
                    : undefined
                }
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
