import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import {
  IconBuilding,
  IconFolder,
  IconPlus,
  IconUpload,
  IconArrowRight,
} from "@tabler/icons-react";

function repoDetailHref(fullName: string): string {
  const [owner, ...rest] = fullName.split("/");
  const name = rest.join("/") || fullName;
  return `/dashboard/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export default async function OrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const businessName = profile?.business_name?.trim() ?? null;

  const { data: trackedRepos } = await supabase
    .from("tracked_repos")
    .select("full_name, repo_owner, repo_name, added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const repos = trackedRepos ?? [];

  return (
    <div className="space-y-10 sm:space-y-12">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background rounded-lg px-2 py-1 -ml-2"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <IconBuilding className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your organization
            </h1>
            {businessName && (
              <p className="mt-1 text-lg text-foreground/90">{businessName}</p>
            )}
            <p className="mt-2 text-sm text-muted max-w-2xl">
              Your organization is where you keep repositories and projects under your control.
              Create it by adding repos from GitHub or GitLab, or by uploading a project.
            </p>
          </div>
        </div>
      </div>

      {/* Create / set up organization */}
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <IconPlus className="h-5 w-5 text-accent" aria-hidden />
          Create or set up your organization
        </h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          You don’t need a separate account — your organization is built from the repos and projects you add.
          Choose one of the options below to add your first (or next) repo.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="group flex items-center gap-4 rounded-xl border border-border bg-background/50 p-5 transition-colors hover:border-accent/40 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconFolder className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground block">Add repos from GitHub or GitLab</span>
              <span className="text-sm text-muted block mt-0.5">
                Go to the dashboard, open a repo, then click &quot;Add to my organization&quot;.
              </span>
            </div>
            <IconArrowRight className="h-5 w-5 text-muted shrink-0 group-hover:text-accent transition-colors" aria-hidden />
          </Link>
          <Link
            href="/dashboard/upload"
            className="group flex items-center gap-4 rounded-xl border border-border bg-background/50 p-5 transition-colors hover:border-accent/40 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <IconUpload className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground block">Upload a project</span>
              <span className="text-sm text-muted block mt-0.5">
                Upload a zip of your project. It’s stored in your environment and appears in your organization.
              </span>
            </div>
            <IconArrowRight className="h-5 w-5 text-muted shrink-0 group-hover:text-accent transition-colors" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Repos in organization */}
      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">
          Repos in your organization
        </h2>
        <p className="mt-1 text-sm text-muted">
          Repositories and projects you’ve added. Click one to manage access, view activity, or export the audit log.
        </p>
        {repos.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No repos yet. Use the options above to add repos from the dashboard or upload a project.
          </p>
        ) : (
          <ul className="mt-6 space-y-2" role="list">
            {repos.map((row) => (
              <li key={row.full_name}>
                <Link
                  href={repoDetailHref(row.full_name)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-3 text-sm text-foreground hover:bg-surface-elevated hover:border-accent/30 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background w-full sm:w-auto"
                >
                  <IconFolder className="h-4 w-4 text-muted shrink-0" aria-hidden />
                  <span className="font-medium">{row.full_name}</span>
                  <IconArrowRight className="h-4 w-4 text-muted shrink-0 ml-auto" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
