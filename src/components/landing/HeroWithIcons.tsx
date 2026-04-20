"use client";

import {
  IconFolder,
  IconKey,
  IconLock,
  IconShield,
} from "@tabler/icons-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { HeroIllustration } from "./HeroIllustration";

const HERO_ICONS = [
  { icon: IconLock, label: "Lock" },
  { icon: IconShield, label: "Shield" },
  { icon: IconFolder, label: "Repository" },
  { icon: IconKey, label: "Access" },
] as const;

const STAGGER = 0.08;

export function HeroWithIcons() {
  const iconsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(iconsRef, { once: true, amount: 0.3 });

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl lg:max-w-2xl">
      <div className="w-full">
        <HeroIllustration />
      </div>
      <div
        ref={iconsRef}
        className="flex flex-wrap justify-center gap-6 sm:gap-8"
      >
        {HERO_ICONS.map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{
              duration: 0.4,
              delay: index * STAGGER,
              ease: "easeOut",
            }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-lg border border-border bg-surface/80 text-accent [&_svg]:h-7 [&_svg]:w-7 sm:[&_svg]:h-8 sm:[&_svg]:w-8"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Icon />
            </motion.div>
            <span className="text-sm font-medium text-muted">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
