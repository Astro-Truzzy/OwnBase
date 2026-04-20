"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  IconActivity,
  IconBuilding,
  IconBulb,
  IconFileText,
  IconGitBranch,
  IconLayoutDashboard,
  IconSettings,
  IconShield,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match: string[];
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/dashboard#dashboard",
        label: "Dashboard",
        icon: <IconLayoutDashboard className="h-4 w-4" />,
        match: ["/dashboard"],
      },
      {
        href: "/dashboard#portfolio",
        label: "Portfolio",
        icon: <IconBuilding className="h-4 w-4" />,
        match: ["/dashboard"],
      },
      {
        href: "/dashboard#operations",
        label: "Operations",
        icon: <IconActivity className="h-4 w-4" />,
        match: ["/dashboard"],
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        href: "/dashboard/organization",
        label: "Reports",
        icon: <IconFileText className="h-4 w-4" />,
        match: ["/dashboard/organization"],
      },
      {
        href: "/dashboard/devs",
        label: "Insights",
        icon: <IconBulb className="h-4 w-4" />,
        match: ["/dashboard/devs"],
      },
      {
        href: "/dashboard/organization",
        label: "Risk Assessment",
        icon: <IconShield className="h-4 w-4" />,
        match: ["/dashboard/organization"],
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        href: "/dashboard/devs",
        label: "Team Access",
        icon: <IconUsers className="h-4 w-4" />,
        match: ["/dashboard/devs"],
      },
      {
        href: "/dashboard",
        label: "Repositories",
        icon: <IconGitBranch className="h-4 w-4" />,
        match: ["/dashboard", "/dashboard/repo"],
      },
      {
        href: "/dashboard/upload",
        label: "Uploads",
        icon: <IconUpload className="h-4 w-4" />,
        match: ["/dashboard/upload"],
      },
      {
        href: "/dashboard/billing",
        label: "Settings",
        icon: <IconSettings className="h-4 w-4" />,
        match: ["/dashboard/billing"],
      },
    ],
  },
];

export function DashboardSideRail() {
  const pathname = usePathname();
  const [hash, setHash] = useState<string>("dashboard");

  useEffect(() => {
    const readHash = () => {
      const h = window.location.hash.replace("#", "");
      setHash(h || "dashboard");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  return (
    <nav className="flex-1 overflow-y-auto p-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-6 last:mb-0">
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted">
            {group.title}
          </div>
          {group.items.map((item) => {
            const isDashboardTab =
              pathname === "/dashboard" &&
              (item.label === "Dashboard" || item.label === "Portfolio" || item.label === "Operations");
            const isActive = isDashboardTab
              ? (item.label === "Dashboard" && hash === "dashboard") ||
                (item.label === "Portfolio" && hash === "portfolio") ||
                (item.label === "Operations" && hash === "operations")
              : item.match.some((m) =>
                  m === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(m)
                );
            return (
              <Link
                key={`${group.title}-${item.label}`}
                href={item.href}
                className={cn(
                  "mt-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground/90 hover:bg-background/60"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
