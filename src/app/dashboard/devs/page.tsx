import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconFolder, IconUsersGroup } from "@tabler/icons-react";
import { createClient } from "../../../lib/supabase/server";
import { fetchRepoCollaborators } from "../../../lib/github/fetch-collaborators";
import type { GitHubCollaborator } from "../../../lib/github/types";
import { DevsRepoSection } from "./devs-repo-section";

function repoDetailHref(fullName: string): string {
  const [owner, ...nameParts] = fullName.split("/");
  const name = nameParts.join("/");
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export default async function DevsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user) redirect("/login");

  const providerToken = session?.provider_token ?? null;

  const { data: trackedRows } = await supabase
    .from("tracked_repos")
    .select("full_name, repo_owner, repo_name")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const githubRepos = (trackedRows ?? []).filter((r) => r.repo_owner !== "gitlab");
  const gitlabRepos = (trackedRows ?? []).filter((r) => r.repo_owner === "gitlab");

  type RepoWithCollabs = {
    fullName: string;
    owner: string;
    name: string;
    collaborators: GitHubCollaborator[];
    error?: string;
  };

  const reposWithCollabs: RepoWithCollabs[] =
    providerToken && githubRepos.length > 0
      ? await Promise.all(
          githubRepos.map(async (r) => {
            const [owner, ...nameParts] = r.full_name.split("/");
            const name = nameParts.join("/") || r.full_name;
            const { collaborators, error } = await fetchRepoCollaborators(
              owner,
              name,
              providerToken
            );
            return { fullName: r.full_name, owner, name, collaborators, error };
          })
        )
      : [];

  return (
    <div className="space-y-10 sm:space-y-12">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconUsersGroup className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Developers & collaborators
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              See who has access to which projects and manage them in one place.
              Revoke access here or open a repo to grant new collaborators.
            </p>
          </div>
        </div>
      </div>

      {reposWithCollabs.length === 0 && gitlabRepos.length === 0 && (
        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm text-muted">
            No repos in your organization yet. Add repos from the{" "}
            <Link href="/dashboard" className="text-foreground underline hover:no-underline">
              dashboard
            </Link>{" "}
            or your{" "}
            <Link
              href="/dashboard/organization"
              className="text-foreground underline hover:no-underline"
            >
              organization
            </Link>{" "}
            to see and manage collaborators here.
          </p>
        </section>
      )}

      {reposWithCollabs.length === 0 && gitlabRepos.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-medium text-foreground">GitLab projects</h2>
          <p className="mt-1 text-sm text-muted">
            Collaborator management for GitLab projects is done on GitLab. Open the
            project and go to Members to add or remove people.
          </p>
          <ul className="mt-4 space-y-2">
            {gitlabRepos.map((r) => (
              <li key={r.full_name}>
                <Link
                  href={repoDetailHref(r.full_name)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
                >
                  <IconFolder className="h-4 w-4 text-muted" aria-hidden />
                  {r.full_name}
                  <IconArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!providerToken && (trackedRows?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm text-muted">
            Sign in with GitHub to see and manage collaborators on your repos.
            GitLab projects: manage members from the project page on GitLab.
          </p>
        </section>
      )}

      {reposWithCollabs.map((repo) => (
        <DevsRepoSection
          key={repo.fullName}
          fullName={repo.fullName}
          owner={repo.owner}
          name={repo.name}
          collaborators={repo.collaborators}
          error={repo.error}
        />
      ))}
    </div>
  );
}
