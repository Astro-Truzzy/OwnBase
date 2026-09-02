"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconShieldCheck,
  IconUsersGroup,
  IconFileText,
  IconClockExclamation,
  IconClipboardCheck,
} from "@tabler/icons-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { KnowledgeRiskMatrixChart } from "../knowledge-risk-matrix-chart";
import type { AccessMatrix } from "@/lib/access/access-matrix";
import type { ContinuityScore } from "@/lib/continuity/continuity-score";
import type { OffboardingRunRow } from "@/lib/continuity/offboarding";
import { ContinuityScorePanel } from "./continuity-score-panel";
import {
  ExpiringAccessQueue,
  type ExpiringGrant,
} from "./expiring-access-queue";
import { OffboardingSection } from "./offboarding-section";
import { markAccessReviewedAction } from "./actions";
import { cn } from "@/lib/utils";

type Message = { type: "success" | "error"; text: string };

export function ContinuityPageClient({
  continuity,
  matrix,
  expiringQueue,
  runs,
  trackedEmpty,
  hasProviderToken,
  githubTrackedCount,
  now,
}: {
  continuity: ContinuityScore;
  matrix: AccessMatrix;
  expiringQueue: ExpiringGrant[];
  runs: OffboardingRunRow[];
  trackedEmpty: boolean;
  hasProviderToken: boolean;
  githubTrackedCount: number;
  now: number;
}) {
  const router = useRouter();
  // Free tier is a permanent, real plan now — nothing is ever fully locked;
  // per-resource caps (repos/seats/uploads/summaries) do the gating instead.
  const locked = false;
  const [message, setMessage] = useState<Message | null>(null);
  const [reviewing, setReviewing] = useState(false);

  async function markReviewed() {
    setReviewing(true);
    const res = await markAccessReviewedAction();
    setReviewing(false);
    if (res.success) {
      setMessage({
        type: "success",
        text: "Access review recorded. The review clock is reset.",
      });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: res.error ?? "Could not record the review.",
      });
    }
  }

  if (trackedEmpty) {
    return (
      <div className="w-full min-w-0 space-y-8">
        <Header />
        <section className="dash-panel p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">
            No repositories in your organization yet. Add repos from your{" "}
            <Link
              href="/dashboard/organization"
              className="text-primary underline hover:no-underline"
            >
              organization
            </Link>{" "}
            to start measuring continuity risk.
          </p>
        </section>
      </div>
    );
  }

  const knowledgeRiskRepos = matrix.repos
    .filter((repo) => repo.provider === "github")
    .map((repo) => {
      const collaborators = matrix.cells.filter(
        (c) => c.fullName === repo.fullName && (c.level !== "none" || c.pending),
      ).length;
      return {
        id: repo.fullName,
        name: repo.name,
        fullName: repo.fullName,
        detailHref: `/dashboard/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`,
        // The chart's vertical axis is a health score; continuity has no
        // per-repo health, so custody spread drives both axes here.
        health: Math.min(100, collaborators * 34),
        contributors: collaborators,
        busFactor: collaborators,
      };
    });

  const soleMaintainerCount = knowledgeRiskRepos.filter(
    (r) => r.busFactor <= 1,
  ).length;
  const expiredCount = expiringQueue.filter((g) => g.state === "expired").length;
  const openRunCount = runs.filter((r) => r.status === "in_progress").length;

  return (
    <div className="w-full min-w-0 space-y-8">
      <Header />

      {message ? (
        <p
          role="alert"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            message.type === "success"
              ? "border-success-border bg-success-subtle text-success"
              : "border-danger-border bg-danger-subtle text-danger",
          )}
        >
          {message.text}
        </p>
      ) : null}

      {!hasProviderToken && githubTrackedCount > 0 ? (
        <p className="rounded-lg border border-warning-border bg-warning-subtle px-3 py-2 text-sm text-warning">
          Sign in with GitHub to measure collaborator spread. Without it, the
          single-point-of-failure factor is excluded from your score rather than
          guessed.
        </p>
      ) : null}

      <ContinuityScorePanel continuity={continuity} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Sole maintainer"
          icon={IconUsersGroup}
          tone={soleMaintainerCount > 0 ? "danger" : "success"}
          value={`${soleMaintainerCount}`}
          hint={
            soleMaintainerCount === 0
              ? "No repo depends on one person"
              : "Repos with a single collaborator"
          }
        />
        <MetricCard
          label="Expired access"
          icon={IconClockExclamation}
          tone={expiredCount > 0 ? "danger" : "success"}
          value={`${expiredCount}`}
          hint={
            expiredCount === 0 ? "Nothing past due" : "Grants past their date"
          }
        />
        <MetricCard
          label="Documented"
          icon={IconFileText}
          tone="ai"
          value={`${
            continuity.factors.find((f) => f.key === "summary_freshness")
              ?.score ?? 0
          }`}
          hint="Documentation freshness score"
        />
        <MetricCard
          label="Offboarding"
          icon={IconClipboardCheck}
          tone={openRunCount > 0 ? "warning" : "default"}
          value={`${openRunCount}`}
          hint={openRunCount === 0 ? "No runs in progress" : "Runs in progress"}
        />
      </div>

      {!locked ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Reviewed who has access and confirmed it is still correct? Record it
            to reset the access-review clock.
          </p>
          <button
            type="button"
            onClick={() => void markReviewed()}
            disabled={reviewing}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
          >
            <IconShieldCheck className="h-4 w-4" aria-hidden />
            {reviewing ? "Recording…" : "Mark access reviewed"}
          </button>
        </div>
      ) : null}

      <ExpiringAccessQueue
        grants={expiringQueue}
        locked={locked}
        onMessage={setMessage}
      />

      <OffboardingSection
        matrix={matrix}
        runs={runs}
        locked={locked}
        now={now}
        onMessage={setMessage}
      />

      {knowledgeRiskRepos.length > 0 ? (
        <section aria-labelledby="continuity-knowledge-risk">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2
              id="continuity-knowledge-risk"
              className="text-lg font-semibold text-foreground"
            >
              Custody spread
            </h2>
            <Link
              href="/dashboard/devs"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Manage access
            </Link>
          </div>
          <KnowledgeRiskMatrixChart repositories={knowledgeRiskRepos} />
        </section>
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
        <IconShieldCheck className="h-7 w-7" aria-hidden />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Continuity &amp; Offboarding
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          How well your organization would survive losing a key person — and a
          clean path to remove someone&apos;s access when they leave.
        </p>
      </div>
    </div>
  );
}
