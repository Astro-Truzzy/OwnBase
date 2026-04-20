/**
 * Infers tags for a repository from its name and description.
 * Used to sort and label repos on the dashboard (e.g. Web3, Finance, Service).
 */

export const REPO_TAG_ORDER = [
  "Apps",
  "Blogs",
  "Personal",
  "Web3 & Crypto",
  "Finance",
  "E-commerce",
  "Service",
  "Dev & Tooling",
  "Other",
] as const;

export type RepoTag = (typeof REPO_TAG_ORDER)[number];

/** Keywords (lowercase) that map to each tag. Order matters for primary tag. */
const TAG_KEYWORDS: Record<RepoTag, string[]> = {
  Apps: [
    "app",
    "apps",
    "application",
    "mobile app",
    "webapp",
    "web app",
    "desktop app",
  ],
  Blogs: [
    "blog",
    "blogs",
    "blogging",
    "blog site",
    "cms",
  ],
  Personal: [
    "portfolio",
    "resume",
    "cv",
    "personal site",
    "personal website",
    "about me",
    "landing page",
  ],
  "Web3 & Crypto": [
    "web3",
    "crypto",
    "blockchain",
    "ethereum",
    "defi",
    "de-fi",
    "nft",
    "solidity",
    "token",
    "smart contract",
    "wallet",
    "metamask",
    "dapp",
    "dao",
    "staking",
    "mining",
  ],
  Finance: [
    "finance",
    "trading",
    "payment",
    "payments",
    "investment",
    "banking",
    "fintech",
    "invoice",
    "ledger",
    "stock",
    "exchange",
  ],
  "E-commerce": [
    "ecommerce",
    "e-commerce",
    "shop",
    "store",
    "cart",
    "checkout",
    "marketplace",
    "product",
    "order",
  ],
  Service: [
    "service",
    "saas",
    "platform",
    "api",
    "dashboard",
    "admin",
    "crm",
    "hr",
    "booking",
    "scheduling",
    "management",
  ],
  "Dev & Tooling": [
    "boilerplate",
    "template",
    "starter",
    "cli",
    "tool",
    "library",
    "sdk",
    "framework",
    "plugin",
    "extension",
    "docs",
    "documentation",
  ],
  Other: [],
};

/**
 * Returns tags for a repo based on name and description.
 * First tag is the "primary" (used for sorting); may have multiple tags.
 */
export function getRepoTags(repo: {
  name: string;
  description: string | null;
}): RepoTag[] {
  const text = [repo.name, repo.description].filter(Boolean).join(" ").toLowerCase();
  if (!text.trim()) return ["Other"];

  const matched = new Set<RepoTag>();

  for (const tag of REPO_TAG_ORDER) {
    if (tag === "Other") continue;
    const keywords = TAG_KEYWORDS[tag];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.add(tag);
        break;
      }
    }
  }

  if (matched.size === 0) return ["Other"];

  return [...REPO_TAG_ORDER].filter((t) => matched.has(t));
}

/**
 * Primary tag for sorting (first in list, or "Other").
 */
export function getPrimaryTag(repo: { name: string; description: string | null }): RepoTag {
  return getRepoTags(repo)[0] ?? "Other";
}

/**
 * Sort repos by primary tag (using REPO_TAG_ORDER), then by name within each group.
 */
export function sortReposByTag<T extends { name: string; description: string | null }>(
  repos: T[]
): T[] {
  const order = REPO_TAG_ORDER as unknown as string[];
  return [...repos].sort((a, b) => {
    const tagA = getPrimaryTag(a);
    const tagB = getPrimaryTag(b);
    const i = order.indexOf(tagA);
    const j = order.indexOf(tagB);
    if (i !== j) return i - j;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export interface ReposByTagGroup<T> {
  tag: RepoTag;
  repos: T[];
}

/**
 * Groups repos by primary tag in REPO_TAG_ORDER. Only includes groups that have at least one repo.
 */
export function groupReposByTag<T extends { name: string; description: string | null }>(
  repos: T[]
): ReposByTagGroup<T>[] {
  const sorted = sortReposByTag(repos);
  const groups = new Map<RepoTag, T[]>();
  for (const repo of sorted) {
    const tag = getPrimaryTag(repo);
    const list = groups.get(tag) ?? [];
    list.push(repo);
    groups.set(tag, list);
  }
  return REPO_TAG_ORDER.filter((tag) => (groups.get(tag)?.length ?? 0) > 0).map((tag) => ({
    tag,
    repos: groups.get(tag)!,
  }));
}
