import Image from "next/image";
import { cn } from "@/lib/utils";

/** Square-ish mark — favicons, compact chrome beside the wordmark */
const LOGO_ICON_SRC = "/LOGO/Logo-Icon.png";
/** Horizontal lockup — standalone branding */
const LOGO_LOCKUP_SRC = "/LOGO/Icon-brandname.png";

const ICON_INTRINSIC = { width: 445, height: 352 };
const LOCKUP_INTRINSIC = { width: 953, height: 262 };

export type LogoProps = {
  className?: string;
  /**
   * `mark` — icon asset for tight slots (nav next to “Ownbase”, dashboard rail).
   * `full` — icon + wordmark for standalone branding (footer, auth header, pricing).
   */
  variant?: "mark" | "full";
  priority?: boolean;
  /**
   * Mark only: when false, skips the white “tile” in `.dark` (e.g. loaders, hero on dark bg).
   * Default true — keeps legibility for small marks in chrome.
   */
  withDarkPlate?: boolean;
};

/**
 * Ownbase logos from `public/LOGO/` — icon vs full lockup per context.
 */
export function Logo({
  className,
  variant = "mark",
  priority = false,
  withDarkPlate = true,
}: LogoProps) {
  /** Lockup uses dark ink — float it on a light tile in `.dark` so type stays legible. */
  const darkPlate =
    "dark:rounded-lg dark:bg-white dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/50";

  if (variant === "full") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg",
          darkPlate,
          "dark:px-2.5 dark:py-2",
        )}
      >
        <Image
          src={LOGO_LOCKUP_SRC}
          alt="Ownbase"
          width={LOCKUP_INTRINSIC.width}
          height={LOCKUP_INTRINSIC.height}
          priority={priority}
          quality={92}
          className={cn(
            "h-auto w-auto max-h-9 max-w-[min(100%,15rem)] object-contain object-left sm:max-h-10 sm:max-w-[min(100%,18rem)]",
            className,
          )}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md",
        withDarkPlate && darkPlate,
        withDarkPlate && "dark:p-1",
        className,
      )}
    >
      <Image
        src={LOGO_ICON_SRC}
        alt=""
        width={ICON_INTRINSIC.width}
        height={ICON_INTRINSIC.height}
        priority={priority}
        quality={90}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
