import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchGithubCommitDetail } from "@/lib/github/fetch-commit-detail";
import { fetchGitlabCommitDetail } from "@/lib/gitlab/fetch-commit-detail";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import { CommitDetailClient } from "./commit-detail-client";

interface PageProps {
  params: Promise<{ owner: string; name: string; sha: string }>;
}

export default async function CommitDetailPage({ params }: PageProps) {
  const { owner, name, sha } = await params;
  const isGitLab = owner === "gitlab";
  const pathWithNamespace = isGitLab ? decodeURIComponent(name) : "";
  const backHref = `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}#activity`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const githubToken = await getGitHubAccessToken(supabase, user);
  const providerToken = session?.provider_token ?? githubToken;

  const { detail, error } = isGitLab
    ? providerToken
      ? await fetchGitlabCommitDetail(pathWithNamespace, sha, providerToken)
      : { detail: null, error: "Connect GitLab to view this commit." }
    : githubToken
      ? await fetchGithubCommitDetail(owner, name, sha, githubToken)
      : { detail: null, error: "Connect GitHub to view this commit." };

  if (!detail) {
    return (
      <div className="space-y-6">
        <Link
          href={backHref}
          className="text-sm font-medium text-cyan-100/70 hover:text-cyan-200"
        >
          ← Back to repository
        </Link>
        <div className="dash-panel p-6 text-sm text-amber-100">
          {error ?? "Commit could not be loaded."}
        </div>
      </div>
    );
  }

  const repoLabel = isGitLab ? pathWithNamespace : `${owner}/${name}`;

  return (
    <CommitDetailClient
      owner={owner}
      name={name}
      repoLabel={repoLabel}
      backHref={backHref}
      initialCommit={detail}
    />
  );
}
