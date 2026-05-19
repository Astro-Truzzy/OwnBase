export const WALKTHROUGH_MOBILE_MENU_EVENT = "ownbase-walkthrough:mobile-menu";

export function setWalkthroughMobileMenuOpen(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(WALKTHROUGH_MOBILE_MENU_EVENT, { detail: { open } }),
  );
}
