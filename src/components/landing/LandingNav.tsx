"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FloatingDock } from "@/components/ui/floating-dock";
import { useActiveSection } from "@/hooks/useActiveSection";
import {
  IconAlertTriangle,
  IconHome2,
  IconLockCheck,
  IconRocket,
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
  "trust",
  "final-cta",
];

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
    title: "Trust",
    href: "#trust",
    icon: <IconLockCheck className="h-full w-full text-muted" />,
  },
  {
    title: "Get started",
    href: "/signup",
    icon: <IconRocket className="h-full w-full text-muted" />,
  },
] as const;

export function LandingNav() {
  const activeId = useActiveSection(SECTION_IDS);
  const activeHref = activeId ? `#${activeId}` : null;

  return (
    <>
      {/* Mobile: compact top bar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Logo className="h-4 w-4" />
          </span>
          Ownbase
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          Sign in
        </Link>
      </header>

      <FloatingDock
        items={[...DOCK_ITEMS]}
        activeHref={activeHref}
        desktopClassName="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 border border-border bg-surface/70 backdrop-blur-md shadow-lg shadow-black/10 dark:shadow-black/30"
        mobileClassName="fixed bottom-5 right-5 z-40"
      />
    </>
  );
}
