import { NextResponse } from "next/server";
import { fetchSearchableReposForUser } from "@/lib/dashboard/searchable-repos";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = (user.app_metadata?.provider as string) ?? "github";
  const providerToken = await getGitHubAccessToken(supabase, user);

  try {
    const repos = await fetchSearchableReposForUser({
      provider,
      providerToken,
    });
    return NextResponse.json({ repos });
  } catch {
    return NextResponse.json(
      { error: "Could not load repositories." },
      { status: 500 },
    );
  }
}
