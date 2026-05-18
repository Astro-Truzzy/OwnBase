import { NextResponse } from "next/server";
import { runCommitInsightChat } from "@/lib/ai/commit-insight-chat";
import type { CommitDetail } from "@/lib/repo-commit-detail";
import { createClient } from "@/lib/supabase/server";

type Body = {
  commit?: CommitDetail;
  messages?: { role: string; content: string }[];
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const commit = body.commit;
  if (
    !commit ||
    typeof commit.sha !== "string" ||
    !Array.isArray(commit.files)
  ) {
    return NextResponse.json(
      { error: "Commit payload is required." },
      { status: 400 },
    );
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 16_000),
    }));

  if (messages.length === 0 || messages[messages.length - 1]!.role !== "user") {
    return NextResponse.json(
      { error: "Send at least one user message." },
      { status: 400 },
    );
  }

  const { reply, error } = await runCommitInsightChat({ commit, messages });

  if (error && !reply) {
    return NextResponse.json({ error }, { status: 502 });
  }

  return NextResponse.json({ reply, warning: error });
}
