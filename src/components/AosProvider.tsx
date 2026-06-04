"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AosAnimation = "fade-up" | "fade-right" | "fade-left" | "fade-down";

const AosReadyContext = createContext(false);

/** True only after mount — use before spreading {@link aosAttrs}. */
export function useAosReady(): boolean {
  return useContext(AosReadyContext);
}

/** Scroll-reveal attributes; omit on server and during hydration. */
export function aosAttrs(
  ready: boolean,
  animation: AosAnimation,
  options?: { delay?: number | string; duration?: number | string },
): Record<string, string> {
  if (!ready) return {};
  const attrs: Record<string, string> = { "data-aos": animation };
  if (options?.delay != null) attrs["data-aos-delay"] = String(options.delay);
  attrs["data-aos-duration"] = String(options?.duration ?? 500);
  return attrs;
}

export function AosProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;

    const frame = requestAnimationFrame(() => {
      void import("aos").then(({ default: AOS }) => {
        AOS.init({
          duration: 550,
          once: true,
          offset: 48,
          easing: "ease-out-cubic",
        });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [ready]);

  return (
    <AosReadyContext.Provider value={ready}>{children}</AosReadyContext.Provider>
  );
}
