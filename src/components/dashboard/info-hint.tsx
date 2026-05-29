"use client";

import { useId, useState, type ReactNode } from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type InfoHintProps = {
  /** Accessible name for the trigger (e.g. "About Knowledge Distribution"). */
  label: string;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
  align?: "left" | "right";
};

export function InfoHint({
  label,
  children,
  className,
  iconClassName,
  align = "right",
}: InfoHintProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  function show() {
    setOpen(true);
  }

  function hide(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  return (
    <div
      className={cn("relative shrink-0", className)}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <IconInfoCircle className={cn("h-4 w-4", iconClassName)} aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          role="tooltip"
          className={cn(
            "absolute top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-xs leading-relaxed text-muted-foreground shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
