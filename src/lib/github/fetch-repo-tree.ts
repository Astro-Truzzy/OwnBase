/**
 * Fetches repo directory tree from GitHub (recursive) and categorizes folder counts.
 */

const GITHUB_API = "https://api.github.com";

/** Top-level folder names mapped to display category. */
const CATEGORY_MAP: Record<string, string> = {
  app: "Frontend",
  pages: "Frontend",
  components: "Frontend",
  src: "Frontend",
  public: "Frontend",
  static: "Frontend",
  assets: "Frontend",
  ui: "Frontend",
  styles: "Frontend",
  views: "Frontend",
  screens: "Frontend",
  client: "Frontend",
  frontend: "Frontend",
  api: "Backend",
  server: "Backend",
  backend: "Backend",
  routes: "Backend",
  services: "Backend",
  controllers: "Backend",
  lib: "Shared",
  shared: "Shared",
  common: "Shared",
  config: "Config",
  ".github": "Config",
  scripts: "Config",
  docs: "Docs",
  tests: "Tests",
  "__tests__": "Tests",
  "__mocks__": "Tests",
  e2e: "Tests",
  test: "Tests",
  ci: "Config",
};

const DEFAULT_CATEGORY = "Other";

export interface FolderCategoryCount {
  category: string;
  count: number;
}

export interface RepoTreeResult {
  totalFolders: number;
  byCategory: FolderCategoryCount[];
  error?: string;
}

/**
 * Fetches the repo's default branch tree (recursive), then counts directories by category.
 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  defaultBranch: string,
  accessToken: string
): Promise<RepoTreeResult> {
  try {
    const branchRes = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(defaultBranch)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 300 },
      }
    );
    if (!branchRes.ok) {
      return { totalFolders: 0, byCategory: [], error: "Could not load branch." };
    }
    const branchData = (await branchRes.json()) as { commit?: { sha?: string } };
    const sha = branchData.commit?.sha;
    if (!sha) return { totalFolders: 0, byCategory: [], error: "No commit SHA." };

    const treeRes = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${sha}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 300 },
      }
    );
    if (!treeRes.ok) {
      return { totalFolders: 0, byCategory: [], error: "Could not load tree." };
    }
    const treeData = (await treeRes.json()) as { tree?: Array<{ path: string; type: string }> };
    const tree = treeData.tree ?? [];
    const dirs = tree.filter((item) => item.type === "tree");
    const totalFolders = dirs.length;

    const categoryCounts = new Map<string, number>();
    for (const dir of dirs) {
      const topLevel = dir.path.split("/")[0];
      const normalized = topLevel.toLowerCase();
      const category = CATEGORY_MAP[normalized] ?? DEFAULT_CATEGORY;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    const byCategory: FolderCategoryCount[] = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return { totalFolders, byCategory };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load repository structure.";
    return { totalFolders: 0, byCategory: [], error: message };
  }
}
