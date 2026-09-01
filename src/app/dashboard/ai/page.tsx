import Link from "next/link";
import { redirect } from "next/navigation";
import { IconSparkles } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";
import { getUsageSnapshot } from "@/lib/usage-stats";
import { normalizeSummary } from "@/lib/ai/generate-summary";
import {
  buildAiInsightsOverview,
  type AiInsightsRepoInput,
  type AiInsightsSummaryInput,
} from "@/lib/ai/insights-overview";
import { AiInsightsClient } from "./ai-insights-client";

export const metadata = {
  title: "AI Codebase Insights — Ownbase",
};

export default async function DashboardAiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: trackedRows }, { data: summaryRows }, usage] = await Promise.all([
    supabase
      .from("tracked_repos")
      .select("full_name, repo_name, repo_owner")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("repo_summaries")
      .select("repo_id, full_name, summary_json, updated_at")
      .eq("user_id", user.id),
    getUsageSnapshot(supabase, user.id),
  ]);

  const tracked = trackedRows ?? [];

  const repos: AiInsightsRepoInput[] = tracked.map((row) => ({
    fullName: row.full_name,
    owner: row.repo_owner,
    name: row.repo_name,
    provider: row.repo_owner === "gitlab" ? "gitlab" : "github",
  }));

  const summaries: AiInsightsSummaryInput[] = (summaryRows ?? []).map((row) => ({
    fullName: row.full_name,
    repoId: typeof row.repo_id === "number" ? row.repo_id : null,
    // Rows whose JSON is missing or not an object read as "no summary", so the
    // owner is prompted to generate rather than shown an empty card.
    summary:
      row.summary_json && typeof row.summary_json === "object"
        ? normalizeSummary(row.summary_json)
        : null,
    updatedAt: row.updated_at ?? null,
  }));

  const overview = buildAiInsightsOverview({
    repos,
    summaries,
    usedThisMonth: usage.aiSummariesThisMonth,
    monthlyLimit: usage.limits.maxAiSummariesPerMonth,
    now: Date.now(),
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <Link
          href="/dashboard"
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-ai-border bg-accent-ai-subtle text-accent-ai">
            <IconSparkles className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              AI Codebase Insights
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Plain-language summaries of every repository you track — what it
              does, how it runs, and what a new owner would need to know. Every
              summary is AI-generated and labelled as such.
            </p>
          </div>
        </div>
      </div>

      <AiInsightsClient overview={overview} chatRepos={tracked} />
    </div>
  );
}
