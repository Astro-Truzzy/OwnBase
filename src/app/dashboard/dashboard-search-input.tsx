"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useDashboardSearch } from "./dashboard-search-context";

type DashboardSearchInputProps = {
  className?: string;
  inputClassName?: string;
};

function isDashboardHome(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

export function DashboardSearchInput({
  className,
  inputClassName,
}: DashboardSearchInputProps) {
  const pathname = usePathname();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredRepos,
    openSearchOnDashboard,
    isSearchActive,
  } = useDashboardSearch();

  const onDashboard = isDashboardHome(pathname);
  const showResults = open && isSearchActive;

  const closeResults = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!showResults) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeResults();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showResults, closeResults]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery, filteredRepos.length]);

  function handleSubmit() {
    if (!isSearchActive) return;
    if (!onDashboard) {
      openSearchOnDashboard();
      closeResults();
      return;
    }
    if (filteredRepos.length === 1) {
      closeResults();
      window.location.href = filteredRepos[0].detailHref;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="relative block">
        <span className="sr-only">Search repositories</span>
        <IconSearch
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              clearSearch();
              closeResults();
              inputRef.current?.blur();
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (
                activeIndex >= 0 &&
                activeIndex < filteredRepos.length &&
                filteredRepos[activeIndex]
              ) {
                closeResults();
                window.location.href = filteredRepos[activeIndex].detailHref;
                return;
              }
              handleSubmit();
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((i) =>
                filteredRepos.length === 0
                  ? -1
                  : Math.min(i + 1, filteredRepos.length - 1),
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, -1));
            }
          }}
          placeholder="Search repositories…"
          className={cn(
            "h-9 w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30",
            inputClassName,
          )}
          autoComplete="off"
        />
      </label>

      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/40"
        >
          {filteredRepos.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No repositories match &ldquo;{searchQuery.trim()}&rdquo;.
              {!onDashboard && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      openSearchOnDashboard();
                      closeResults();
                    }}
                  >
                    Open dashboard search
                  </button>
                </>
              )}
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {filteredRepos.slice(0, 8).map((repo, index) => (
                <li key={repo.id} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={repo.detailHref}
                    className={cn(
                      "block px-3 py-2.5 transition-colors hover:bg-muted/80",
                      index === activeIndex && "bg-muted/80",
                    )}
                    onClick={closeResults}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {repo.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {repo.fullName}
                    </p>
                  </Link>
                </li>
              ))}
              {filteredRepos.length > 8 && (
                <li className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  {filteredRepos.length - 8} more — press Enter to view all on
                  dashboard
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
