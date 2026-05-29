"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Logo } from "@/components/Logo";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { DashboardSideRail } from "./dashboard-side-rail";
import { WALKTHROUGH_MOBILE_MENU_EVENT } from "./walkthrough-events";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("DashboardMobileNav components must be used within provider");
  }
  return ctx;
}

export function DashboardMobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onWalkthroughMenu(event: Event) {
      const nextOpen = (event as CustomEvent<{ open?: boolean }>).detail?.open;
      setOpen(Boolean(nextOpen));
    }
    window.addEventListener(WALKTHROUGH_MOBILE_MENU_EVENT, onWalkthroughMenu);
    return () =>
      window.removeEventListener(WALKTHROUGH_MOBILE_MENU_EVENT, onWalkthroughMenu);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
            onClick={close}
          />
          <aside
            data-tour="mobile-nav-drawer"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-sidebar shadow-2xl md:hidden"
            aria-label="Workspace navigation"
          >
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5"
                onClick={close}
              >
                <Logo className="h-8 w-8" />
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Ownbase
                </span>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <IconX className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <DashboardSideRail onItemClick={close} />
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggleButton className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
            </div>
          </aside>
        </>
      )}
    </MobileNavContext.Provider>
  );
}

export function DashboardMobileNavTrigger() {
  const { setOpen } = useMobileNav();

  return (
    <button
      type="button"
      data-tour="mobile-nav-trigger"
      onClick={() => setOpen(true)}
      aria-label="Open navigation menu"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground transition-colors hover:border-primary/35 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
    >
      <IconMenu2 className="h-5 w-5" aria-hidden />
    </button>
  );
}
