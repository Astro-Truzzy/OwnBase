import type { Metadata } from "next";
import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { getAdminUsers, planTone, subscriptionStatus } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";
import { CompControl } from "./comp-control";

export const metadata: Metadata = { title: "Users" };

const PAGE_SIZE = 25;

function PlanBadge({ plan }: { plan: string }) {
  const tone = planTone(plan);
  const toneClass = {
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    cyan: "border-cyan-400/30 bg-cyan-500/10 text-accent",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    violet: "border-violet-400/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
    muted: "border-border bg-muted text-muted-foreground",
  }[tone];
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize", toneClass)}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return null;
  const toneClass =
    status === "expiring"
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";
  return <span className={cn("text-xs font-medium", toneClass)}>{status}</span>;
}

/**
 * Marks an account whose paid tier was granted without payment. It sits beside
 * the plan badge rather than replacing it: the tier is real (full entitlements),
 * it just isn't revenue.
 */
function CompedBadge() {
  return (
    <span
      title="Paid tier granted without payment — excluded from revenue figures"
      className="inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
    >
      comped
    </span>
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(0, Number(params.page ?? 0));
  const search = params.search?.trim() || undefined;

  const { users, total } = await getAdminUsers(page, PAGE_SIZE, search);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total.toLocaleString()} total accounts
          </p>
        </div>

        {/* Search form */}
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search email…"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 w-48"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/users"
              className="flex h-9 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:bg-muted"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Repos</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Active</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Access</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {search ? `No users matching "${search}".` : "No users found."}
                  </td>
                </tr>
              ) : (
                users.map((user, i) => {
                  const status = subscriptionStatus(
                    user.plan,
                    user.trial_ends_at,
                    user.subscription_ends_at,
                  );
                  return (
                    <tr
                      key={user.user_id}
                      className={cn(
                        "border-b border-border/50 transition-colors hover:bg-muted/30",
                        i % 2 === 0 ? "" : "bg-muted/10",
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground truncate max-w-60">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <PlanBadge plan={user.plan} />
                          {user.is_comp && <CompedBadge />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {user.tracked_repos_count}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {relativeTime(user.last_activity)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CompControl
                          userId={user.user_id}
                          email={user.email}
                          isComp={user.is_comp}
                          currentPlan={user.plan}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages} · {total} users
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <Link
                href={`/admin/users?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-muted-foreground transition hover:bg-muted"
              >
                <IconChevronLeft className="h-4 w-4" />
                Prev
              </Link>
            )}
            {page < totalPages - 1 && (
              <Link
                href={`/admin/users?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-muted-foreground transition hover:bg-muted"
              >
                Next
                <IconChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
