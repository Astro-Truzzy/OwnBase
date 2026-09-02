"use client";

import { useState, useTransition } from "react";
import { IconBuilding, IconBuildingOff } from "@tabler/icons-react";
import { addTrackedRepoAction, removeTrackedRepoAction } from "../../actions";

interface TrackSectionProps {
  owner: string;
  name: string;
  isTracked: boolean;
}

export function TrackSection({ owner, name, isTracked }: TrackSectionProps) {
  // Free tier is a permanent, real plan now — nothing is ever fully locked;
  // per-resource caps (repos/seats/uploads/summaries) do the gating instead.
  const locked = false;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAdd = () => {
    if (locked) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addTrackedRepoAction(owner, name);
      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error ?? "Could not add repository.",
        });
      } else {
        setMessage({
          type: "success",
          text: "Repository added to your organization.",
        });
      }
    });
  };

  const handleRemove = () => {
    if (
      !confirm(
        "Remove this repo from your organization? You can add it again anytime.",
      )
    )
      return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeTrackedRepoAction(owner, name);
      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error ?? "Could not remove repository.",
        });
      } else {
        setMessage({
          type: "success",
          text: "Repository removed from your organization.",
        });
      }
    });
  };

  return (
    <section className="dash-panel p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <IconBuilding className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-lg font-medium text-foreground">
          Store in your organization
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Add this repository to your organization to keep it in one place and
        control access from here.
      </p>
      <div className="mt-4">
        {isTracked ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400">
              <IconBuilding className="h-4 w-4" aria-hidden />
              In your organization
            </span>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-border dash-surface-inset px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:bg-muted/60 hover:text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <IconBuildingOff className="h-4 w-4" aria-hidden />
              {isPending ? "Updating…" : "Remove from organization"}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || locked}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/35 bg-linear-to-r from-cyan-500/90 to-violet-600/85 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_rgba(34,211,238,0.2)] transition hover:brightness-110 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <IconBuilding className="h-4 w-4" aria-hidden />
              {isPending ? "Adding…" : "Add to my organization"}
            </button>
          </>
        )}
      </div>
      {message && (
        <p
          role="alert"
          className={`mt-3 text-sm ${
            message.type === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
