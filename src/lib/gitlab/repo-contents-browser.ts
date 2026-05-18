import { fetchProjectByPath } from "./fetch-projects";

const GITLAB_API = "https://gitlab.com/api/v4";

export type RepoBrowserEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
};

const MAX_TEXT_PREVIEW = 120_000;

function projectPath(pathWithNamespace: string): string {
  return encodeURIComponent(pathWithNamespace);
}

export async function listGitLabPath(
  pathWithNamespace: string,
  dirPath: string,
  ref: string,
  accessToken: string,
): Promise<{ entries: RepoBrowserEntry[]; error?: string }> {
  const q = new URLSearchParams({
    path: dirPath,
    ref,
    per_page: "100",
  });
  const res = await fetch(
    `${GITLAB_API}/projects/${projectPath(pathWithNamespace)}/repository/tree?${q}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return { entries: [], error: `GitLab ${res.status}: ${text.slice(0, 200)}` };
  }
  const data = (await res.json()) as Array<{
    name: string;
    path: string;
    type: "tree" | "blob";
  }>;
  const entries: RepoBrowserEntry[] = (data ?? [])
    .map((e) => ({
      name: e.name,
      path: e.path,
      type: e.type === "tree" ? ("dir" as const) : ("file" as const),
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  return { entries };
}

export async function fetchGitLabDefaultBranch(
  pathWithNamespace: string,
  accessToken: string,
): Promise<{ branch: string | null; error?: string }> {
  const { project, error } = await fetchProjectByPath(
    pathWithNamespace,
    accessToken,
  );
  if (error || !project) {
    return { branch: null, error: error ?? "Project not found." };
  }
  return { branch: project.default_branch ?? "main" };
}

export async function fetchGitLabFileText(
  pathWithNamespace: string,
  filePath: string,
  ref: string,
  accessToken: string,
): Promise<{ content: string; truncated: boolean; isBinary: boolean; error?: string }> {
  const encodedFile = encodeURIComponent(filePath);
  const res = await fetch(
    `${GITLAB_API}/projects/${projectPath(pathWithNamespace)}/repository/files/${encodedFile}/raw?ref=${encodeURIComponent(ref)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return {
      content: "",
      truncated: false,
      isBinary: false,
      error: `GitLab ${res.status}: ${text.slice(0, 200)}`,
    };
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return {
      content: "",
      truncated: false,
      isBinary: true,
      error: "Unexpected JSON response for file.",
    };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  let text = buf.toString("utf-8");
  const nul = text.indexOf("\0");
  if (nul !== -1 && nul < Math.min(text.length, 8000)) {
    return { content: "", truncated: false, isBinary: true };
  }
  let truncated = false;
  if (text.length > MAX_TEXT_PREVIEW) {
    text = text.slice(0, MAX_TEXT_PREVIEW);
    truncated = true;
  }
  return { content: text, truncated, isBinary: false };
}
