export const THEME_STORAGE_KEY = "ownbase-theme";

export type ThemeMode = "light" | "dark";

const THEME_BG: Record<ThemeMode, string> = {
  light: "#ffffff",
  dark: "#080c14",
};

export function readThemeMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

function spreadRadius(origin: { x: number; y: number }) {
  return Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateViewTransitionSpread(
  origin: { x: number; y: number },
  apply: () => void,
) {
  const doc = document as Document & {
    startViewTransition?: (updateCallback: () => void) => {
      ready: Promise<void>;
    };
  };

  const transition = doc.startViewTransition!(apply);
  const endRadius = spreadRadius(origin);

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${endRadius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: 550,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      /* transition aborted — theme still applied */
    });
}

function animateOverlaySpread(
  origin: { x: number; y: number },
  nextMode: ThemeMode,
  apply: () => void,
) {
  const endRadius = spreadRadius(origin);
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.className = "theme-transition-overlay";
  overlay.style.background = THEME_BG[nextMode];
  overlay.style.clipPath = `circle(0px at ${origin.x}px ${origin.y}px)`;
  document.body.appendChild(overlay);

  const finish = () => {
    apply();
    overlay.remove();
  };

  const anim = overlay.animate(
    {
      clipPath: [
        `circle(0px at ${origin.x}px ${origin.y}px)`,
        `circle(${endRadius}px at ${origin.x}px ${origin.y}px)`,
      ],
    },
    { duration: 550, easing: "ease-in-out", fill: "forwards" },
  );

  anim.onfinish = finish;
  anim.oncancel = finish;
}

/** Toggle theme with a circular spread from `origin` (usually the toggle button). */
export function toggleThemeWithTransition(origin: { x: number; y: number }) {
  const nextMode: ThemeMode = readThemeMode() === "dark" ? "light" : "dark";
  const apply = () => applyThemeMode(nextMode);

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (updateCallback: () => void) => {
      ready: Promise<void>;
    };
  };

  if (typeof doc.startViewTransition === "function") {
    animateViewTransitionSpread(origin, apply);
    return;
  }

  animateOverlaySpread(origin, nextMode, apply);
}
