"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  filterSearchableRepos,
  type SearchableRepo,
} from "@/lib/dashboard/searchable-repos";

export type { SearchableRepo };

type DashboardSearchContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  clearSearch: () => void;
  searchableRepos: SearchableRepo[];
  setSearchableRepos: (repos: SearchableRepo[]) => void;
  filteredRepos: SearchableRepo[];
  openSearchOnDashboard: (query?: string) => void;
  isSearchActive: boolean;
};

const DashboardSearchContext = createContext<DashboardSearchContextValue | null>(
  null,
);

function isDashboardHome(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQueryState] = useState("");
  const [searchableRepos, setSearchableReposState] = useState<SearchableRepo[]>(
    [],
  );
  const remoteFetchStarted = useRef(false);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearchQueryState((prev) => (prev === q ? prev : q));
  }, [searchParams]);

  const syncQueryToUrl = useCallback(
    (query: string) => {
      if (!isDashboardHome(pathname)) return;
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = query.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const next = params.toString();
      const hash =
        typeof window !== "undefined" ? window.location.hash : "#dashboard";
      const target = next ? `/dashboard?${next}${hash}` : `/dashboard${hash}`;
      const current =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : "";
      if (target !== current) {
        router.replace(target, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  const setSearchQuery = useCallback(
    (value: string) => {
      setSearchQueryState(value);
      syncQueryToUrl(value);
    },
    [syncQueryToUrl],
  );

  const clearSearch = useCallback(() => {
    setSearchQueryState("");
    syncQueryToUrl("");
  }, [syncQueryToUrl]);

  const setSearchableRepos = useCallback((repos: SearchableRepo[]) => {
    setSearchableReposState(repos);
    remoteFetchStarted.current = false;
  }, []);

  const openSearchOnDashboard = useCallback(
    (query?: string) => {
      const trimmed = (query ?? searchQuery).trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      router.push(`/dashboard${suffix}#portfolio`);
    },
    [router, searchQuery],
  );

  useEffect(() => {
    if (searchableRepos.length > 0 || remoteFetchStarted.current) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    remoteFetchStarted.current = true;
    let cancelled = false;

    void fetch("/api/dashboard/repos", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { repos?: SearchableRepo[] };
      })
      .then((data) => {
        if (cancelled || !data?.repos?.length) return;
        setSearchableReposState(data.repos);
      })
      .catch(() => {
        remoteFetchStarted.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, searchableRepos.length]);

  const filteredRepos = useMemo(
    () => filterSearchableRepos(searchableRepos, searchQuery),
    [searchableRepos, searchQuery],
  );

  const isSearchActive = searchQuery.trim().length > 0;

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      clearSearch,
      searchableRepos,
      setSearchableRepos,
      filteredRepos,
      openSearchOnDashboard,
      isSearchActive,
    }),
    [
      searchQuery,
      setSearchQuery,
      clearSearch,
      searchableRepos,
      setSearchableRepos,
      filteredRepos,
      openSearchOnDashboard,
      isSearchActive,
    ],
  );

  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch(): DashboardSearchContextValue {
  const ctx = useContext(DashboardSearchContext);
  if (!ctx) {
    throw new Error(
      "useDashboardSearch must be used within DashboardSearchProvider",
    );
  }
  return ctx;
}
