import dynamic from "next/dynamic";
import { createClient } from "../../../../../lib/supabase/server";
import { fetchRepo } from "../../../../../lib/github/fetch-repos";
import { fetchRepoCollaborators } from "../../../../../lib/github/fetch-collaborators";
import { fetchRepoTree } from "../../../../../lib/github/fetch-repo-tree";
import { fetchProjectByPath } from "../../../../../lib/gitlab/fetch-projects";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ActivityLogRow } from "../../../../../lib/db/types";

const FolderStructureSection = dynamic(
  () => import("./folder-structure-section").then((m) => m.FolderStructureSection),
  { ssr: true }
);
const SummarySection = dynamic(
  () => import("./summary-section").then((m) => m.SummarySection),
  { ssr: true }
);
const TrackSection = dynamic(
  () => import("./track-section").then((m) => m.TrackSection),
  { ssr: true }
);
const AccessSection = dynamic(
  () => import("./access-section").then((m) => m.AccessSection),
  { ssr: true }
);
const ActivitySection = dynamic(
  () => import("./activity-section").then((m) => m.ActivitySection),
  { ssr: true }
);
const ProtectionSection = dynamic(
  () => import("./protection-section").then((m) => m.ProtectionSection),
  { ssr: true }
);

interface PageProps {
  params: Promise<{ owner: string; name: string }>;
}

export default async function RepoDetailPage({ params }: PageProps) {
  const { owner, name } = await params;
  const fullName = `${owner}/${name}`;
  const isGitLab = owner === "gitlab";
  const pathWithNamespace = isGitLab ? decodeURIComponent(name) : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user) notFound();

  const providerToken = session?.provider_token ?? null;

  if (isGitLab) {
    const gitlabProject =
      providerToken != null
        ? (await fetchProjectByPath(pathWithNamespace, providerToken)).project
        : null;
    const { data: trackedRow } = await supabase
      .from("tracked_repos")
      .select("id")
      .eq("user_id", user.id)
      .eq("full_name", fullName)
      .maybeSingle();
    const isTracked = trackedRow != null;
    const { data: activityData } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", user.id)
      .eq("repo_owner", owner)
      .eq("repo_name", name)
      .order("created_at", { ascending: false })
      .limit(30);
    const activityEntries = (activityData ?? []) as ActivityLogRow[];

    const displayName = gitlabProject?.name ?? pathWithNamespace;
    const webUrl = gitlabProject?.web_url ?? `https://gitlab.com/${pathWithNamespace}`;

    return (
      <div className="space-y-8 sm:space-y-10">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-lg px-2 py-1 -ml-2"
          >
            ← Back to dashboard
          </Link>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>
              {gitlabProject?.description && (
                <p className="mt-1.5 text-muted leading-relaxed">
                  {gitlabProject.description}
                </p>
              )}
              <a
                href={webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-muted hover:text-foreground transition-colors"
              >
                Open on GitLab →
              </a>
            </div>
            <span
              className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted w-fit"
              title={gitlabProject?.visibility === "private" ? "Private" : "Public"}
            >
              {gitlabProject?.visibility === "private" ? "Private" : "Public"}
            </span>
          </div>
        </div>

        <TrackSection owner={owner} name={name} isTracked={isTracked} />

        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-medium text-foreground">Access</h2>
          <p className="mt-1 text-sm text-muted">
            Manage members and permissions in GitLab.
          </p>
          <a
            href={`${webUrl}/-/project_members`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            Manage on GitLab →
          </a>
        </section>

        <ActivitySection
          owner={owner}
          name={name}
          entries={activityEntries}
        />

        <ProtectionSection
          owner={owner}
          name={name}
          activityEntries={activityEntries}
        />
      </div>
    );
  }

  const { repo, error: repoError } = providerToken
    ? await fetchRepo(owner, name, providerToken)
    : { repo: null, error: "GitHub not connected." };

  if (!repo || repoError) notFound();

  const { data: existingSummary } = await supabase
    .from("repo_summaries")
    .select("summary_json, updated_at")
    .eq("user_id", user.id)
    .eq("repo_id", repo.id)
    .single();

  const summary = existingSummary?.summary_json ?? null;
  const summaryUpdatedAt = existingSummary?.updated_at ?? null;

  const { collaborators, error: collaboratorsError } = providerToken
    ? await fetchRepoCollaborators(owner, name, providerToken)
    : { collaborators: [], error: null };

  const defaultBranch = repo.default_branch ?? "main";
  const treeResult = providerToken
    ? await fetchRepoTree(owner, name, defaultBranch, providerToken)
    : { totalFolders: 0, byCategory: [], error: "GitHub not connected." };

  const { data: trackedRow } = await supabase
    .from("tracked_repos")
    .select("id")
    .eq("user_id", user.id)
    .eq("full_name", fullName)
    .maybeSingle();
  const isTracked = trackedRow != null;

  const { data: activityData } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", user.id)
    .eq("repo_owner", owner)
    .eq("repo_name", name)
    .order("created_at", { ascending: false })
    .limit(30);
  const activityEntries = (activityData ?? []) as ActivityLogRow[];

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-lg px-2 py-1 -ml-2"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {repo.name}
            </h1>
            {repo.description && (
              <p className="mt-1.5 text-muted leading-relaxed">
                {repo.description}
              </p>
            )}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-muted hover:text-foreground transition-colors"
            >
              Open on GitHub →
            </a>
          </div>
          <span
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted w-fit"
            title={repo.private ? "Private" : "Public"}
          >
            {repo.private ? "Private" : "Public"}
          </span>
        </div>
      </div>

      <FolderStructureSection
        totalFolders={treeResult.totalFolders}
        byCategory={treeResult.byCategory}
        error={treeResult.error}
      />

      <SummarySection
        repoId={repo.id}
        fullName={fullName}
        owner={owner}
        name={name}
        initialSummary={summary}
        summaryUpdatedAt={summaryUpdatedAt}
      />

      <TrackSection owner={owner} name={name} isTracked={isTracked} />

      <AccessSection
        owner={owner}
        name={name}
        collaborators={collaborators}
        error={collaboratorsError}
      />

      <ActivitySection
        owner={owner}
        name={name}
        entries={activityEntries}
      />

      <ProtectionSection
        owner={owner}
        name={name}
        activityEntries={activityEntries}
      />
    </div>
  );
}
