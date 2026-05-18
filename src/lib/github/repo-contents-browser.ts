const GITHUB_API = "https://api.github.com";

export type RepoBrowserEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
};

const MAX_TEXT_PREVIEW = 120_000;

function authHeaders(accessToken: string | null): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

function contentsUrl(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): string {
  const base = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`;
  const encodedPath = path
    ? path
        .split("/")
        .filter(Boolean)
        .map((seg) => encodeURIComponent(seg))
        .join("/")
    : "";
  const url = encodedPath ? `${base}/${encodedPath}` : base;
  if (!ref) return url;
  const q = new URLSearchParams({ ref });
  return `${url}?${q}`;
}

export async function fetchGitHubDefaultBranch(
  owner: string,
  repo: string,
  accessToken: string | null,
): Promise<{ branch: string | null; error?: string }> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: authHeaders(accessToken), next: { revalidate: 0 } },
  );
  if (!res.ok) {
    const text = await res.text();
    return {
      branch: null,
      error: formatGitHubError(res.status, text),
    };
  }
  const data = (await res.json()) as { default_branch?: string };
  return { branch: data.default_branch ?? "main" };
}

export async function listGitHubPath(
  owner: string,
  repo: string,
  path: string,
  accessToken: string | null,
  ref?: string,
): Promise<{ entries: RepoBrowserEntry[]; error?: string }> {
  const res = await fetch(contentsUrl(owner, repo, path, ref), {
    headers: authHeaders(accessToken),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    return { entries: [], error: formatGitHubError(res.status, text) };
  }
  const data = (await res.json()) as
    | { name?: string; path?: string; type?: string }
    | Array<{ name: string; path: string; type: string }>;
  if (!Array.isArray(data)) {
    return {
      entries: [],
      error: "Path is a file, not a folder. Open the file viewer instead.",
    };
  }
  const entries: RepoBrowserEntry[] = data
    .filter((e) => e.type === "file" || e.type === "dir")
    .map((e) => ({
      name: e.name,
      path: e.path,
      type: (e.type === "dir" ? "dir" : "file") as "file" | "dir",
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  return { entries };
}

type GitHubContentJson = {
  type?: string;
  encoding?: string;
  content?: string;
  message?: string;
  download_url?: string;
  size?: number;
};

function decodeBase64Content(b64: string): string {
  return Buffer.from(b64.replace(/\n/g, ""), "base64").toString("utf-8");
}

function looksBinary(text: string): boolean {
  const nul = text.indexOf("\0");
  return nul !== -1 && nul < Math.min(text.length, 8000);
}

async function fetchFromDownloadUrl(
  downloadUrl: string,
  accessToken: string | null,
): Promise<{ content: string; truncated: boolean } | { error: string }> {
  const res = await fetch(downloadUrl, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return { error: `Could not download file (${res.status}).` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  let text = buf.toString("utf-8");
  if (looksBinary(text)) {
    return { error: "Binary file cannot be previewed as text." };
  }
  let truncated = false;
  if (text.length > MAX_TEXT_PREVIEW) {
    text = text.slice(0, MAX_TEXT_PREVIEW);
    truncated = true;
  }
  return { content: text, truncated };
}

export async function fetchGitHubFileText(
  owner: string,
  repo: string,
  path: string,
  accessToken: string | null,
  ref?: string,
): Promise<{ content: string; truncated: boolean; isBinary: boolean; error?: string }> {
  const res = await fetch(contentsUrl(owner, repo, path, ref), {
    headers: authHeaders(accessToken),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      content: "",
      truncated: false,
      isBinary: false,
      error: formatGitHubError(res.status, text),
    };
  }

  const data = (await res.json()) as GitHubContentJson;

  if (data.type !== "file") {
    return {
      content: "",
      truncated: false,
      isBinary: false,
      error: data.message ?? "Not a file.",
    };
  }

  if (data.encoding === "base64" && data.content) {
    let text = decodeBase64Content(data.content);
    if (looksBinary(text)) {
      return { content: "", truncated: false, isBinary: true };
    }
    let truncated = false;
    if (text.length > MAX_TEXT_PREVIEW) {
      text = text.slice(0, MAX_TEXT_PREVIEW);
      truncated = true;
    }
    return { content: text, truncated, isBinary: false };
  }

  if (data.download_url) {
    const downloaded = await fetchFromDownloadUrl(
      data.download_url,
      accessToken,
    );
    if ("error" in downloaded) {
      return {
        content: "",
        truncated: false,
        isBinary: false,
        error: downloaded.error,
      };
    }
    return { ...downloaded, isBinary: false };
  }

  return {
    content: "",
    truncated: false,
    isBinary: true,
    error:
      data.message ??
      "This file is too large or uses an encoding that cannot be previewed inline.",
  };
}

function formatGitHubError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    const msg = parsed.message ?? body.slice(0, 200);
    if (status === 401) {
      return "GitHub rejected the access token. Sign out, sign in again with GitHub, or reconnect your account.";
    }
    if (status === 403) {
      return `GitHub access denied: ${msg}`;
    }
    if (status === 404) {
      return `File or branch not found: ${msg}`;
    }
    return `GitHub ${status}: ${msg}`;
  } catch {
    return `GitHub ${status}: ${body.slice(0, 200)}`;
  }
}
