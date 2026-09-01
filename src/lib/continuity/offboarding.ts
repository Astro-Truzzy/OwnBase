import type { AccessMatrix, MatrixCellModel } from "@/lib/access/access-matrix";
import { cellKey } from "@/lib/access/access-matrix";
import { expiryStateFor } from "./continuity-score";

/**
 * Per-developer offboarding checklist.
 *
 * Half of each step is **derived** from live access data (how many repos the
 * person can still reach, which of those they solely maintain, whether any
 * invitation is still pending) and half is **persisted** in `offboarding_runs`
 * (which steps the owner has ticked). Derived counts are authoritative for the
 * steps that can be verified; the persisted flags cover the steps Ownbase cannot
 * observe, like "handover call done".
 *
 * With no `offboarding_runs` row (or before the migration is applied) the plan
 * still renders accurately from derived data alone — only tick state is lost.
 */

export type OffboardingStepKey =
  | "revoke_access"
  | "reassign_sole_repos"
  | "refresh_summaries"
  | "clear_pending_invites"
  | "export_handoff";

export type OffboardingRunRow = {
  id: string;
  member_id: string | null;
  login: string;
  status: "in_progress" | "completed" | "cancelled";
  steps: Record<string, boolean> | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
};

export type OffboardingStep = {
  key: OffboardingStepKey;
  label: string;
  description: string;
  /** True when Ownbase can verify this step from data. */
  verifiable: boolean;
  /**
   * Derived completion. For verifiable steps this is the truth; for
   * non-verifiable steps it mirrors the owner's tick.
   */
  done: boolean;
  /** The owner ticked this step in `offboarding_runs.steps`. */
  acknowledged: boolean;
  /** Outstanding item count for verifiable steps (0 when clear). */
  outstanding: number;
  /** Repos this step still applies to, for the UI to list. */
  repos: string[];
};

export type OffboardingPlan = {
  login: string;
  displayName: string;
  memberId: string | null;
  run: OffboardingRunRow | null;
  steps: OffboardingStep[];
  /** Repos the person can still reach at all (live or recorded). */
  accessibleRepos: string[];
  /** GitHub repos where this person is the only collaborator. */
  soleMaintainerRepos: string[];
  /** Repos where their grant is recorded but not yet accepted. */
  pendingRepos: string[];
  /** Repos whose grant has already lapsed. */
  expiredRepos: string[];
  /** True when every verifiable step is clear. */
  readyToComplete: boolean;
  completedAt: string | null;
};

const STEP_LABELS: Record<
  OffboardingStepKey,
  { label: string; description: string; verifiable: boolean }
> = {
  revoke_access: {
    label: "Revoke repository access",
    description:
      "Remove the developer from every repository they can still reach.",
    verifiable: true,
  },
  reassign_sole_repos: {
    label: "Reassign sole-maintainer repositories",
    description:
      "Repositories where this person is the only collaborator need a new owner before access is removed.",
    verifiable: true,
  },
  clear_pending_invites: {
    label: "Cancel pending invitations",
    description:
      "Invitations that were never accepted still grant access once accepted.",
    verifiable: true,
  },
  refresh_summaries: {
    label: "Refresh handover documentation",
    description:
      "Regenerate AI summaries for repositories this person maintained so the next owner has current notes.",
    verifiable: false,
  },
  export_handoff: {
    label: "Export handoff pack",
    description:
      "Download the handoff brief and compliance pack as a record of the transition.",
    verifiable: false,
  },
};

/**
 * Count collaborators per repo from the matrix cells, so "sole maintainer" is
 * measured against the same reconciled data the access matrix shows.
 */
function countCollaboratorsByRepo(matrix: AccessMatrix): Map<string, number> {
  const counts = new Map<string, number>();
  for (const cell of matrix.cells) {
    if (cell.level === "none" && !cell.pending) continue;
    counts.set(cell.fullName, (counts.get(cell.fullName) ?? 0) + 1);
  }
  return counts;
}

