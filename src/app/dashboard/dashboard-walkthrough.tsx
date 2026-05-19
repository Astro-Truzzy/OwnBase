"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import {
  DASHBOARD_WALKTHROUGH_STEPS,
  filterWalkthroughSteps,
  type DashboardWalkthroughStep,
} from "./dashboard-walkthrough-steps";
import { completeDashboardWalkthroughAction } from "./walkthrough-actions";
import { setDashboardTabHash } from "./dashboard-tab-hash";
import { setWalkthroughMobileMenuOpen } from "./walkthrough-events";

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function resolveStepTarget(step: DashboardWalkthroughStep): string | undefined {
  if (step.id !== "mobile-nav") return step.target;
  if (typeof document === "undefined") return step.target;
  const menu = document.querySelector('[data-tour="mobile-nav-menu"]');
  if (menu) return '[data-tour="mobile-nav-menu"]';
  return '[data-tour="mobile-header"]';
}

const SPOTLIGHT_PAD = 10;
const OVERLAY_Z = 10050;

type SpotlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface DashboardWalkthroughProps {
  displayName: string;
}

function applyTabHash(tab: DashboardWalkthroughStep["tab"]) {
  if (!tab || typeof window === "undefined") return;
  const next = tab === "dashboard" ? "dashboard" : tab;
  setDashboardTabHash(next);
}

function measureTarget(selector: string | undefined): SpotlightRect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  const box = el.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) return null;
  return {
    x: Math.max(8, box.left - SPOTLIGHT_PAD),
    y: Math.max(8, box.top - SPOTLIGHT_PAD),
    width: box.width + SPOTLIGHT_PAD * 2,
    height: box.height + SPOTLIGHT_PAD * 2,
  };
}

function tooltipStyle(
  rect: SpotlightRect | null,
  placement: DashboardWalkthroughStep["placement"],
): CSSProperties {
  const margin = 16;
  const maxW = 360;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  if (!rect || placement === "center") {
    return {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: `min(${maxW}px, calc(100vw - 32px))`,
      zIndex: OVERLAY_Z + 2,
    };
  }

  const base: CSSProperties = {
    position: "fixed",
    width: `min(${maxW}px, calc(100vw - 32px))`,
    zIndex: OVERLAY_Z + 2,
  };

  if (placement === "right") {
    const left = Math.min(rect.x + rect.width + margin, vw - maxW - 16);
    const top = Math.min(
      Math.max(16, rect.y + rect.height / 2 - 80),
      vh - 220,
    );
    return { ...base, left, top };
  }

  if (placement === "left") {
    return {
      ...base,
      right: Math.max(16, vw - rect.x + margin),
      top: Math.min(
        Math.max(16, rect.y + rect.height / 2 - 80),
        vh - 220,
      ),
    };
  }

  if (placement === "top") {
    const bottom = Math.max(16, vh - rect.y + margin);
    const left = Math.min(
      Math.max(16, rect.x + rect.width / 2 - maxW / 2),
      vw - maxW - 16,
    );
    return { ...base, left, bottom };
  }

  const top = Math.min(rect.y + rect.height + margin, vh - 220);
  const left = Math.min(
    Math.max(16, rect.x + rect.width / 2 - maxW / 2),
    vw - maxW - 16,
  );
  return { ...base, left, top };
}

export function DashboardWalkthrough({ displayName }: DashboardWalkthroughProps) {
  const isMobile = useIsMobileViewport();
  const steps = useMemo(
    () => filterWalkthroughSteps(DASHBOARD_WALKTHROUGH_STEPS, isMobile),
    [isMobile],
  );
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const maskIdRef = useRef(`tour-mask-${Math.random().toString(36).slice(2, 9)}`);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const isCentered =
    !step.target || step.placement === "center" || targetMissing;

  const refreshSpotlight = useCallback(() => {
    if (!step) return;
    if (step.tab) applyTabHash(step.tab);
    const run = () => {
      const selector = resolveStepTarget(step);
      const measured = measureTarget(selector);
      setSpotlight(measured);
      setTargetMissing(Boolean(selector && !measured));
    };
    if (step.tab || step.prepare === "open-mobile-menu") {
      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });
    } else {
      run();
    }
  }, [step]);

  useEffect(() => {
    setMounted(true);
    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.prepare === "open-mobile-menu") {
      setWalkthroughMobileMenuOpen(true);
    }
    refreshSpotlight();
    return () => {
      if (step.prepare === "open-mobile-menu") {
        setWalkthroughMobileMenuOpen(false);
      }
    };
  }, [open, stepIndex, refreshSpotlight, step]);

  useEffect(() => {
    if (stepIndex >= steps.length && steps.length > 0) {
      setStepIndex(steps.length - 1);
    }
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onResize = () => refreshSpotlight();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, refreshSpotlight]);

  const finish = useCallback(() => {
    startTransition(async () => {
      await completeDashboardWalkthroughAction();
      setOpen(false);
    });
  }, []);

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  if (!mounted || !open || !step) return null;

  const title =
    step.id === "welcome"
      ? `Welcome, ${displayName.split(" ")[0] || displayName}`
      : step.title;

  const tooltip = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-walkthrough-title"
      className="rounded-xl border border-border/70 bg-[#0f1624]/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-md"
      style={tooltipStyle(spotlight, step.placement)}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-primary/90">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <button
          type="button"
          onClick={finish}
          disabled={pending}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          aria-label="Skip tour"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
      <h2
        id="dashboard-walkthrough-title"
        className="text-lg font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {step.body}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={finish}
          disabled={pending}
          className="text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={pending}
              className="rounded-lg border border-border/60 px-4 py-2 text-sm text-foreground transition hover:bg-muted/50 disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-primary/90 to-accent-violet/90 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(34,211,238,0.2)] transition hover:opacity-95 disabled:opacity-50"
          >
            {isLast ? "Get started" : "Next"}
            {!isLast && <IconArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  const overlay = (
    <div className="fixed inset-0" style={{ zIndex: OVERLAY_Z }} aria-hidden={false}>
      {isCentered ? (
        <div className="absolute inset-0 bg-[#070b12]/82 backdrop-blur-md" />
      ) : (
        <>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <mask
                id={maskIdRef.current}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect width="100%" height="100%" fill="white" />
                {spotlight && (
                  <rect
                    x={spotlight.x}
                    y={spotlight.y}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx={12}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
          </svg>
          <div
            className="absolute inset-0 bg-[#070b12]/78 backdrop-blur-[4px]"
            style={{
              mask: `url(#${maskIdRef.current})`,
              WebkitMask: `url(#${maskIdRef.current})`,
            }}
          />
          {spotlight && (
            <div
              className="pointer-events-none absolute rounded-xl ring-2 ring-primary/55 ring-offset-2 ring-offset-[#070b12]/40 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
              style={{
                left: spotlight.x,
                top: spotlight.y,
                width: spotlight.width,
                height: spotlight.height,
              }}
            />
          )}
        </>
      )}
      {tooltip}
    </div>
  );

  return createPortal(overlay, document.body);
}
