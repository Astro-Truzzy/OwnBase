export type DashboardWalkthroughTab =
  | "dashboard"
  | "organization"
  | "portfolio"
  | "operations";

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
    body: "This short tour highlights the main areas of Ownbase. You will only see this once.",
    placement: "center",
  },
  {
    id: "tabs",
    target: '[data-tour="dashboard-tabs"]',
    title: "Four main views",
    body: "Switch between Overview, Organization, Repositories, and Activity. Organization is the fastest way to add repos to your workspace.",
    placement: "bottom",
  },
  {
    id: "tab-organization",
    target: '[data-tour="tab-organization"]',
    tab: "organization",
    title: "Organization",
    body: "Browse linked GitHub or GitLab repos and add them to your organization in one click—no need to open each repo hub first.",
    placement: "bottom",
  },
  {
    id: "organization-panel",
    target: '[data-tour="organization-panel"]',
    tab: "organization",
    title: "Add repositories",
    body: "Search, filter by status, and use Add to organization. Tracked repos appear across portfolio health, access maps, and AI tools.",
    placement: "top",
  },
  {
    id: "tab-overview",
    target: '[data-tour="tab-overview"]',
    tab: "dashboard",
    title: "Overview",
    body: "Your home view: portfolio health, documentation coverage, priorities, and the health trend for tracked repositories.",
    placement: "bottom",
  },
  {
    id: "overview-panel",
    target: '[data-tour="overview-panel"]',
    tab: "dashboard",
    title: "Overview metrics",
    body: "These cards and charts reflect your real data. Track repositories under Organization to populate health and activity signals.",
    placement: "top",
  },
  {
    id: "tab-portfolio",
    target: '[data-tour="tab-portfolio"]',
    tab: "portfolio",
    title: "Repositories",
    body: "Browse every repository you have added to your organization, filter by risk, and open detail pages for summaries and access maps.",
    placement: "bottom",
  },
  {
    id: "portfolio-panel",
    target: '[data-tour="portfolio-panel"]',
    tab: "portfolio",
    title: "Repository portfolio",
    body: "Search, filter, and inspect repository health, contributors, and bus factor. Empty until you track your first repo.",
    placement: "top",
  },
  {
    id: "tab-operations",
    target: '[data-tour="tab-operations"]',
    tab: "operations",
    title: "Activity",
    body: "Team composition, access patterns, activity logs, and knowledge-risk signals for operational oversight.",
    placement: "bottom",
  },
  {
    id: "operations-panel",
    target: '[data-tour="operations-panel"]',
    tab: "operations",
    title: "Operations center",
    body: "Review team access, recent activity windows, collaborator changes, and risk indicators as your organization grows.",
    placement: "top",
  },
  {
    id: "side-nav",
    viewport: "desktop",
    target: '[data-tour="side-nav"]',
    title: "Sidebar navigation",
    body: "Jump to Ask AI, Organization, Team Access, Uploads, Billing, and more. Dashboard tabs mirror the Workspace links here.",
    placement: "right",
  },
  {
    id: "mobile-nav",
    viewport: "mobile",
    target: '[data-tour="side-nav"]',
    title: "Navigation on mobile",
    body: "Tap the menu icon to open workspace navigation—Dashboard tabs, Ask AI, Billing, and more. Theme and account options live in the profile menu (top right).",
    placement: "right",
    prepare: "open-mobile-menu",
  },
  {
    id: "finish",
    title: "You are all set",
    body: "Start by connecting a repository under Organization, or upload a project zip. You can replay setup tasks from the checklist on this page.",
    placement: "center",
  },
];
