import {
  DASHBOARD_TAB_CHANGED,
  setDashboardTabHash,
  type DashboardTabKey,
} from "./dashboard-tab-hash";
import type { PortfolioFilterKey } from "@/lib/dashboard/searchable-repos";

export const DASHBOARD_PORTFOLIO_FILTER_CHANGED =
  "ownbase:dashboard-portfolio-filter";

export function isDashboardHomePath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

export function parsePortfolioFilterParam(
  value: string | null,
): PortfolioFilterKey | null {
  if (
    value === "critical" ||
    value === "finance" ||
    value === "operations" ||
    value === "security"
  ) {
    return value;
  }
  return null;
}

export function buildDashboardTodoHref(options: {
  tab?: DashboardTabKey;
  portfolioFilter?: PortfolioFilterKey;
  path?: string;
}): string {
  if (options.path) return options.path;
  const tab = options.tab ?? "dashboard";
  const params = new URLSearchParams();
  if (options.portfolioFilter && options.portfolioFilter !== "all") {
    params.set("pf", options.portfolioFilter);
  }
  const qs = params.toString();
  return `/dashboard${qs ? `?${qs}` : ""}#${tab}`;
}

export function dispatchPortfolioFilter(filter: PortfolioFilterKey): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_PORTFOLIO_FILTER_CHANGED, {
      detail: { filter },
    }),
  );
}

export function applyDashboardTodoNavigation(options: {
  dashboardTab?: DashboardTabKey;
  portfolioFilter?: PortfolioFilterKey;
  pathname: string;
  push: (url: string) => void;
}): boolean {
  const { dashboardTab, portfolioFilter, pathname, push } = options;
  if (!dashboardTab) return false;

  const target = buildDashboardTodoHref({
    tab: dashboardTab,
    portfolioFilter,
  });

  if (isDashboardHomePath(pathname)) {
    window.history.replaceState(null, "", target);
    setDashboardTabHash(dashboardTab);
    if (portfolioFilter) {
      dispatchPortfolioFilter(portfolioFilter);
    }
    window.dispatchEvent(
      new CustomEvent(DASHBOARD_TAB_CHANGED, { detail: { tab: dashboardTab } }),
    );
    return true;
  }

  push(target);
  return true;
}
