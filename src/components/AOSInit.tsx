"use client";

import { useEffect } from "react";

export function AOSInit() {
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const { default: AOS } = await import("aos");
      if (cancelled) return;
      AOS.init({
        duration: 550,
        once: true,
        offset: 48,
        easing: "ease-out-cubic",
      });
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
