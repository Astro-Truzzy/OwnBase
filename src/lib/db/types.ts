/**
 * Types for AI-generated executive summaries stored in Supabase.
 */

export interface ExecutiveSummary {
  /** 3–5 sentence plain-language summary */
  summary: string;
  /** Core features/capabilities (business terms) */
  keyComponents: string[];
  /** Payment-related integrations detected */
  paymentIntegrations: string[];
  /** Auth method(s) in simple terms */
  authentication: string[];
  /** Third-party services (APIs, databases, etc.) */
  externalServices: string[];
  /** Basic risk indicators (e.g. "No README", "Many external APIs") */
  riskIndicators: string[];
  /**
   * How to run the project locally: clone, install, env, dev server, tests.
   * Plain text; no secret values. Filled by AI from README / manifests when possible.
   */
  localSetup?: string;
  /** Main user or system flows (short bullets). */
  operationalFlows?: string[];
  /** Concrete actions for the person receiving the handoff. */
  handoffNextSteps?: string[];
  /** One short paragraph naming stack inferred from repo (languages, major libs). */
  techStackOverview?: string;
  /**
   * Plain-language description of each root-level file/folder, so a
   * non-technical owner can see what the codebase is made of without opening
   * a single file. Empty when the AI found nothing at the repo root.
   */
  moduleMap?: ModuleMapEntry[];
}

export interface ModuleMapEntry {
  /** Root-level path, e.g. "src/" or "package.json" — trailing slash means folder. */
  path: string;
  /** One sentence: what this part of the codebase is or does. */
  description: string;
}

export interface RepoSummaryRow {
  id: string;
  user_id: string;
  repo_id: number;
  full_name: string;
  summary_json: ExecutiveSummary;
  created_at: string;
  updated_at: string;
}

/** One past version of a repo's AI summary — append-only, never edited. */
export interface RepoSummaryHistoryRow {
  id: string;
  user_id: string;
  repo_id: number;
  full_name: string;
  summary_json: ExecutiveSummary;
  created_at: string;
}

/** Tracked repo: repository added to user's organization for secure visibility. */
export interface TrackedRepoRow {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  full_name: string;
  added_at: string;
}

/** Activity log entry for audit trail. */
export type ActivityActionType =
  | "collaborator_added"
  | "collaborator_removed"
  | "collaborator_access_changed"
  | "member_role_changed"
  | "repo_tracked"
  | "repo_untracked"
  | "summary_generated"
  | "access_review_completed"
  | "member_offboarded"
  | "access_expiry_extended"
  | "access_expiry_notified";

export interface ActivityLogRow {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  full_name: string;
  action_type: ActivityActionType;
  details: Record<string, unknown>;
  created_at: string;
}

/** Profile row for dashboard display (name, business, trial, subscription). */
export interface ProfileRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  business_sector: string | null;
  trial_ends_at: string | null;
  plan: string | null;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  subscription_ends_at: string | null;
  /** Paid tier granted without payment — excluded from admin revenue figures. */
  is_comp?: boolean | null;
  onboarding_checklist_dismissed_at?: string | null;
  dashboard_walkthrough_completed_at?: string | null;
  avatar_storage_path?: string | null;
  created_at: string;
  updated_at: string;
}
