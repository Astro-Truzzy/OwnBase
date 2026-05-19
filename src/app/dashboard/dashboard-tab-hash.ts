export type DashboardTabKey = "dashboard" | "portfolio" | "operations";

export const DASHBOARD_TAB_CHANGED = "ownbase:dashboard-tab-changed";

export function isDashboardHomePath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

export function hashToDashboardTab(hash: string): DashboardTabKey {
  if (hash === "portfolio") return "portfolio";
  if (hash === "operations") return "operations";
  return "dashboard";
}

export function readDashboardTabHash(): DashboardTabKey {
  if (typeof window === "undefined") return "dashboard";
  return hashToDashboardTab(window.location.hash.replace("#", ""));
}

/** Sets the URL hash and notifies tab listeners (covers App Router same-route nav). */
export function setDashboardTabHash(tab: DashboardTabKey): void {
  if (typeof window === "undefined") return;
  if (window.location.hash.replace("#", "") !== tab) {
    window.location.hash = tab;
  }
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_TAB_CHANGED, { detail: { tab } }),
  );
}
