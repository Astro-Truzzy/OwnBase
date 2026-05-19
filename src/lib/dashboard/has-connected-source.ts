/** True when the user has tracked a repo or uploaded a project zip. */
export function hasConnectedRepositorySource(counts: {
  trackedRepos: number;
  uploads: number;
}): boolean {
  return counts.trackedRepos > 0 || counts.uploads > 0;
}
