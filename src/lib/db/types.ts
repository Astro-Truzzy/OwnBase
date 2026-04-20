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
  | "repo_tracked"
  | "repo_untracked"
  | "summary_generated";

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
  onboarding_checklist_dismissed_at?: string | null;
  created_at: string;
  updated_at: string;
}
