"use client";

import { forwardRef, useEffect, useImperativeHandle, useId, useRef, useState } from "react";

const LORDICON_SCRIPT = "https://cdn.lordicon.com/lordicon.js";

type LordIconProps = {
  src: string;
  trigger?: "hover" | "click" | "loop" | "in" | "loop-on-hover" | "none";
  colors?: string;
  size?: number;
  stroke?: "light" | "regular" | "bold";
  className?: string;
  /** When true, play once when the icon scrolls into view (and on card hover via ref.play()). */
  playWhenVisible?: boolean;
};

export type LordIconRef = { play: () => void };

export const LordIcon = forwardRef<LordIconRef, LordIconProps>(function LordIcon(
  {
    src,
    trigger = "hover",
    colors,
    size = 80,
    stroke = "regular",
    className = "",
    playWhenVisible = false,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const playRef = useRef<() => void>(() => {});
  const [mounted, setMounted] = useState(false);
  const uniqueId = useId();

  const play = () => {
    const el = elementRef.current;
    if (!el) return;
    const player = (el as unknown as { playerInstance?: { play?: () => void } }).playerInstance;
    if (player?.play) player.play();
  };
  playRef.current = play;

  useImperativeHandle(ref, () => ({ play }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let el: HTMLElement | null = null;

    async function mount() {
      if (!customElements.get("lord-icon")) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = LORDICON_SCRIPT;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Lordicon script failed to load"));
          document.head.appendChild(script);
        });
        await customElements.whenDefined("lord-icon");
      }

      el = document.createElement("lord-icon") as HTMLElement;
      el.setAttribute("id", `lordicon-${uniqueId.replace(/:/g, "")}`);
      el.setAttribute("src", src);
      el.setAttribute("trigger", trigger);
      el.setAttribute("stroke", stroke);
      if (colors) el.setAttribute("colors", colors);
      (el as HTMLElement).style.width = `${size}px`;
      (el as HTMLElement).style.height = `${size}px`;
      if (containerRef.current) {
        containerRef.current.appendChild(el);
        elementRef.current = el;
        setMounted(true);
      }
    }

    mount();
    return () => {
      const c = containerRef.current;
      if (el && c?.contains(el)) c.removeChild(el);
      elementRef.current = null;
      setMounted(false);
    };
  }, [src, trigger, colors, size, stroke]);

  useEffect(() => {
    if (!playWhenVisible || !mounted || !containerRef.current) return;
    const container = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) playRef.current();
      },
      { threshold: 0.2, rootMargin: "0px 0px -20px 0px" }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [playWhenVisible, mounted]);

  return (
    <div
      ref={containerRef}
      id={`lordicon-container-${uniqueId.replace(/:/g, "")}`}
      className={className}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
});
