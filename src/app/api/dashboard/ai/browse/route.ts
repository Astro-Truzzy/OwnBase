import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGitHubDefaultBranch,
  listGitHubPath,
} from "@/lib/github/repo-contents-browser";
import {
  fetchGitLabDefaultBranch,
  listGitLabPath,
} from "@/lib/gitlab/repo-contents-browser";
import { parseTrackedRepoFullName } from "@/lib/dashboard/parse-tracked-repo";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fullName = searchParams.get("fullName")?.trim() ?? "";
  const path = searchParams.get("path")?.trim() ?? "";
  let ref = searchParams.get("ref")?.trim() ?? "";

  const parsed = parseTrackedRepoFullName(fullName);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid repository." }, { status: 400 });
  }

  const { data: tracked } = await supabase
    .from("tracked_repos")
    .select("id")
    .eq("user_id", user.id)
    .eq("full_name", fullName)
    .maybeSingle();

  if (!tracked) {
    return NextResponse.json(
      { error: "Repository is not in your organization." },
      { status: 403 },
    );
  }

  if (parsed.provider === "github") {
    const token = await getGitHubAccessToken(supabase, user);
    if (!ref) {
      const { branch, error } = await fetchGitHubDefaultBranch(
        parsed.owner,
        parsed.repo,
        token,
      );
      if (error || !branch) {
        return NextResponse.json(
          { error: error ?? "Could not resolve default branch." },
          { status: 502 },
        );
      }
      ref = branch;
    }
    const { entries, error } = await listGitHubPath(
      parsed.owner,
      parsed.repo,
      path,
      token,
      ref,
    );
    if (error) {
      return NextResponse.json({ error }, { status: 502 });
    }
    return NextResponse.json({ entries, defaultBranch: ref, provider: "github" });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const gitlabToken = session?.provider_token ?? null;
  if (!gitlabToken) {
    return NextResponse.json(
      { error: "Sign in with GitLab to browse this repository." },
      { status: 401 },
    );
  }

  if (!ref) {
    const { branch, error } = await fetchGitLabDefaultBranch(
      parsed.pathWithNamespace,
      gitlabToken,
    );
    if (error || !branch) {
      return NextResponse.json(
        { error: error ?? "Could not resolve default branch." },
        { status: 502 },
      );
    }
    ref = branch;
  }
  const { entries, error } = await listGitLabPath(
    parsed.pathWithNamespace,
    path,
    ref,
    gitlabToken,
  );
  if (error) {
    return NextResponse.json({ error }, { status: 502 });
  }
  return NextResponse.json({ entries, defaultBranch: ref, provider: "gitlab" });
}
