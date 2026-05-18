"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

function readDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/** True when `<html>` has `.dark` (respects ThemeToggle). */
export function useHtmlDark(): boolean {
  return useSyncExternalStore(subscribe, readDark, () => false);
}
