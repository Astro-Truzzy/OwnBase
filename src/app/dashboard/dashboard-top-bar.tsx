"use client";



import Link from "next/link";


import { useEffect, useRef, useState } from "react";

import {

  IconBuilding,

  IconCreditCard,

  IconChevronDown,

  IconLogout,

  IconSettings,

  IconSparkles,

  IconUpload,

} from "@tabler/icons-react";

import { navigateToServerSignOut } from "@/lib/auth/hard-sign-out";

import { DashboardNotifications } from "./dashboard-notifications";

import { DashboardSearchInput } from "./dashboard-search-input";



type DashboardTopBarProps = {

  displayName: string;

  initials: string;

  email: string | null;

  plan: string | null;

  avatarUrl: string | null;

};



export function DashboardTopBar({

  displayName,

  initials,

  email,

  plan,

  avatarUrl,

}: DashboardTopBarProps) {

  const [menuOpen, setMenuOpen] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {

      if (!menuRef.current?.contains(event.target as Node)) {

        setMenuOpen(false);

      }

    }

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);

  }, [menuOpen]);



  function signOut() {

    setSigningOut(true);

    try {

      navigateToServerSignOut();

    } finally {

      setSigningOut(false);

      setMenuOpen(false);

    }

  }



  const normalizedPlan = (plan ?? "trial").toLowerCase();

  const showUpgrade =

    normalizedPlan !== "pro" && normalizedPlan !== "enterprise";



  return (

    <header className="z-20 shrink-0 border-b border-border bg-[#0a101c]/95 backdrop-blur-md">

      <div className="flex h-14 items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">

        <div className="min-w-0 flex-1">

          {showUpgrade && (

            <Link

              href="/dashboard/billing"

              className="inline-flex rounded-full border border-primary/35 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"

            >

              Upgrade

            </Link>

          )}

        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          <Link

            href="/dashboard/ai"

            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground/90 transition hover:border-primary/30 hover:bg-muted sm:text-sm"

          >

            <IconSparkles className="h-3.5 w-3.5 text-primary" aria-hidden />

            <span className="hidden sm:inline">Ask AI</span>

          </Link>



          <DashboardSearchInput className="hidden min-w-[200px] max-w-xs md:block md:w-56 lg:w-64" />



          <DashboardNotifications />



          <div className="relative" ref={menuRef}>

            <button

              type="button"

              onClick={() => setMenuOpen((o) => !o)}

              aria-expanded={menuOpen}

              aria-haspopup="menu"

              className="flex h-9 items-center gap-1 rounded-full border border-border bg-muted/50 pl-1 pr-1.5 text-foreground ring-offset-background transition hover:border-primary/40 hover:ring-2 hover:ring-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-10 sm:pr-2"

              title={displayName}

            >

              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[11px] font-semibold text-primary sm:h-8 sm:w-8 sm:text-xs">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}

              </span>

              <IconChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />

            </button>



            {menuOpen && (

              <div

                role="menu"

                className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1 shadow-xl shadow-black/40"

              >

                <div className="border-b border-border px-3 py-2.5">

                  <p className="truncate text-sm font-medium text-foreground">

                    {displayName}

                  </p>

                  {email && (

                    <p className="truncate text-xs text-muted-foreground">

                      {email}

                    </p>

                  )}

                </div>

                <Link

                  role="menuitem"

                  href="/dashboard/organization"

                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/80"

                  onClick={() => setMenuOpen(false)}

                >

                  <IconBuilding className="h-4 w-4 text-muted-foreground" />

                  Organization

                </Link>

                <Link

                  role="menuitem"

                  href="/dashboard/upload"

                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/80"

                  onClick={() => setMenuOpen(false)}

                >

                  <IconUpload className="h-4 w-4 text-muted-foreground" />

                  Uploads

                </Link>

                <Link

                  role="menuitem"

                  href="/dashboard/billing"

                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/80"

                  onClick={() => setMenuOpen(false)}

                >

                  <IconCreditCard className="h-4 w-4 text-muted-foreground" />

                  Billing

                </Link>

                <Link

                  role="menuitem"

                  href="/dashboard/settings"

                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/80"

                  onClick={() => setMenuOpen(false)}

                >

                  <IconSettings className="h-4 w-4 text-muted-foreground" />

                  User settings

                </Link>

                <div className="my-1 border-t border-border" />

                <button

                  type="button"

                  role="menuitem"

                  disabled={signingOut}

                  onClick={() => void signOut()}

                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted/80 disabled:opacity-50"

                >

                  <IconLogout className="h-4 w-4 text-muted-foreground" />

                  {signingOut ? "Signing out…" : "Log out"}

                </button>

              </div>

            )}

          </div>

        </div>

      </div>



      <div className="border-t border-border/60 px-4 pb-3 pt-2 md:hidden">

        <DashboardSearchInput />

      </div>

    </header>

  );

}

