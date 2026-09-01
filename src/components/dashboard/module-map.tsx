import { IconFile, IconFolder } from "@tabler/icons-react";
import type { ModuleMapEntry } from "@/lib/db/types";

/**
 * Root-level structure of a repository in plain language — "what is this
 * folder/file for" rather than a dependency graph. Renders nothing when the
 * AI returned no entries (older summaries generated before this field existed).
 */
export function ModuleMap({ entries }: { entries: ModuleMapEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="font-medium text-foreground">Codebase map</h3>
      <ul className="mt-2 space-y-2">
        {entries.map((entry) => {
          const isFolder = entry.path.endsWith("/");
          const Icon = isFolder ? IconFolder : IconFile;
          return (
            <li key={entry.path} className="flex items-start gap-2.5">
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <p className="min-w-0 break-words text-muted-foreground">
                <span className="font-mono text-xs font-medium text-foreground">
                  {entry.path}
                </span>{" "}
                — {entry.description}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
