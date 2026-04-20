"use client";

import { useEffect, useRef, useState } from "react";

export function RevealOnScroll({
  children,
  className = "",
  staggerIndex,
}: {
  children: React.ReactNode;
  className?: string;
  /** 0–6: delay index for staggered reveal animation */
  staggerIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const staggerClass =
    staggerIndex != null && staggerIndex >= 1 && staggerIndex <= 6
      ? `reveal-stagger-${staggerIndex}`
      : "";

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${visible ? "reveal-visible" : ""} ${staggerClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
