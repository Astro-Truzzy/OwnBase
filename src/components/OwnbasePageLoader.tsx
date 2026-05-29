import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export type OwnbasePageLoaderProps = {
  className?: string;
  /** Vertical space for centering (default fits dashboard content column). */
  minHeightClass?: string;
};

/**
 * Full-route loading state: spinning arc around the Ownbase mark, theme-aware
 * (uses `--primary`, `--border`, `--background` / parent surface colors).
 */
export function OwnbasePageLoader({
  className,
  minHeightClass = "min-h-[min(70dvh,36rem)]",
}: OwnbasePageLoaderProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 bg-background py-12",
        minHeightClass,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
        {/* Static track — visible on light and dark surfaces */}
        <div
          className="absolute inset-0 rounded-full border-[2.5px] border-border"
          aria-hidden
        />
        {/* Active arc */}
        <div
          className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-primary motion-safe:animate-spin"
          style={{ animationDuration: "0.85s", animationTimingFunction: "linear" }}
          aria-hidden
        />
        <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-primary/6 ring-8 ring-primary/10 dark:bg-primary/10 dark:ring-primary/15">
          <Logo
            variant="mark"
            withDarkPlate={false}
            className="h-full w-full max-h-28 max-w-28"
            priority
          />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