export function buildOffboardingPlan({
  login,
  matrix,
  run,
  now,
}: {
  login: string;
  matrix: AccessMatrix;
  run: OffboardingRunRow | null;
  now: number;
}): OffboardingPlan {
  const loginKey = login.toLowerCase();
  const person =
    matrix.people.find((p) => p.login.toLowerCase() === loginKey) ?? null;

  const cellIndex = new Map<string, MatrixCellModel>();
  for (const cell of matrix.cells) {
    cellIndex.set(cellKey(cell.login, cell.fullName), cell);
  }

  const collaboratorCounts = countCollaboratorsByRepo(matrix);

  const accessibleRepos: string[] = [];
  const soleMaintainerRepos: string[] = [];
  const pendingRepos: string[] = [];
  const expiredRepos: string[] = [];

  for (const repo of matrix.repos) {
    const cell = cellIndex.get(cellKey(login, repo.fullName));
    if (!cell) continue;
    const hasAccess = cell.level !== "none" || cell.pending;
    if (!hasAccess) continue;

    accessibleRepos.push(repo.fullName);

    if (cell.pending) pendingRepos.push(repo.fullName);
    if (expiryStateFor(cell.expiresAt, now) === "expired") {
      expiredRepos.push(repo.fullName);
    }
    // Sole maintainer only means something on repos Ownbase can act on.
    if (
      repo.provider === "github" &&
      (collaboratorCounts.get(repo.fullName) ?? 0) <= 1
    ) {
      soleMaintainerRepos.push(repo.fullName);
    }
  }

  // Access that can actually be revoked from Ownbase (GitHub columns).
  const revocableRepos = accessibleRepos.filter((fullName) => {
    const repo = matrix.repos.find((r) => r.fullName === fullName);
    return repo?.provider === "github";
  });

  const acknowledged = run?.steps ?? {};
  const outstandingByStep: Record<OffboardingStepKey, string[]> = {
    revoke_access: revocableRepos,
    reassign_sole_repos: soleMaintainerRepos,
    clear_pending_invites: pendingRepos,
    refresh_summaries: [],
    export_handoff: [],
  };

  const steps: OffboardingStep[] = (
    Object.keys(STEP_LABELS) as OffboardingStepKey[]
  ).map((key) => {
    const meta = STEP_LABELS[key];
    const repos = outstandingByStep[key];
    const ticked = acknowledged[key] === true;
    return {
      key,
      label: meta.label,
      description: meta.description,
      verifiable: meta.verifiable,
      outstanding: meta.verifiable ? repos.length : 0,
      repos,
      acknowledged: ticked,
      done: meta.verifiable ? repos.length === 0 : ticked,
    };
  });

  return {
    login: person?.login ?? login,
    displayName: person?.displayName ?? login,
    memberId: person?.memberId ?? run?.member_id ?? null,
    run,
    steps,
    accessibleRepos,
    soleMaintainerRepos,
    pendingRepos,
    expiredRepos,
    readyToComplete: steps.every((s) => s.done),
    completedAt: run?.completed_at ?? null,
  };
}

/** Grants that need the owner's attention, newest expiry first. */
export function buildExpiringAccessQueue({
  matrix,
  now,
}: {
  matrix: AccessMatrix;
  now: number;
}): Array<{
  login: string;
  displayName: string;
  fullName: string;
  owner: string;
  name: string;
  level: MatrixCellModel["level"];
  expiresAt: string;
  state: "expired" | "expiring";
}> {
  const displayNameByLogin = new Map(
    matrix.people.map((p) => [p.login.toLowerCase(), p.displayName] as const),
  );
  const repoByFullName = new Map(
    matrix.repos.map((r) => [r.fullName, r] as const),
  );

  const rows = matrix.cells.flatMap((cell) => {
    if (cell.level === "none" || !cell.expiresAt) return [];
    const state = expiryStateFor(cell.expiresAt, now);
    if (state !== "expired" && state !== "expiring") return [];
    const repo = repoByFullName.get(cell.fullName);
    // Only GitHub grants are actionable from Ownbase.
    if (!repo || repo.provider !== "github") return [];
    return [
      {
        login: cell.login,
        displayName:
          displayNameByLogin.get(cell.login.toLowerCase()) ?? cell.login,
        fullName: cell.fullName,
        owner: repo.owner,
        name: repo.name,
        level: cell.level,
        expiresAt: cell.expiresAt,
        state,
      },
    ];
  });

  return rows.sort(
    (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
  );
}
