"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 50ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string;
  /**
   * Time in milliseconds between gibberish flips for unrevealed characters.
   * Lower is more jittery. Defaults to 50ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";
const FALLBACK_CHAR = "·";

function getRandomChar(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

function buildScramble(original: string, charset: string): string[] {
  if (!original) return [];
  const out: string[] = [];
  for (let i = 0; i < original.length; i += 1) {
    out.push(original[i] === " " ? " " : getRandomChar(charset));
  }
  return out;
}

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [hasMounted, setHasMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [revealCount, setRevealCount] = useState(0);
  const [, setFlipTick] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const lastFlipTimeRef = useRef(0);
  const lastRevealCountRef = useRef(-1);
  const scrambleCharsRef = useRef<string[]>([]);

  const chars = useMemo(() => text.split(""), [text]);
  const totalLength = chars.length;

  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isInView || prefersReducedMotion || totalLength === 0) return;

    scrambleCharsRef.current = buildScramble(text, charset);
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    lastRevealCountRef.current = -1;
    setRevealCount(0);
    setFlipTick(0);

    let cancelled = false;

    const update = (now: number) => {
      if (cancelled) return;

      const elapsed = now - startTimeRef.current;
      const nextReveal = Math.min(
        totalLength,
        Math.floor(elapsed / Math.max(1, revealDelayMs)),
      );

      if (nextReveal !== lastRevealCountRef.current) {
        lastRevealCountRef.current = nextReveal;
        setRevealCount(nextReveal);
      }

      if (nextReveal >= totalLength) return;

      const sinceFlip = now - lastFlipTimeRef.current;
      if (sinceFlip >= Math.max(0, flipDelayMs)) {
        lastFlipTimeRef.current = now;
        const scramble = scrambleCharsRef.current;
        for (let i = nextReveal; i < totalLength; i += 1) {
          scramble[i] = text[i] === " " ? " " : getRandomChar(charset);
        }
        setFlipTick((t) => t + 1);
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
    return () => {
      cancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInView, prefersReducedMotion, text, totalLength, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;

  // Server / initial client: full text to avoid hydration mismatch. Reduced motion: no animation.
  const showFullText = !hasMounted || prefersReducedMotion;
  if (showFullText) {
    return (
      <motion.span
        ref={ref}
        className={cn(className)}
        aria-label={text}
        role="text"
      >
        {chars.map((char, index) => (
          <span key={index} className={revealedClassName}>
            {char}
          </span>
        ))}
      </motion.span>
    );
  }

  // Animated reveal (flipTick forces re-render when scramble flips)
  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      aria-label={text}
      role="text"
    >
      {chars.map((char, index) => {
        const isRevealed = index < revealCount;
        const displayChar = isRevealed
          ? char
          : char === " "
            ? " "
            : (scrambleCharsRef.current[index] ?? FALLBACK_CHAR);

        return (
          <span
            key={index}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
};
