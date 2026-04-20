"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import {
  IconLayoutDashboard,
  IconUpload,
  IconLogout,
  IconFolder,
  IconBuilding,
  IconBuildingCommunity,
  IconUsersGroup,
  IconCreditCard,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

export interface RecentDockItem {
  href: string;
  title: string;
}

interface DashboardFloatingDockProps {
  recentItems?: RecentDockItem[];
}

const QUICK_ACTIONS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/dashboard", label: "Dashboard", icon: <IconLayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/organization", label: "Organization", icon: <IconBuildingCommunity className="h-5 w-5" /> },
  { href: "/dashboard/devs", label: "Devs", icon: <IconUsersGroup className="h-5 w-5" /> },
  { href: "/dashboard/upload", label: "Upload", icon: <IconUpload className="h-5 w-5" /> },
  { href: "/dashboard/billing", label: "Billing", icon: <IconCreditCard className="h-5 w-5" /> },
];

export function DashboardFloatingDock({ recentItems = [] }: DashboardFloatingDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mouseY = useMotionValue(Infinity);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  const recent = recentItems.slice(0, 6);

  return (
    <motion.aside
      onMouseMove={(e) => mouseY.set(e.pageY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className={cn(
        "fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 rounded-2xl border border-border bg-surface/90 px-2.5 py-3 backdrop-blur-md md:flex",
        "shadow-lg shadow-black/5"
      )}
      aria-label="Quick actions & recent"
    >
      <Link href="/dashboard">
        <DockIcon
          mouseY={mouseY}
          title="Ownbase"
          icon={<IconBuilding className="h-5 w-5" />}
          isActive={pathname === "/dashboard"}
        />
      </Link>

      {QUICK_ACTIONS.map((item) => (
        <Link key={item.href} href={item.href}>
          <DockIcon
            mouseY={mouseY}
            title={item.label}
            icon={item.icon}
            isActive={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
          />
        </Link>
      ))}

      {recent.length > 0 && (
        <>
          <div className="my-1 h-px w-8 shrink-0 bg-border" aria-hidden />
          {recent.map((r) => (
            <Link key={r.href + r.title} href={r.href}>
              <DockIcon
                mouseY={mouseY}
                title={r.title}
                icon={<IconFolder className="h-5 w-5" />}
                isActive={pathname === r.href}
              />
            </Link>
          ))}
        </>
      )}

      <div className="my-1 h-px w-8 shrink-0 bg-border" aria-hidden />
      <DockIconButton
        mouseY={mouseY}
        title="Sign out"
        icon={<IconLogout className="h-5 w-5" />}
        onClick={signOut}
        variant="danger"
      />
    </motion.aside>
  );
}

function DockIcon({
  mouseY,
  title,
  icon,
  isActive = false,
}: {
  mouseY: MotionValue<number>;
  title: string;
  icon: ReactNode;
  isActive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseY, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  const isActiveMotion = useMotionValue(isActive ? 1 : 0);
  useEffect(() => {
    isActiveMotion.set(isActive ? 1 : 0);
  }, [isActive, isActiveMotion]);

  const effectiveDistance = useTransform(
    [distance, isActiveMotion],
    (vals: number[]) => (vals[1]! > 0.5 ? 0 : vals[0]!)
  ) as MotionValue<number>;

  const sizeTransform = useTransform(effectiveDistance, [-120, 0, 120], [40, 56, 40]);
  const iconSizeTransform = useTransform(effectiveDistance, [-120, 0, 120], [20, 28, 20]);

  const width = useSpring(sizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(sizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(iconSizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(iconSizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-xl border transition-colors",
        isActive
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border bg-surface-elevated text-muted hover:border-accent/40 hover:text-foreground"
      )}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 12 }}
            exit={{ opacity: 0, x: 8 }}
            className="absolute left-full z-10 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg"
          >
            {title}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span style={{ width: widthIcon, height: heightIcon }} className="flex items-center justify-center">
        {icon}
      </motion.span>
    </motion.div>
  );
}

function DockIconButton({
  mouseY,
  title,
  icon,
  onClick,
  variant = "default",
}: {
  mouseY: MotionValue<number>;
  title: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseY, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });
  const sizeTransform = useTransform(distance, [-120, 0, 120], [40, 56, 40]);
  const iconSizeTransform = useTransform(distance, [-120, 0, 120], [20, 28, 20]);

  const width = useSpring(sizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(sizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(iconSizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const heightIcon = useSpring(iconSizeTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer appearance-none border-0 bg-transparent p-0"
      aria-label={title}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-xl border transition-colors",
          variant === "danger"
            ? "border-border bg-surface-elevated text-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            : "border-border bg-surface-elevated text-muted hover:border-accent/40 hover:text-foreground"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 12 }}
              exit={{ opacity: 0, x: 8 }}
              className="absolute left-full z-10 whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg"
            >
              {title}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span style={{ width: widthIcon, height: heightIcon }} className="flex items-center justify-center">
          {icon}
        </motion.span>
      </motion.div>
    </button>
  );
}
