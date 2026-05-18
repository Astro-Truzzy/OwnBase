import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGitHubDefaultBranch,
  fetchGitHubFileText,
} from "@/lib/github/repo-contents-browser";
import {
  fetchGitLabDefaultBranch,
  fetchGitLabFileText,
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

  if (!path) {
    return NextResponse.json({ error: "Missing path." }, { status: 400 });
  }

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
    const result = await fetchGitHubFileText(
      parsed.owner,
      parsed.repo,
      path,
      token,
      ref,
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({
      path,
      defaultBranch: ref,
      provider: "github",
      language: languageFromPath(path),
      ...result,
    });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const gitlabToken = session?.provider_token ?? null;
  if (!gitlabToken) {
    return NextResponse.json(
      { error: "Sign in with GitLab to view this file." },
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
  const result = await fetchGitLabFileText(
    parsed.pathWithNamespace,
    path,
    ref,
    gitlabToken,
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({
    path,
    defaultBranch: ref,
    provider: "gitlab",
    language: languageFromPath(path),
    ...result,
  });
}

function languageFromPath(filePath: string): string {
  const name = filePath.split("/").pop() ?? filePath;
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    json: "json",
    md: "markdown",
    mdx: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    htm: "html",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sh: "bash",
    bash: "bash",
    env: "bash",
    vue: "vue",
    php: "php",
    rb: "ruby",
    swift: "swift",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
  };
  return map[ext] ?? "plaintext";
}
