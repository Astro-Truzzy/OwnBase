import { NextResponse } from "next/server";
import { requireTrackedRepo } from "@/lib/dashboard/require-tracked-repo";
import { fetchGithubCommitDetail } from "@/lib/github/fetch-commit-detail";
import { fetchGitlabCommitDetail } from "@/lib/gitlab/fetch-commit-detail";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner")?.trim();
  const name = searchParams.get("name")?.trim();
  const sha = searchParams.get("sha")?.trim();

  if (!owner || !name || !sha) {
    return NextResponse.json(
      { error: "owner, name, and sha are required." },
      { status: 400 },
    );
  }

  const fullName = owner === "gitlab" ? `gitlab/${decodeURIComponent(name)}` : `${owner}/${name}`;
  const tracked = await requireTrackedRepo(supabase, user.id, fullName);
  if (!tracked.ok) {
    return NextResponse.json({ error: tracked.error }, { status: 403 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isGitLab = owner === "gitlab";
  const githubToken = await getGitHubAccessToken(supabase, user);
  const providerToken = session?.provider_token ?? githubToken;

  if (isGitLab) {
    if (!providerToken) {
      return NextResponse.json(
        { error: "Connect GitLab to view this commit." },
        { status: 401 },
      );
    }
    const pathWithNamespace = decodeURIComponent(name);
    const { detail, error } = await fetchGitlabCommitDetail(
      pathWithNamespace,
      sha,
      providerToken,
    );
    if (!detail) {
      return NextResponse.json({ error: error ?? "Not found." }, { status: 404 });
    }
    return NextResponse.json({ commit: detail });
  }

  if (!githubToken) {
    return NextResponse.json(
      { error: "Connect GitHub to view this commit." },
      { status: 401 },
    );
  }

  const { detail, error } = await fetchGithubCommitDetail(
    owner,
    name,
    sha,
    githubToken,
  );

  if (!detail) {
    return NextResponse.json({ error: error ?? "Not found." }, { status: 404 });
  }

  return NextResponse.json({ commit: detail });
}
