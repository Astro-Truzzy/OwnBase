import type { ExecutiveSummary } from "@/lib/db/types";

export type RepoRiskTier = "critical" | "elevated" | "watch" | "stable";

export interface RepoRiskProfile {
  fullName: string;
  exposureScore: number;
  tier: RepoRiskTier;
  hasSummary: boolean;
  collaboratorCount: number | null;
  collaboratorError?: string;
  riskIndicators: string[];
  externalServicesCount: number;
  paymentTouches: boolean;
  authSurfaceCount: number;
  signals: string[];
}

export interface PortfolioRiskSnapshot {
  trackedCount: number;
  summarizedCount: number;
  coveragePct: number;
  avgExposure: number | null;
  tierCounts: Record<RepoRiskTier, number>;
  custodyCritical: number;
  custodyElevated: number;
  paymentRepos: number;
  highVendorRepos: number;
  indicatorThemes: Array<{ text: string; count: number }>;
  repos: RepoRiskProfile[];
  auditHighlights: Array<{
    id: string;
    label: string;
    repo: string;
    at: string;
  }>;
  strategicNotes: string[];
}

function tierFromExposure(score: number): RepoRiskTier {
  if (score >= 68) return "critical";
  if (score >= 42) return "elevated";
  if (score >= 22) return "watch";
  return "stable";
}

export function normalizeSummary(raw: unknown): Partial<ExecutiveSummary> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const strArr = (k: string): string[] => {
    const v = o[k];
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  };
  return {
    summary: typeof o.summary === "string" ? o.summary : undefined,
    riskIndicators: strArr("riskIndicators"),
    externalServices: strArr("externalServices"),
    paymentIntegrations: strArr("paymentIntegrations"),
    authentication: strArr("authentication"),
    keyComponents: strArr("keyComponents"),
    techStackOverview:
      typeof o.techStackOverview === "string" ? o.techStackOverview : undefined,
    localSetup: typeof o.localSetup === "string" ? o.localSetup : undefined,
    operationalFlows: strArr("operationalFlows"),
    handoffNextSteps: strArr("handoffNextSteps"),
  };
}

