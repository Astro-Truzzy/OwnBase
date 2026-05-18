import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { AuthHeroCarousel } from "./auth-hero-carousel";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  /** Larger heading above the form column (e.g. Sign in) */
  title?: string;
};

/** Dark gradient terminals use `#080c14` to match `body` / `--background` in `globals.css` (`.dark`). */

/**
 * Viewport-anchored paint so the gradient cannot “break” at the column split,
 * plus terminal stops that match `bg-background` on `body`.
 */
function AuthShellBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-1 min-h-svh w-full overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          "h-full min-h-svh w-full bg-fixed",
          "bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_32%,#e2e8f0_62%,#cbd5e1_88%,#ffffff_100%)]",
          "lg:bg-[linear-gradient(90deg,#f8fafc_0%,#eef2f7_18%,#e2e8f0_40%,#cbd5e1_62%,#e8eef5_82%,#ffffff_100%)]",
          "dark:bg-[linear-gradient(180deg,#151d2f_0%,#101828_28%,#0c121f_55%,#080c14_100%)]",
          "lg:dark:bg-[linear-gradient(90deg,#151d2f_0%,#121a2a_14%,#0f1623_30%,#0c121f_46%,#0a0f1a_58%,#080c14_72%,#080c14_100%)]",
        )}
      />
      {/* Blobs use fixed + vw so luminance continues across the former “seam” */}
      <div className="absolute left-[-8vw] top-[16%] h-[min(88vh,820px)] w-[min(125vw,960px)] rounded-full bg-cyan-500/11 blur-[128px] dark:bg-cyan-400/7" />
      <div className="absolute left-[32vw] top-[28%] h-[min(78vh,720px)] w-[min(110vw,920px)] -translate-x-1/2 rounded-full bg-violet-500/9 blur-[140px] dark:bg-violet-500/6" />
      <div className="absolute left-[58vw] top-[40%] h-[min(72vh,680px)] w-[min(95vw,800px)] rounded-full bg-indigo-500/7 blur-[120px] dark:bg-indigo-400/5" />
    </div>
  );
}

export function AuthSplitLayout({ children, title }: AuthSplitLayoutProps) {
  return (
    <div
      className={cn(
        "relative isolate flex min-h-svh w-full flex-col bg-background text-foreground",
        "lg:h-svh lg:flex-row lg:overflow-hidden",
      )}
    >
      <AuthShellBackdrop />

      {/* Desktop: fixed viewport height; form scrolls in the right column only */}
      <aside
        className={cn(
          "relative z-2 order-1 w-full shrink-0 bg-transparent",
          "lg:order-0 lg:h-svh lg:min-h-0 lg:min-w-0 lg:flex-1 lg:basis-0 lg:shrink-0 lg:pr-px lg:max-w-[calc(50%+1px)]",
        )}
      >
        <AuthHeroCarousel />
      </aside>

      <div
        className={cn(
          "relative z-2 order-2 flex min-h-0 w-full flex-1 flex-col bg-transparent",
          "lg:order-0 lg:h-svh lg:min-w-0 lg:flex-1 lg:basis-0 lg:shrink-0 lg:-ml-px lg:max-w-[calc(50%+1px)] lg:overflow-y-auto",
        )}
      >
        <div className="mx-auto flex w-full max-w-md flex-col justify-start px-6 py-10 sm:px-10 lg:px-14 lg:py-12 xl:px-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo variant="full" className="max-h-9 sm:max-h-10" />
          </Link>

          {title ? (
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
