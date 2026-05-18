"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";

const STORAGE_KEY = "ownbase-theme";

function readIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

/**
 * Floating light / dark toggle. Syncs `.dark` on `<html>` with localStorage (`ownbase-theme`).
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const isDark = useSyncExternalStore(subscribe, readIsDark, () => false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      try {
        localStorage.setItem(STORAGE_KEY, "light");
      } catch {
        /* ignore */
      }
    } else {
      root.classList.add("dark");
      try {
        localStorage.setItem(STORAGE_KEY, "dark");
      } catch {
        /* ignore */
      }
    }
  }, []);

  if (!mounted) {
    return (
      <div
        className="pointer-events-none fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] z-40 h-11 w-11 rounded-full opacity-0"
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
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-black/40"
    >
      {isDark ? (
        <IconSun className="h-5 w-5" stroke={1.75} aria-hidden />
      ) : (
        <IconMoon className="h-5 w-5" stroke={1.75} aria-hidden />
      )}
    </button>
  );
}
