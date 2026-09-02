import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLogRow } from "@/lib/db/types";
import { getUsageSnapshot } from "@/lib/usage-stats";

export type DashboardNotificationKind =
  | "billing"
  | "usage"
  | "setup"
  | "activity"
  | "upload";

export interface DashboardNotification {
  id: string;
  kind: DashboardNotificationKind;
  title: string;
  summary: string;
  detail: string | null;
  href: string | null;
  createdAt: string;
  read: boolean;
}

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

function formatActivity(row: ActivityLogRow): {
  title: string;
  summary: string;
  detail: string;
} {
  const repo = row.full_name;
  const details = row.details ?? {};
  switch (row.action_type) {
    case "repo_tracked":
      return {
        title: "Repository added to organization",
        summary: `${repo} is now tracked.`,
        detail:
          "This repository is included in your organization inventory. You can open it from the dashboard to view ownership data, summaries, and access.",
      };
    case "repo_untracked":
      return {
        title: "Repository removed from organization",
        summary: `${repo} was removed from tracking.`,
        detail:
          "It no longer counts toward your plan limits. You can add it again from the repository page.",
      };
    case "collaborator_added": {
      const login = String(details.login ?? details.collaborator ?? "Someone");
      return {
        title: "Collaborator access granted",
        summary: `${login} was granted access on ${repo}.`,
        detail:
          "Review team access periodically from Developers & collaborators to keep ownership clear.",
      };
    }
    case "collaborator_removed": {
      const login = String(details.login ?? details.collaborator ?? "Someone");
      return {
        title: "Collaborator access revoked",
        summary: `${login} was removed from ${repo}.`,
        detail: "They no longer have access through the linked provider account.",
      };
    }
    case "summary_generated":
      return {
        title: "AI overview generated",
        summary: `An executive summary was generated for ${repo}.`,
        detail:
          "Open the repository to read the overview, export a handoff brief, or regenerate if the codebase changed significantly.",
      };
    default: {
      const action = row.action_type as string;
      return {
        title: "Activity",
        summary: `${action.replace(/_/g, " ")} — ${repo}`,
        detail: JSON.stringify(details, null, 2),
      };
    }
  }
}

export async function fetchNotificationReadIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.notification_id as string));
}

export async function buildDashboardNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardNotification[]> {
  const readIds = await fetchNotificationReadIds(supabase, userId);

  const [
    profileRes,
    trackedHead,
    activityRes,
    uploadsRes,
    usage,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("trial_ends_at, plan, subscription_ends_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("tracked_repos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("activity_log")
      .select(
        "id, user_id, repo_owner, repo_name, full_name, action_type, details, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("uploaded_projects")
      .select("id, name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    getUsageSnapshot(supabase, userId),
  ]);

  const profile = profileRes.data;
  const trackedCount = trackedHead.count ?? 0;
  const now = Date.now();
  const items: DashboardNotification[] = [];

  const trialEnds = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;
  const subscriptionEnds = profile?.subscription_ends_at
    ? new Date(profile.subscription_ends_at)
    : null;
  const hasActiveSubscription =
    subscriptionEnds != null && subscriptionEnds.getTime() > now;
  const trialActive = trialEnds != null && trialEnds.getTime() > now;
  const trialExpired =
    trialEnds != null && trialEnds.getTime() <= now && !hasActiveSubscription;

  if (trialActive && trialEnds) {
    const msLeft = trialEnds.getTime() - now;
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    if (daysLeft <= 7 && daysLeft > 0) {
      const id = "sys:trial-ending";
      items.push({
        id,
        kind: "billing",
        title: "Trial ending soon",
        summary: `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        detail:
          "Subscribe before the trial ends to keep uninterrupted access to tracked repositories, uploads, and AI summaries. You can compare plans on the Billing page.",
        href: "/dashboard/billing",
        createdAt: trialEnds.toISOString(),
        read: readIds.has(id),
      });
    }
  }

  if (trialExpired && trialEnds) {
    const id = "sys:trial-ended";
    items.push({
      id,
      kind: "billing",
      title: "Trial has ended",
      summary: "You're now on the Free plan.",
      detail:
        "1 tracked repository, 1 seat, 1 AI summary per month. Your data is still available — upgrade any time for more.",
      href: "/dashboard/billing",
      createdAt: trialEnds.toISOString(),
      read: readIds.has(id),
    });
  }

  if (hasActiveSubscription && subscriptionEnds) {
    const msLeft = subscriptionEnds.getTime() - now;
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    if (daysLeft <= 14 && daysLeft > 0) {
      const id = "sys:subscription-renewal";
      items.push({
        id,
        kind: "billing",
        title: "Subscription renewal",
        summary: `Current period ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        detail:
          "Your subscription will renew according to your Paystack billing cycle. Update your card or manage the subscription from Billing.",
        href: "/dashboard/billing",
        createdAt: subscriptionEnds.toISOString(),
        read: readIds.has(id),
      });
    }
  }

  const usageStamp = new Date().toISOString();
  if (usage.anyAtHardLimit) {
    const id = "sys:plan-limit-hard";
    items.push({
      id,
      kind: "usage",
      title: "Plan limit reached",
      summary:
        "You have hit a cap on tracked repos, uploads, or AI summaries for this month.",
      detail:
        "Upgrade your plan or wait for the monthly summary counter to reset to continue at full capacity.",
      href: "/dashboard/billing",
      createdAt: usageStamp,
      read: readIds.has(id),
    });
  } else if (usage.anyNearSoftLimit) {
    const id = "sys:plan-limit-soft";
    items.push({
      id,
      kind: "usage",
      title: "Approaching plan limits",
      summary: "You are close to a usage cap on your current plan.",
      detail:
        "Open Billing to review usage and upgrade early to avoid interruptions.",
      href: "/dashboard/billing",
      createdAt: usageStamp,
      read: readIds.has(id),
    });
  }

  if (trackedCount === 0) {
    const id = "sys:no-tracked-repos";
    items.push({
      id,
      kind: "setup",
      title: "Add your first repository",
      summary: "Your organization has no tracked repositories yet.",
      detail:
        "From the dashboard, open a GitHub or GitLab repository and choose Add to my organization. You can also upload a project zip from Uploads.",
      href: "/dashboard/organization",
      createdAt: usageStamp,
      read: readIds.has(id),
    });
  }

  const activities = (activityRes.data ?? []) as ActivityLogRow[];
  for (const row of activities) {
    const id = `activity:${row.id}`;
    const { title, summary, detail } = formatActivity(row);
    items.push({
      id,
      kind: "activity",
      title,
      summary,
      detail,
      href: repoDetailHref(row.full_name),
      createdAt: row.created_at,
      read: readIds.has(id),
    });
  }

  const uploads = uploadsRes.data ?? [];
  for (const u of uploads) {
    const id = `upload:${u.id}`;
    items.push({
      id,
      kind: "upload",
      title: "Project uploaded",
      summary: `“${u.name}” was stored in your environment.`,
      detail:
        "You can download the zip again from Uploads, or delete the project when you no longer need it.",
      href: "/dashboard/upload",
      createdAt: u.created_at,
      read: readIds.has(id),
    });
  }

  items.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return items;
}

export function countUnread(notifications: DashboardNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}
