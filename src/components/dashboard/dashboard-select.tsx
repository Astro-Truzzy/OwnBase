"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type DashboardSelectOption = {
  value: string;
  label: string;
};

type DashboardSelectProps = {
  label?: string;
  /** Accessible name when there is no visible `label` (e.g. dense grid cells). */
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: DashboardSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  labelClassName?: string;
  id?: string;
  /** Renders a hidden input for native form submission. */
  name?: string;
  disabled?: boolean;
  size?: "default" | "compact";
};

export function DashboardSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  labelClassName,
  id,
  name,
  disabled = false,
  size = "default",
}: DashboardSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const labelId = useId();

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      {label ? (
        <span
          id={labelId}
          className={cn(
            "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </span>
      ) : null}

      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/25 text-left text-foreground shadow-sm backdrop-blur-sm transition",
          size === "compact"
            ? "px-2.5 py-1.5 text-xs"
            : "px-3.5 py-2.5 text-sm",
          "hover:border-primary/30 hover:bg-muted/40",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary/35 bg-muted/45 ring-2 ring-primary/15",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate font-medium">
          {selected?.label ?? placeholder}
        </span>
        <IconChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 max-h-[min(280px,50vh)] overflow-y-auto rounded-xl border border-border/70 bg-popover/98 py-1 shadow-xl shadow-black/8 backdrop-blur-md app-scrollbar dark:border-border/80 dark:bg-card/98 dark:shadow-black/35"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected ? (
                    <IconCheck
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
