import type { GitHubCollaboratorPermission } from "@/lib/github/manage-collaborators";
import type { AccessLevelLabel } from "@/lib/github/types";

/**
 * Ownbase's canonical 4-level access model. This is the single source of truth
 * for mapping between our levels, GitHub collaborator permissions, and the
 * executive-friendly labels already used across the dashboard.
 *
 *   none  ↔ (not a collaborator / remove)
 *   read  ↔ GitHub "pull"  ↔ "View only"
 *   write ↔ GitHub "push"  ↔ "Can edit"
 *   admin ↔ GitHub "admin" ↔ "Full access"
 *
 * GitHub's "maintain" and "triage" collapse into admin/read respectively for
 * display, matching the existing `getAccessLevelLabel` semantics.
 */
export type AccessLevel = "none" | "read" | "write" | "admin";

export const ACCESS_LEVELS: readonly AccessLevel[] = [
  "none",
  "read",
  "write",
  "admin",
];

/** Where a matrix cell's access came from when reconciling live GitHub ⊕ Ownbase. */
export type AccessSource = "live" | "ownbase" | "both";

/** Expiry state for a grant, computed against a stable "now" upstream. */
export type ExpiryState = "active" | "expiring" | "expired";

/** Org-level role labels the owner assigns (not provider permissions). */
export type OrgRole = "admin" | "developer" | "viewer";

/** Lifecycle of an owner-managed member record. */
export type MemberStatus = "invited" | "active" | "removed";

type AccessLevelMeta = {
  value: AccessLevel;
  /** Human label used across the UI. */
  label: string;
  /** Compact label for dense surfaces (matrix cells). */
  shortLabel: string;
  description: string;
  /** GitHub permission this maps to; null for "none" (= remove collaborator). */
  githubPermission: GitHubCollaboratorPermission | null;
};

export const ACCESS_LEVEL_META: Record<AccessLevel, AccessLevelMeta> = {
  none: {
    value: "none",
    label: "No access",
    shortLabel: "None",
    description: "Not a collaborator on this repository.",
    githubPermission: null,
  },
  read: {
    value: "read",
    label: "View only",
    shortLabel: "View",
    description: "Can read and clone. Cannot push changes.",
    githubPermission: "pull",
  },
  write: {
    value: "write",
    label: "Can edit",
    shortLabel: "Edit",
    description: "Can push changes and manage issues and pull requests.",
    githubPermission: "push",
  },
  admin: {
    value: "admin",
    label: "Full access",
    shortLabel: "Full",
    description: "Full administrative control of the repository.",
    githubPermission: "admin",
  },
};

/** Options for the access-level dropdown, in ascending order of privilege. */
export const ACCESS_LEVEL_OPTIONS = ACCESS_LEVELS.map((value) => ({
  value,
  label: ACCESS_LEVEL_META[value].label,
}));

/** Org-level role metadata (owner-assigned labels, not provider permissions). */
export const ORG_ROLE_META: Record<
  OrgRole,
  { value: OrgRole; label: string; description: string }
> = {
  admin: {
    value: "admin",
    label: "Admin",
    description: "Trusted lead — manages people and access across repos.",
  },
  developer: {
    value: "developer",
    label: "Developer",
    description: "Contributes to repositories they are granted access to.",
  },
  viewer: {
    value: "viewer",
    label: "Viewer",
    description: "Read-only stakeholder — sees code but does not contribute.",
  },
};

/** Org-role options for role selectors, most privileged first. */
export const ORG_ROLE_OPTIONS = (["admin", "developer", "viewer"] as const).map(
  (value) => ({ value, label: ORG_ROLE_META[value].label }),
);

/** Map a live GitHub collaborator permission string → our level. */
export function githubPermissionToLevel(
  permission: string | null | undefined,
): AccessLevel {
  switch (permission) {
    case "admin":
    case "maintain":
      return "admin";
    case "push":
      return "write";
    case "pull":
    case "triage":
      return "read";
    default:
      return "none";
  }
}

/** Map our level → the GitHub collaborator permission (null = remove collaborator). */
export function levelToGithubPermission(
  level: AccessLevel,
): GitHubCollaboratorPermission | null {
  return ACCESS_LEVEL_META[level].githubPermission;
}

/** Map the existing executive label (from `getAccessLevelLabel`) → our level. */
export function accessLevelLabelToLevel(label: AccessLevelLabel): AccessLevel {
  switch (label) {
    case "Full access":
      return "admin";
    case "Can edit":
      return "write";
    case "View only":
    default:
      return "read";
  }
}

/** Ordinal rank for comparing privilege (none = 0 … admin = 3). */
export function levelRank(level: AccessLevel): number {
  return ACCESS_LEVELS.indexOf(level);
}

export function isValidAccessLevel(value: string): value is AccessLevel {
  return (ACCESS_LEVELS as readonly string[]).includes(value);
}