/** Build per-repo profiles and portfolio snapshot for the organization risk view. */
export function buildPortfolioRiskSnapshot(params: {
  trackedFullNames: string[];
  summariesByRepo: Map<string, Partial<ExecutiveSummary>>;
  collaboratorCounts: Map<
    string,
    {
      count: number | null;
      error?: string;
      /** When true, bus-factor penalties are suppressed (e.g. GitLab members not fetched here). */
      custodyAssessmentSkipped?: boolean;
    }
  >;
  recentAuditRows: Array<{
    id: string;
    full_name: string;
    action_type: string;
    created_at: string;
  }>;
}): PortfolioRiskSnapshot {
  const { trackedFullNames, summariesByRepo, collaboratorCounts, recentAuditRows } =
    params;

  const repos: RepoRiskProfile[] = trackedFullNames.map((fullName) => {
    const summary = summariesByRepo.get(fullName) ?? null;
    const hasSummary = Boolean(summary?.summary && summary.summary.length > 20);
    const riskIndicators =
      summary?.riskIndicators?.map((s) => s.trim()).filter(Boolean) ?? [];
    const externalServices = summary?.externalServices ?? [];
    const paymentList = summary?.paymentIntegrations ?? [];
    const authList = summary?.authentication ?? [];

    const collab = collaboratorCounts.get(fullName);
    const collaboratorCount =
      typeof collab?.count === "number" ? collab.count : null;
    const collaboratorError = collab?.error;
    const custodySkipped = collab?.custodyAssessmentSkipped === true;

    const signals: string[] = [];

    let exposure = 12;

    if (!hasSummary) {
      exposure += 22;
      signals.push("No recent AI organizational summary — baseline unknown");
    }

    const indWeight = Math.min(28, riskIndicators.length * 6);
    exposure += indWeight;
    riskIndicators.slice(0, 4).forEach((r) =>
      signals.push(`AI flagged: ${r}`),
    );
    if (riskIndicators.length > 4) {
      signals.push(
        `+${riskIndicators.length - 4} more AI risk notes in overview`,
      );
    }

    if (externalServices.length >= 10) {
      exposure += 16;
      signals.push(`Large third-party footprint (${externalServices.length} services)`);
    } else if (externalServices.length >= 6) {
      exposure += 10;
      signals.push(`${externalServices.length} external integrations to track`);
    } else if (externalServices.length >= 1 && !hasSummary) {
      exposure += 4;
    }

    if (paymentList.length > 0) {
      exposure += 10;
      signals.push(
        paymentList.length === 1
          ? `Touches payments: ${paymentList[0]}`
          : `Touches payments (${paymentList.length} surfaces)`,
      );
    }

    if (authList.length >= 2) {
      exposure += 6;
      signals.push("Multiple authentication patterns — clarify ownership");
    }

    if (custodySkipped) {
      exposure += 2;
      signals.push(
        collaboratorError ??
          "Human custody sizing unavailable here — validate in Git host settings.",
      );
    } else if (collaboratorCount === 1) {
      exposure += 24;
      signals.push(
        "Single maintainer custody (bus factor risk)",
      );
    } else if (collaboratorCount === 2) {
      exposure += 12;
      signals.push("Only two collaborators with direct repo access");
    } else if (collaboratorCount === null) {
      exposure += collaboratorError ? 4 : 2;
      if (collaboratorError) signals.push(collaboratorError);
    }

    exposure = Math.max(8, Math.min(100, Math.round(exposure)));

    const tier = tierFromExposure(exposure);

    return {
      fullName,
      exposureScore: exposure,
      tier,
      hasSummary,
      collaboratorCount,
      collaboratorError:
        collaboratorCount != null ? undefined : collaboratorError,
      riskIndicators,
      externalServicesCount: externalServices.length,
      paymentTouches: paymentList.length > 0,
      authSurfaceCount: authList.length,
      signals: [...new Set(signals)].slice(0, 8),
    };
  });

  const summarizedCount = repos.filter((r) => r.hasSummary).length;
  const trackedCount = repos.length;
  const coveragePct =
    trackedCount === 0 ? 0 : Math.round((summarizedCount / trackedCount) * 100);

  const exposures = repos.map((r) => r.exposureScore);
  const avgExposure =
    exposures.length === 0
      ? null
      : Math.round(exposures.reduce((a, b) => a + b, 0) / exposures.length);

  const tierCounts: Record<RepoRiskTier, number> = {
    critical: 0,
    elevated: 0,
    watch: 0,
    stable: 0,
  };
  repos.forEach((r) => {
    tierCounts[r.tier] += 1;
  });

  const custodyCritical = repos.filter((r) => r.collaboratorCount === 1).length;
  const custodyElevated = repos.filter((r) => r.collaboratorCount === 2).length;

  const paymentRepos = repos.filter((r) => r.paymentTouches).length;
  const highVendorRepos = repos.filter((r) => r.externalServicesCount >= 8).length;

  const indicatorMap = new Map<string, number>();
  repos.forEach((r) => {
    r.riskIndicators.forEach((text) => {
      const key = text.trim().toLowerCase();
      indicatorMap.set(key, (indicatorMap.get(key) ?? 0) + 1);
    });
  });
  const originalLabel = new Map<string, string>();
  repos.forEach((r) => {
    r.riskIndicators.forEach((text) => {
      originalLabel.set(text.trim().toLowerCase(), text.trim());
    });
  });

  const indicatorThemes = [...indicatorMap.entries()]
    .map(([k, count]) => ({ text: originalLabel.get(k) ?? k, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const accessTypes = new Set([
    "collaborator_added",
    "collaborator_removed",
    "repo_tracked",
    "repo_untracked",
  ]);

  const auditHighlights = recentAuditRows
    .filter((row) => accessTypes.has(row.action_type))
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      repo: row.full_name,
      at: row.created_at,
      label:
        row.action_type === "collaborator_added"
          ? "Collaborator granted access"
          : row.action_type === "collaborator_removed"
            ? "Collaborator removed"
            : row.action_type === "repo_tracked"
              ? "Repository tracked"
              : "Repository removed from org",
    }));

  const strategicNotes: string[] = [];

  if (coveragePct < 100 && trackedCount > 0) {
    strategicNotes.push(
      `Generate AI summaries on ${trackedCount - summarizedCount} repo${trackedCount - summarizedCount === 1 ? "" : "s"} without coverage so diligence flags surface automatically.`,
    );
  }
  if (custodyCritical > 0) {
    strategicNotes.push(
      `${custodyCritical} repo${custodyCritical === 1 ? "" : "s"} concentrate changes in one person — pair review and succession planning recommended.`,
    );
  }
  if (paymentRepos > 0 && coveragePct < 80) {
    strategicNotes.push(
      "Repositories that touch billing need explicit documentation and reviewer coverage — prioritize summaries and access audits there.",
    );
  }
  if (tierCounts.critical >= 2) {
    strategicNotes.push(
      "Several critical-exposure repos: treat as an ownership review cycle (access, staffing, downstream dependencies).",
    );
  }
  if (
    repos.length >= 5 &&
    highVendorRepos / repos.length > 0.4
  ) {
    strategicNotes.push(
      "Vendor concentration is spreading — maintain a consolidated integration register and failover contacts.",
    );
  }
  if (strategicNotes.length === 0 && trackedCount > 0) {
    strategicNotes.push(
      "Maintain quarterly access reviews and keep summaries refreshed after major refactors.",
    );
  }

  return {
    trackedCount,
    summarizedCount,
    coveragePct,
    avgExposure,
    tierCounts,
    custodyCritical,
    custodyElevated,
    paymentRepos,
    highVendorRepos,
    indicatorThemes,
    repos,
    auditHighlights,
    strategicNotes,
  };
}
