import type { FileTouchAction } from "@/lib/repo-activity";

export type CommitFileChange = {
  path: string;
  previousPath?: string;
  action: FileTouchAction;
  additions: number;
  deletions: number;
  patch?: string;
};

export type CommitDetail = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorAvatar: string | null;
  timestamp: string;
  url: string | null;
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
  };
  files: CommitFileChange[];
  provider: "github" | "gitlab";
};

export function buildCommitContextForAi(detail: CommitDetail): string {
  const header = [
    `Repository provider: ${detail.provider}`,
    `Commit: ${detail.shortSha} (${detail.sha})`,
    `Author: ${detail.author}`,
    `Date: ${detail.timestamp}`,
    `Message: ${detail.message}`,
    `Stats: +${detail.stats.additions} / -${detail.stats.deletions} across ${detail.stats.filesChanged} files`,
    "",
    "File changes:",
  ].join("\n");

  const fileBlocks = detail.files.slice(0, 16).map((file) => {
    const meta = [
      `- ${file.action}: ${file.path}`,
      file.previousPath ? `  (from ${file.previousPath})` : null,
      `  +${file.additions} / -${file.deletions}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (!file.patch?.trim()) return meta;

    const patch =
      file.patch.length > 6_000
        ? `${file.patch.slice(0, 6_000)}\n… [diff truncated]`
        : file.patch;

    return `${meta}\n\`\`\`diff\n${patch}\n\`\`\``;
  });

  return `${header}\n${fileBlocks.join("\n\n")}`;
}
