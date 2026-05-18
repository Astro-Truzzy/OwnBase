"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Ensures `#risk`, `#reports`, etc. scroll into view after client navigation,
 * matching side-rail hash links from other routes.
 */
export function OrganizationHashScroll() {
  const pathname = usePathname();
  const isOrgPage =
    pathname === "/dashboard/organization" || pathname === "/dashboard/organization/";

  useEffect(() => {
    if (!isOrgPage) return;

    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el)
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [isOrgPage, pathname]);

  return null;
}
