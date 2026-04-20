import { createClient } from "@/lib/supabase/server";
import { buildHandoffBriefPdf } from "@/lib/handoff-brief-pdf";
import { NextResponse } from "next/server";
import type { ExecutiveSummary } from "@/lib/db/types";

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

  const summary = row.summary_json as ExecutiveSummary;
  if (!summary?.summary) {
    return NextResponse.json(
      { error: "Summary data is invalid." },
      { status: 400 }
    );
  }

  try {
    const pdfBytes = await buildHandoffBriefPdf({
      fullName: row.full_name ?? fullName,
      summary,
      repoDescription: null,
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
