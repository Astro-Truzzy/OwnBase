"use client";
/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { type ReactNode, useEffect, useRef, useState } from "react";

export const FloatingDock = ({
  items,
  activeHref = null,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: ReactNode; href: string }[];
  activeHref?: string | null;
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} activeHref={activeHref} className={desktopClassName} />
      <FloatingDockMobile items={items} activeHref={activeHref} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  activeHref = null,
  className,
}: {
  items: { title: string; icon: ReactNode; href: string }[];
  activeHref?: string | null;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: {
                      delay: idx * 0.05,
                    },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                >
                  <a
                    href={item.href}
                    key={item.title}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-elevated"
                  >
                    <div className="h-4 w-4">{item.icon}</div>
                  </a>
                </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  activeHref = null,
  className,
}: {
  items: { title: string; icon: ReactNode; href: string }[];
  activeHref?: string | null;
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-4 rounded-2xl bg-surface/90 border border-border px-4 pb-3 md:flex backdrop-blur-sm",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          {...item}
          isActive={activeHref != null && item.href === activeHref}
        />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  isActive = false,
}: {
  mouseX: MotionValue;
  title: string;
  icon: ReactNode;
  href: string;
  isActive?: boolean;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  // When active, use expanded size (same as hover); otherwise follow mouse distance
  const isActiveMotion = useMotionValue(isActive ? 1 : 0);
  useEffect(() => {
    isActiveMotion.set(isActive ? 1 : 0);
  }, [isActive, isActiveMotion]);
  const effectiveDistance = useTransform(
    [distance, isActiveMotion],
    (vals: number[]) => (vals[1]! > 0.5 ? 0 : vals[0]!)
  ) as MotionValue<number>;

  let widthTransform = useTransform(effectiveDistance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(effectiveDistance, [-150, 0, 150], [40, 80, 40]);

  let widthTransformIcon = useTransform(effectiveDistance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(
    effectiveDistance,
    [-150, 0, 150],
    [20, 40, 20],
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full border border-border bg-surface-elevated transition-colors hover:border-accent/50"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-border bg-surface px-2 py-0.5 text-xs whitespace-pre text-foreground shadow-lg"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
