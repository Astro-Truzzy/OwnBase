import type { ExecutiveSummary, ModuleMapEntry } from "@/lib/db/types";

/**
 * Pure diff of two AI executive summaries, for the history view's "what
 * changed between these two versions" comparison. No dependency — a small
 * LCS word diff for prose fields, and set/key diffs for lists and the module
 * map (AI regenerates these from scratch each time, so position never carries
 * meaning — only membership does).
 */

export type DiffToken = { text: string; type: "same" | "added" | "removed" };

export type TextFieldDiff = { changed: boolean; tokens: DiffToken[] };

export type ListFieldDiff = {
  added: string[];
  removed: string[];
  unchanged: string[];
};

export type ModuleMapDiff = {
  added: ModuleMapEntry[];
  removed: ModuleMapEntry[];
  changed: { path: string; before: string; after: string }[];
  unchanged: ModuleMapEntry[];
};

export type SummaryDiff = {
  hasChanges: boolean;
  summary: TextFieldDiff;
  techStackOverview: TextFieldDiff | null;
  localSetup: TextFieldDiff | null;
  keyComponents: ListFieldDiff;
  paymentIntegrations: ListFieldDiff;
  authentication: ListFieldDiff;
  externalServices: ListFieldDiff;
  riskIndicators: ListFieldDiff;
  operationalFlows: ListFieldDiff;
  handoffNextSteps: ListFieldDiff;
  moduleMap: ModuleMapDiff;
};

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

/** Word-level LCS diff. Fine for summary-length prose (low hundreds of words). */
function wordDiff(oldText: string, newText: string): DiffToken[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      tokens.push({ text: a[i], type: "same" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      tokens.push({ text: a[i], type: "removed" });
      i++;
    } else {
      tokens.push({ text: b[j], type: "added" });
      j++;
    }
  }
  while (i < n) {
    tokens.push({ text: a[i], type: "removed" });
    i++;
  }
  while (j < m) {
    tokens.push({ text: b[j], type: "added" });
    j++;
  }
  return tokens;
}

function textFieldDiff(before: string, after: string): TextFieldDiff {
  return { changed: before !== after, tokens: wordDiff(before, after) };
}

/** Order doesn't carry meaning here — the AI rebuilds each list from scratch. */
function listDiff(before: string[], after: string[]): ListFieldDiff {
  const beforeSet = new Set(before.map((s) => s.trim()).filter(Boolean));
  const afterSet = new Set(after.map((s) => s.trim()).filter(Boolean));
  return {
    added: [...afterSet].filter((s) => !beforeSet.has(s)),
    removed: [...beforeSet].filter((s) => !afterSet.has(s)),
    unchanged: [...afterSet].filter((s) => beforeSet.has(s)),
  };
}

function moduleMapDiff(
  before: ModuleMapEntry[],
  after: ModuleMapEntry[],
): ModuleMapDiff {
  const beforeByPath = new Map(before.map((e) => [e.path, e]));
  const afterByPath = new Map(after.map((e) => [e.path, e]));

  const added: ModuleMapEntry[] = [];
  const changed: { path: string; before: string; after: string }[] = [];
  const unchanged: ModuleMapEntry[] = [];

  for (const [path, entry] of afterByPath) {
    const prev = beforeByPath.get(path);
    if (!prev) added.push(entry);
    else if (prev.description !== entry.description) {
      changed.push({ path, before: prev.description, after: entry.description });
    } else unchanged.push(entry);
  }

  const removed = [...beforeByPath.entries()]
    .filter(([path]) => !afterByPath.has(path))
    .map(([, entry]) => entry);

  return { added, removed, changed, unchanged };
}

export function diffSummaries(
  before: ExecutiveSummary,
  after: ExecutiveSummary,
): SummaryDiff {
  const summary = textFieldDiff(before.summary, after.summary);

  const techBefore = before.techStackOverview ?? "";
  const techAfter = after.techStackOverview ?? "";
  const techStackOverview =
    techBefore || techAfter ? textFieldDiff(techBefore, techAfter) : null;

  const setupBefore = before.localSetup ?? "";
  const setupAfter = after.localSetup ?? "";
  const localSetup =
    setupBefore || setupAfter ? textFieldDiff(setupBefore, setupAfter) : null;

  const keyComponents = listDiff(before.keyComponents, after.keyComponents);
  const paymentIntegrations = listDiff(
    before.paymentIntegrations,
    after.paymentIntegrations,
  );
  const authentication = listDiff(before.authentication, after.authentication);
  const externalServices = listDiff(
    before.externalServices,
    after.externalServices,
  );
  const riskIndicators = listDiff(before.riskIndicators, after.riskIndicators);
  const operationalFlows = listDiff(
    before.operationalFlows ?? [],
    after.operationalFlows ?? [],
  );
  const handoffNextSteps = listDiff(
    before.handoffNextSteps ?? [],
    after.handoffNextSteps ?? [],
  );
  const moduleMap = moduleMapDiff(before.moduleMap ?? [], after.moduleMap ?? []);

  const listDiffs = [
    keyComponents,
    paymentIntegrations,
    authentication,
    externalServices,
    riskIndicators,
    operationalFlows,
    handoffNextSteps,
  ];

  const hasChanges =
    summary.changed ||
    (techStackOverview?.changed ?? false) ||
    (localSetup?.changed ?? false) ||
    listDiffs.some((d) => d.added.length > 0 || d.removed.length > 0) ||
    moduleMap.added.length > 0 ||
    moduleMap.removed.length > 0 ||
    moduleMap.changed.length > 0;

  return {
    hasChanges,
    summary,
    techStackOverview,
    localSetup,
    keyComponents,
    paymentIntegrations,
    authentication,
    externalServices,
    riskIndicators,
    operationalFlows,
    handoffNextSteps,
    moduleMap,
  };
}
