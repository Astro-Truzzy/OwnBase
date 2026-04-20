/**
 * Fetches only relevant repository files for AI summary generation.
 * Prioritizes README, package/manifest files, and root structure to limit tokens.
 */

const GITHUB_API = "https://api.github.com";
const MAX_FILE_BYTES = 30_000; // ~7.5k tokens per file cap
const MAX_TOTAL_CHARS = 25_000; // overall cap for prompt context

export interface FetchedFile {
  path: string;
  content: string;
}

/** README and manifest paths to try (in order). */
const RELEVANT_PATHS = [
  "README.md",
  "README",
  "README.txt",
  "package.json",
  "package-lock.json",
  "requirements.txt",
  "Pipfile",
  "go.mod",
  "Cargo.toml",
  "composer.json",
  "Gemfile",
] as const;

function parseFullName(fullName: string): { owner: string; repo: string } {
  const [owner, ...rest] = fullName.split("/");
  const repo = rest.join("/") || fullName;
  return { owner, repo };
}

async function fetchFile(
  owner: string,
  repo: string,
  path: string,
  accessToken: string
): Promise<{ content: string } | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") return null;
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  const truncated =
    decoded.length > MAX_FILE_BYTES
      ? decoded.slice(0, MAX_FILE_BYTES) + "\n\n[... truncated for length ...]"
      : decoded;
  return { content: truncated };
}

async function fetchRootListing(
  owner: string,
  repo: string,
  accessToken: string
): Promise<string[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ name: string; type: string }>;
  return (data || []).map((e) => (e.type === "dir" ? `${e.name}/` : e.name));
}

/**
 * Fetches repository content for AI analysis: README, manifest files, and root listing.
 * Stops when total content would exceed MAX_TOTAL_CHARS.
 */
export async function fetchRelevantRepoContent(
  fullName: string,
  accessToken: string
): Promise<{ files: FetchedFile[]; rootListing: string[]; error?: string }> {
  const { owner, repo } = parseFullName(fullName);
  const files: FetchedFile[] = [];
  let totalChars = 0;

  const rootListing = await fetchRootListing(owner, repo, accessToken);

  for (const path of RELEVANT_PATHS) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    const result = await fetchFile(owner, repo, path, accessToken);
    if (!result) continue;
    const allowed = Math.min(
      result.content.length,
      MAX_TOTAL_CHARS - totalChars
    );
    const content = result.content.slice(0, allowed);
    if (content.length < result.content.length) {
      files.push({
        path,
        content: content + "\n\n[... truncated ...]",
      });
    } else {
      files.push({ path, content: result.content });
    }
    totalChars += content.length;
  }

  return { files, rootListing };
}
