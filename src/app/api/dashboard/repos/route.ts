import { NextResponse } from "next/server";
import { fetchSearchableReposForUser } from "@/lib/dashboard/searchable-repos";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const provider = (user.app_metadata?.provider as string) ?? "github";
  const providerToken = session?.provider_token ?? null;

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
