export type ParsedTrackedRepo =
  | { provider: "github"; owner: string; repo: string; fullName: string }
  | { provider: "gitlab"; pathWithNamespace: string; fullName: string };

/**
 * Parse `tracked_repos.full_name`: GitHub `owner/name` or GitLab `gitlab/group/project`.
 */
export function parseTrackedRepoFullName(
  fullName: string,
): ParsedTrackedRepo | null {
  const trimmed = fullName.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("gitlab/")) {
    const raw = trimmed.slice("gitlab/".length).trim();
    if (!raw) return null;
    let pathWithNamespace = raw;
    try {
      pathWithNamespace = decodeURIComponent(raw);
    } catch {
      pathWithNamespace = raw;
    }
    return {
      provider: "gitlab",
      pathWithNamespace,
      fullName: trimmed,
    };
  }
  const slash = trimmed.indexOf("/");
  if (slash <= 0 || slash === trimmed.length - 1) return null;
  const owner = trimmed.slice(0, slash);
  const repo = trimmed.slice(slash + 1);
  if (!owner || !repo || repo.includes("//")) return null;
  return { provider: "github", owner, repo, fullName: trimmed };
}
