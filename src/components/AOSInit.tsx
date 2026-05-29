"use client";

import { useEffect } from "react";

export function AOSInit() {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafOne: number | null = null;
    let rafTwo: number | null = null;

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

    const scheduleInit = () => {
      // Run only after at least two paint frames + a short buffer.
      // This avoids AOS adding `aos-init` before React hydration completes.
      if (!document.querySelector("[data-aos]")) return;
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          void init();
        }
      }, 450);
    };

    const startWhenSafe = () => {
      rafOne = window.requestAnimationFrame(() => {
        rafTwo = window.requestAnimationFrame(scheduleInit);
      });
    };

    // If document is already complete, defer via RAF + timeout.
    // Otherwise, wait for load, then defer.
    if (document.readyState === "complete") startWhenSafe();
    else window.addEventListener("load", startWhenSafe, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", startWhenSafe);
      if (timeoutId) clearTimeout(timeoutId);
      if (rafOne) cancelAnimationFrame(rafOne);
      if (rafTwo) cancelAnimationFrame(rafTwo);
    };
  }, []);
  return null;
}
