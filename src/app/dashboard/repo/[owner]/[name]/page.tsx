import dynamic from "next/dynamic";
import { createClient } from "../../../../../lib/supabase/server";
import { fetchRepo } from "../../../../../lib/github/fetch-repos";
import { fetchRepoCollaborators } from "../../../../../lib/github/fetch-collaborators";
import { fetchRepoTree } from "../../../../../lib/github/fetch-repo-tree";
import { fetchGithubRepoFileActivity } from "../../../../../lib/github/fetch-repo-commit-activity";
import { fetchGitlabRepoFileActivity } from "../../../../../lib/gitlab/fetch-repo-commit-activity";
import { fetchProjectByPath } from "../../../../../lib/gitlab/fetch-projects";
import { getGitHubAccessToken } from "../../../../../lib/supabase/github-token";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ActivityLogRow } from "../../../../../lib/db/types";

const FolderStructureSection = dynamic(
  () =>
    import("./folder-structure-section").then((m) => m.FolderStructureSection),
  { ssr: true },
);
const SummarySection = dynamic(
  () => import("./summary-section").then((m) => m.SummarySection),
  { ssr: true },
);
const TrackSection = dynamic(
  () => import("./track-section").then((m) => m.TrackSection),
  { ssr: true },
);
const AccessSection = dynamic(
  () => import("./access-section").then((m) => m.AccessSection),
  { ssr: true },
);
const ActivitySection = dynamic(
  () => import("./activity-section").then((m) => m.ActivitySection),
  { ssr: true },
);
const ProtectionSection = dynamic(
  () => import("./protection-section").then((m) => m.ProtectionSection),
  { ssr: true },
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

  const githubToken =
    user != null ? await getGitHubAccessToken(supabase, user) : null;
  const providerToken = session?.provider_token ?? githubToken;

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

    const { events: fileEvents, error: fileActivityError } =
      providerToken != null
        ? await fetchGitlabRepoFileActivity(pathWithNamespace, providerToken, {
            maxCommits: 18,
          })
        : { events: [], error: "Connect GitLab to load commit activity." };

    const displayName = gitlabProject?.name ?? pathWithNamespace;
    const webUrl =
      gitlabProject?.web_url ?? `https://gitlab.com/${pathWithNamespace}`;

    return (
      <div className="space-y-8 sm:space-y-10">
        <div>
          <Link
            href="/dashboard"
            className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
          >
            ← Back to dashboard
          </Link>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {displayName}
              </h1>
              {gitlabProject?.description && (
                <p className="mt-1.5 leading-relaxed text-cyan-100/65">
                  {gitlabProject.description}
                </p>
              )}
              <a
                href={webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-cyan-200/90 transition-colors hover:text-cyan-100"
              >
                Open on GitLab →
              </a>
            </div>
            <span
              className="w-fit shrink-0 rounded-md border border-cyan-200/20 bg-[#050b16]/70 px-3 py-1.5 text-xs font-medium text-cyan-100/80"
              title={
                gitlabProject?.visibility === "private" ? "Private" : "Public"
              }
            >
              {gitlabProject?.visibility === "private" ? "Private" : "Public"}
            </span>
          </div>
        </div>

        <TrackSection owner={owner} name={name} isTracked={isTracked} />

        <section className="dash-panel p-6 sm:p-8">
          <h2 className="text-lg font-medium text-cyan-50">Access</h2>
          <p className="mt-1 text-sm text-cyan-100/65">
            Manage members and permissions in GitLab.
          </p>
          <a
            href={`${webUrl}/-/project_members`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-[#050b16]/80 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-300/35 hover:bg-[#0f1a2e]"
          >
            Manage on GitLab →
          </a>
        </section>

        <ActivitySection
          owner={owner}
          name={name}
          fileEvents={fileEvents}
          auditEntries={activityEntries}
          fileActivityError={fileActivityError}
        />

        <ProtectionSection
          owner={owner}
          name={name}
          activityEntries={activityEntries}
        />
      </div>
    );
  }

  const { repo, error: repoError } = githubToken
    ? await fetchRepo(owner, name, githubToken)
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

  const { collaborators, error: collaboratorsError } = githubToken
    ? await fetchRepoCollaborators(owner, name, githubToken)
    : { collaborators: [], error: null };

  const defaultBranch = repo.default_branch ?? "main";
  const treeResult = githubToken
    ? await fetchRepoTree(owner, name, defaultBranch, githubToken)
    : { totalFolders: 0, byCategory: [], error: "GitHub not connected." };

  const { events: fileEvents, error: fileActivityError } = githubToken
    ? await fetchGithubRepoFileActivity(owner, name, githubToken, {
        maxCommits: 18,
        branch: defaultBranch,
      })
    : { events: [], error: "Connect GitHub to load commit activity." };

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
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-cyan-100/70 transition-colors hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2 focus:ring-offset-[#050914]"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {repo.name}
            </h1>
            {repo.description && (
              <p className="mt-1.5 leading-relaxed text-cyan-100/65">
                {repo.description}
              </p>
            )}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-cyan-200/90 transition-colors hover:text-cyan-100"
            >
              Open on GitHub →
            </a>
          </div>
          <span
            className="w-fit shrink-0 rounded-md border border-cyan-200/20 bg-[#050b16]/70 px-3 py-1.5 text-xs font-medium text-cyan-100/80"
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
        fileEvents={fileEvents}
        auditEntries={activityEntries}
        fileActivityError={fileActivityError}
      />

      <ProtectionSection
        owner={owner}
        name={name}
        activityEntries={activityEntries}
      />
    </div>
  );
}
