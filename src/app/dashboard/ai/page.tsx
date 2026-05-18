import Link from "next/link";
import { redirect } from "next/navigation";
import { IconSparkles } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";
import { AiAssistantClient } from "./ai-assistant-client";

export default async function DashboardAiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("tracked_repos")
    .select("full_name, repo_name, repo_owner")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <IconSparkles className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ask AI
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Browse files in your tracked repositories and chat with the assistant
              using selected files as context. Only repos you have added to your
              organization are available.
            </p>
          </div>
        </div>
      </div>

      <AiAssistantClient initialRepos={rows ?? []} />
    </div>
  );
}
