"use client";

import { useId, useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

type ArtProps = {
  reducedMotion: boolean;
  isDark: boolean;
};

function useArtIntro(
  root: RefObject<SVGSVGElement | null>,
  reducedMotion: boolean,
  isDark: boolean,
  setup: (g: typeof gsap) => void,
) {
  useGSAP(
    () => {
      if (!root.current || reducedMotion) return;
      setup(gsap);
    },
    { scope: root, dependencies: [reducedMotion, isDark], revertOnUpdate: true },
  );
}

export function ArtRepos({ reducedMotion, isDark }: ArtProps) {
  const root = useRef<SVGSVGElement>(null);
  const gid = useId().replace(/:/g, "");

  useArtIntro(root, reducedMotion, isDark, (g) => {
    const tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from("[data-ahc='repos-back']", { y: 28, autoAlpha: 0, duration: 0.55, rotate: -2 })
      .from(
        "[data-ahc='repos-front']",
        { x: 36, autoAlpha: 0, duration: 0.6, rotate: 1 },
        "-=0.35",
      )
      .from(
        "[data-ahc='repos-detail'] *",
        { autoAlpha: 0, x: -8, stagger: 0.06, duration: 0.35 },
        "-=0.4",
      )
      .from("[data-ahc='repos-line']", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5 }, "-=0.25");

    g.to("[data-ahc='repos-front']", {
      y: -5,
      duration: 2.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    g.to("[data-ahc='repos-back']", {
      y: 4,
      duration: 2.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  });

  const g1 = isDark ? "rgb(34 211 238 / 0.35)" : "rgb(8 145 178 / 0.22)";
  const g2 = isDark ? "rgb(167 139 250 / 0.2)" : "rgb(125 211 252 / 0.28)";
  const backStroke = isDark ? "rgb(103 232 249 / 0.35)" : "rgb(8 145 178 / 0.4)";
  const frontFill = isDark ? "rgb(15 23 42 / 0.65)" : "rgb(255 255 255 / 0.94)";
  const frontStroke = isDark ? "rgb(148 163 184 / 0.35)" : "rgb(100 116 139 / 0.35)";
  const dot = isDark ? "rgb(34 211 238 / 0.9)" : "rgb(8 145 178 / 0.95)";
  const line1 = isDark ? "rgb(148 163 184 / 0.35)" : "rgb(71 85 105 / 0.35)";
  const line2 = isDark ? "rgb(100 116 139 / 0.4)" : "rgb(100 116 139 / 0.32)";
  const line3 = isDark ? "rgb(100 116 139 / 0.35)" : "rgb(148 163 184 / 0.35)";
  const dash = isDark ? "rgb(34 211 238 / 0.25)" : "rgb(8 145 178 / 0.35)";

  return (
    <svg
      ref={root}
      viewBox="0 0 320 240"
      fill="none"
      className="h-auto w-full max-w-[min(100%,20rem)] opacity-95"
      aria-hidden
    >
      <defs>
        <linearGradient id={`ahc-repos-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={g1} />
          <stop offset="1" stopColor={g2} />
        </linearGradient>
      </defs>
      <g data-ahc="repos-back">
        <rect
          x="24"
          y="40"
          width="200"
          height="140"
          rx="14"
          fill={`url(#ahc-repos-${gid})`}
          stroke={backStroke}
        />
      </g>
      <g data-ahc="repos-front">
        <rect
          x="100"
          y="72"
          width="200"
          height="140"
          rx="14"
          fill={frontFill}
          stroke={frontStroke}
        />
      </g>
      <g data-ahc="repos-detail">
        <circle cx="130" cy="104" r="6" fill={dot} />
        <rect x="148" y="98" width="120" height="10" rx="3" fill={line1} />
        <rect x="148" y="116" width="90" height="8" rx="2" fill={line2} />
        <rect x="148" y="132" width="100" height="8" rx="2" fill={line3} />
      </g>
      <g data-ahc="repos-line">
        <path
          d="M56 188h208"
          stroke={dash}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 10"
        />
      </g>
    </svg>
  );
}

export function ArtShield({ reducedMotion, isDark }: ArtProps) {
  const root = useRef<SVGSVGElement>(null);

  useArtIntro(root, reducedMotion, isDark, (g) => {
    const tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from("[data-ahc='shield-outer']", {
      scale: 0.82,
      autoAlpha: 0,
      duration: 0.55,
      transformOrigin: "160px 120px",
    })
      .from(
        "[data-ahc='shield-inner']",
        { scale: 0.9, autoAlpha: 0, duration: 0.45, transformOrigin: "160px 120px" },
        "-=0.25",
      )
      .from(
        "[data-ahc='shield-check']",
        { scale: 0, autoAlpha: 0, duration: 0.4, transformOrigin: "164px 114px", ease: "back.out(2)" },
        "-=0.2",
      );

    g.to("[data-ahc='shield-outer']", {
      scale: 1.02,
      transformOrigin: "160px 120px",
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  const outerFill = isDark ? "rgb(15 23 42 / 0.55)" : "rgb(255 255 255 / 0.88)";
  const outerStroke = isDark ? "rgb(34 211 238 / 0.45)" : "rgb(8 145 178 / 0.45)";
  const innerFill = isDark ? "rgb(34 211 238 / 0.12)" : "rgb(8 145 178 / 0.1)";
  const checkStroke = isDark ? "rgb(52 211 153 / 0.95)" : "rgb(5 150 105 / 0.95)";

  return (
    <svg
      ref={root}
      viewBox="0 0 320 240"
      fill="none"
      className="h-auto w-full max-w-[min(100%,18rem)] opacity-95"
      aria-hidden
    >
      <g data-ahc="shield-outer">
        <path
          d="M160 28 L248 68 V124 C248 176 200 210 160 224 C120 210 72 176 72 124 V68 Z"
          fill={outerFill}
          stroke={outerStroke}
          strokeWidth="2"
        />
      </g>
      <g data-ahc="shield-inner">
        <path
          d="M160 52 L220 82 V118 C220 154 188 178 160 188 C132 178 100 154 100 118 V82 Z"
          fill={innerFill}
        />
      </g>
      <g data-ahc="shield-check">
        <path
          d="M142 118 L154 130 L186 98"
          stroke={checkStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function ArtUpload({ reducedMotion, isDark }: ArtProps) {
  const root = useRef<SVGSVGElement>(null);

  useArtIntro(root, reducedMotion, isDark, (g) => {
    const tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from("[data-ahc='upload-frame']", {
      y: 22,
      scale: 0.94,
      autoAlpha: 0,
      duration: 0.55,
      transformOrigin: "160px 120px",
    })
      .from("[data-ahc='upload-bar']", { scaleX: 0, transformOrigin: "50% 50%", duration: 0.35 }, "-=0.2")
      .from(
        "[data-ahc='upload-arrow']",
        { y: 16, autoAlpha: 0, duration: 0.45, ease: "power2.out" },
        "-=0.35",
      );

    g.to("[data-ahc='upload-arrow']", {
      y: -8,
      duration: 1.35,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    g.to("[data-ahc='upload-dot']", {
      autoAlpha: 0.35,
      duration: 0.9,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  const frameFill = isDark ? "rgb(15 23 42 / 0.5)" : "rgb(255 255 255 / 0.9)";
  const frameStroke = isDark ? "rgb(167 139 250 / 0.35)" : "rgb(139 92 246 / 0.35)";
  const arrowStroke = isDark ? "rgb(196 181 253 / 0.9)" : "rgb(124 58 237 / 0.85)";
  const barFill = isDark ? "rgb(100 116 139 / 0.35)" : "rgb(148 163 184 / 0.4)";
  const dotFill = isDark ? "rgb(34 211 238 / 0.5)" : "rgb(8 145 178 / 0.55)";

  return (
    <svg
      ref={root}
      viewBox="0 0 320 240"
      fill="none"
      className="h-auto w-full max-w-[min(100%,20rem)] opacity-95"
      aria-hidden
    >
      <g data-ahc="upload-frame">
        <rect
          x="48"
          y="36"
          width="224"
          height="160"
          rx="16"
          fill={frameFill}
          stroke={frameStroke}
        />
      </g>
      <g data-ahc="upload-arrow">
        <path
          d="M160 156 V88 M132 116 L160 88 L188 116"
          stroke={arrowStroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g data-ahc="upload-bar">
        <rect x="96" y="168" width="128" height="12" rx="4" fill={barFill} />
      </g>
      <g data-ahc="upload-dot">
        <circle cx="160" cy="200" r="4" fill={dotFill} />
      </g>
    </svg>
  );
}

export function ArtTeam({ reducedMotion, isDark }: ArtProps) {
  const root = useRef<SVGSVGElement>(null);

  useArtIntro(root, reducedMotion, isDark, (g) => {
    const tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from("[data-ahc='team-orbit'] *", {
      scale: 0,
      autoAlpha: 0,
      stagger: { each: 0.12, from: "center" },
      duration: 0.5,
      ease: "back.out(1.4)",
      transformOrigin: "50% 50%",
    }).from(
      "[data-ahc='team-ground']",
      { scaleX: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.45 },
      "-=0.2",
    );

    g.to("[data-ahc='team-c1']", {
      y: -6,
      duration: 2.2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    g.to("[data-ahc='team-c2']", {
      y: -4,
      duration: 2.6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    g.to("[data-ahc='team-c3']", {
      y: -5,
      duration: 2.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  });

  const c1f = isDark ? "rgb(34 211 238 / 0.15)" : "rgb(8 145 178 / 0.12)";
  const c1s = isDark ? "rgb(34 211 238 / 0.4)" : "rgb(8 145 178 / 0.45)";
  const c2f = isDark ? "rgb(167 139 250 / 0.2)" : "rgb(139 92 246 / 0.14)";
  const c2s = isDark ? "rgb(196 181 253 / 0.45)" : "rgb(124 58 237 / 0.4)";
  const c3f = isDark ? "rgb(52 211 153 / 0.12)" : "rgb(16 185 129 / 0.12)";
  const c3s = isDark ? "rgb(52 211 153 / 0.4)" : "rgb(5 150 105 / 0.42)";
  const ground = isDark ? "rgb(148 163 184 / 0.35)" : "rgb(100 116 139 / 0.35)";

  return (
    <svg
      ref={root}
      viewBox="0 0 320 240"
      fill="none"
      className="h-auto w-full max-w-[min(100%,20rem)] opacity-95"
      aria-hidden
    >
      <g data-ahc="team-orbit">
        <circle
          data-ahc="team-c1"
          cx="110"
          cy="108"
          r="36"
          fill={c1f}
          stroke={c1s}
        />
        <circle
          data-ahc="team-c2"
          cx="160"
          cy="88"
          r="40"
          fill={c2f}
          stroke={c2s}
        />
        <circle
          data-ahc="team-c3"
          cx="210"
          cy="108"
          r="36"
          fill={c3f}
          stroke={c3s}
        />
      </g>
      <g data-ahc="team-ground">
        <path
          d="M88 168c24-20 120-20 144 0"
          stroke={ground}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export type AuthArtKey = "repos" | "shield" | "upload" | "team";

export function AuthArtIllustration({
  artKey,
  reducedMotion,
  isDark,
}: {
  artKey: AuthArtKey;
  reducedMotion: boolean;
  isDark: boolean;
}) {
  switch (artKey) {
    case "repos":
      return <ArtRepos reducedMotion={reducedMotion} isDark={isDark} />;
    case "shield":
      return <ArtShield reducedMotion={reducedMotion} isDark={isDark} />;
    case "upload":
      return <ArtUpload reducedMotion={reducedMotion} isDark={isDark} />;
    case "team":
      return <ArtTeam reducedMotion={reducedMotion} isDark={isDark} />;
    default:
      return null;
  }
}
