export type DashboardWalkthroughTab = "dashboard" | "portfolio";

export type DashboardWalkthroughViewport = "desktop" | "mobile";

export interface DashboardWalkthroughStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector for `[data-tour="…"]`. Omit for centered modal steps. */
  target?: string;
  tab?: DashboardWalkthroughTab;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** Omit to show on all viewports. */
  viewport?: DashboardWalkthroughViewport;
  /** Run before measuring the target (e.g. open mobile profile menu). */
  prepare?: "open-mobile-menu";
}

export function filterWalkthroughSteps(
  steps: DashboardWalkthroughStep[],
  isMobile: boolean,
): DashboardWalkthroughStep[] {
  return steps.filter(
    (step) =>
      !step.viewport ||
      step.viewport === (isMobile ? "mobile" : "desktop"),
  );
}

export const DASHBOARD_WALKTHROUGH_STEPS: DashboardWalkthroughStep[] = [
  {
    id: "welcome",
    title: "Welcome to your dashboard",
    body: "This short tour covers the three places you will use most: Overview, Organization, and the sidebar.",
    placement: "center",
  },
  {
    id: "overview-panel",
    target: '[data-tour="overview-panel"]',
    tab: "dashboard",
    title: "Overview",
    body: "Activity score, next steps, and your repositories live here. Open a repo for summaries and access, or follow a next step to finish setup.",
    placement: "top",
  },
  {
    id: "side-nav",
    viewport: "desktop",
    target: '[data-tour="side-nav"]',
    title: "Sidebar",
    body: "Overview and Repositories stay on this page. Organization is where you add repos. Team, Uploads, and Billing are in the sidebar. Ask AI is in the top bar.",
    placement: "right",
  },
  {
    id: "mobile-nav",
    viewport: "mobile",
    target: '[data-tour="side-nav"]',
    title: "Navigation on mobile",
    body: "Tap the menu to open Overview, Repositories, Organization, Team, and more. Account options live in the profile menu (top right).",
    placement: "right",
    prepare: "open-mobile-menu",
  },
  {
    id: "finish",
    title: "You are all set",
    body: "Start in Organization to add a repository, or follow the checklist on this page. You will only see this tour once.",
    placement: "center",
  },
];
