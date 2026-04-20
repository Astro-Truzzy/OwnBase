/**
 * Unique Lordicon URLs per slot to avoid repetition across the landing page.
 * Each ID maps to a distinct animation (lock, shield, key, repo, etc.).
 */
const BASE = "https://cdn.lordicon.com";

export const landingIcons = {
  hero: {
    lock: `${BASE}/lewtedlh.json`,
    shield: `${BASE}/jgnvfzqk.json`,
    repo: `${BASE}/lbjtvqiv.json`,
    key: `${BASE}/hnbrjttb.json`,
  },
  problem: {
    noAccess: `${BASE}/lewtedlh.json`,
    hardToHire: `${BASE}/hnbrjttb.json`,
    loseControl: `${BASE}/jgnvfzqk.json`,
    dependency: `${BASE}/lbjtvqiv.json`,
  },
  howItWorks: {
    connect: `${BASE}/hnbrjttb.json`,
    secure: `${BASE}/jgnvfzqk.json`,
    collaborate: `${BASE}/lbjtvqiv.json`,
    control: `${BASE}/lewtedlh.json`,
  },
  features: {
    vault: `${BASE}/lewtedlh.json`,
    accessControl: `${BASE}/hnbrjttb.json`,
    activityLogs: `${BASE}/lbjtvqiv.json`,
    backup: `${BASE}/jgnvfzqk.json`,
    multiProject: `${BASE}/lbjtvqiv.json`,
  },
} as const;

export const ICON_COLORS = "primary:#4a90d9,secondary:#8b92a0";
