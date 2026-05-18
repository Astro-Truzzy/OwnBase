import { normalizeSummary } from "@/lib/ai/generate-summary";
import { parseTrackedRepoFullName } from "@/lib/dashboard/parse-tracked-repo";
import { fetchRepo } from "@/lib/github/fetch-repos";
import { fetchProjectByPath } from "@/lib/gitlab/fetch-projects";
import { buildHandoffBriefPdf } from "@/lib/handoff-brief-pdf";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/repo/[owner]/[name]/handoff-brief
 * Generates a Handoff Brief PDF from the stored AI summary.
 * Server-side only; requires auth. No sensitive data in PDF.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await context.params;
  const fullName = `${owner}/${name}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("repo_summaries")
    .select("summary_json, full_name")
    .eq("user_id", user.id)
    .eq("full_name", fullName)
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: "No summary found. Generate an executive summary first." },
      { status: 404 }
    );
  }

  const summary = normalizeSummary(row.summary_json);
  if (!summary.summary?.trim()) {
    return NextResponse.json(
      { error: "Summary data is invalid." },
      { status: 400 }
    );
  }

  let repoDescription: string | null = null;
  const dbFullName = row.full_name ?? fullName;
  const parsed = parseTrackedRepoFullName(dbFullName);
  if (parsed?.provider === "github") {
    const token = await getGitHubAccessToken(supabase, user);
    if (token) {
      const { repo } = await fetchRepo(parsed.owner, parsed.repo, token);
      repoDescription = repo?.description?.trim() || null;
    }
  } else if (parsed?.provider === "gitlab") {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.provider_token?.trim() || null;
    if (token) {
      const { project } = await fetchProjectByPath(
        parsed.pathWithNamespace,
        token,
      );
      repoDescription = project?.description?.trim() || null;
    }
  }

  try {
    const pdfBytes = await buildHandoffBriefPdf({
      fullName: dbFullName,
      summary,
      repoDescription,
    });
    const filename = `handoff-brief-${owner}-${name}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (e) {
    console.error("Handoff brief PDF generation failed:", e);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}
