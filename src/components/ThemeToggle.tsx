"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { usePathname } from "next/navigation";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { readThemeMode, toggleThemeWithTransition } from "@/lib/theme";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

function useThemeIsDark() {
  return useSyncExternalStore(
    subscribe,
    () => readThemeMode() === "dark",
    () => false,
  );
}

export type ThemeToggleButtonProps = {
  className?: string;
  iconClassName?: string;
};

/** Shared flip toggle — use in dashboard chrome or custom placements. */
export function ThemeToggleButton({
  className,
  iconClassName = "h-5 w-5",
}: ThemeToggleButtonProps) {
  const [mounted, setMounted] = useState(false);
  const isDark = useThemeIsDark();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleThemeWithTransition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(className, "pointer-events-none opacity-0")}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn("theme-toggle-btn", className)}
    >
      <span
        className={cn("theme-toggle-flip", isDark && "is-dark")}
        aria-hidden
      >
        <span className="theme-toggle-face">
          <IconMoon className={iconClassName} stroke={1.75} />
        </span>
        <span className="theme-toggle-face theme-toggle-face--back">
          <IconSun className={iconClassName} stroke={1.75} />
        </span>
      </span>
    </button>
  );
}

/** Landing / marketing routes — bottom-left floating control. */
export function FloatingThemeToggle() {
  return (
    <ThemeToggleButton className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg shadow-black/10 backdrop-blur-md hover:border-accent/40 hover:bg-accent/10 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-black/40" />
  );
}

/** Root layout helper — dashboard uses its own top-bar toggle instead. */
export function GlobalThemeToggle() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <FloatingThemeToggle />;
}

/** @deprecated Use `GlobalThemeToggle` or `ThemeToggleButton` directly. */
export function ThemeToggle() {
  return <FloatingThemeToggle />;
}
