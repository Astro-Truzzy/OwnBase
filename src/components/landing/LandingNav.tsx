"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FloatingDock } from "@/components/ui/floating-dock";
import { useActiveSection } from "@/hooks/useActiveSection";
import {
  IconAlertTriangle,
  IconHome2,
  IconLayoutDashboard,
  IconLockCheck,
  IconRocket,
  IconCoins,
  IconRoute,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

const SECTION_IDS = [
  "top",
  "the-problem",
  "the-solution",
  "how-it-works",
  "features",
  "live-dashboard",
  "trust",
  "pricing",
  "final-cta",
];
const LOGIN_DASHBOARD_REDIRECT = "/login?redirectTo=%2Fdashboard";

const DOCK_ITEMS = [
  {
    title: "Top",
    href: "#top",
    icon: <IconHome2 className="h-full w-full text-muted" />,
  },
  {
    title: "The problem",
    href: "#the-problem",
    icon: <IconAlertTriangle className="h-full w-full text-muted" />,
  },
  {
    title: "Solution",
    href: "#the-solution",
    icon: <IconShieldCheck className="h-full w-full text-muted" />,
  },
  {
    title: "How it works",
    href: "#how-it-works",
    icon: <IconRoute className="h-full w-full text-muted" />,
  },
  {
    title: "Features",
    href: "#features",
    icon: <IconSparkles className="h-full w-full text-muted" />,
  },
  {
    title: "Dashboard",
    href: "#live-dashboard",
    icon: <IconLayoutDashboard className="h-full w-full text-muted" />,
  },
  {
    title: "Trust",
    href: "#trust",
    icon: <IconLockCheck className="h-full w-full text-muted" />,
  },
  {
    title: "Pricing",
    href: "#pricing",
    icon: <IconCoins className="h-full w-full text-muted" />,
  },
  {
    title: "Get started",
    href: LOGIN_DASHBOARD_REDIRECT,
    icon: <IconRocket className="h-full w-full text-muted" />,
  },
] as const;

export function LandingNav() {
  const activeId = useActiveSection(SECTION_IDS);
  const activeHref = activeId ? `#${activeId}` : null;

  return (
    <>
      {/* Mobile: compact top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden">
        <Link
          href="/"
          className="flex items-center text-base font-semibold tracking-tight text-foreground"
        >
          <Logo variant="full" className="max-h-7 max-w-44 sm:max-h-8" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            Sign in
          </Link>
          <Link
            href={LOGIN_DASHBOARD_REDIRECT}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Desktop: floating dock */}
      <FloatingDock
        items={[...DOCK_ITEMS]}
        activeHref={activeHref}
        desktopClassName="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 border border-border/80 bg-surface/75 backdrop-blur-md shadow-xl shadow-black/20"
        mobileClassName="fixed bottom-5 right-5 z-40"
      />
    </>
  );
}
