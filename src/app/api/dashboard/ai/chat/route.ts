import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runRepoAssistantChat } from "@/lib/ai/repo-assistant-chat";

type Body = {
  messages?: { role: string; content: string }[];
  contextFiles?: { path: string; content: string }[];
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

  const rawFiles = Array.isArray(body.contextFiles) ? body.contextFiles : [];
  const contextFiles = rawFiles
    .filter(
      (f): f is { path: string; content: string } =>
        typeof f.path === "string" &&
        f.path.length > 0 &&
        f.path.length < 512 &&
        typeof f.content === "string",
    )
    .slice(0, 8)
    .map((f) => ({
      path: f.path,
      content: f.content.slice(0, 80_000),
    }));

  const { reply, error } = await runRepoAssistantChat({
    messages,
    contextFiles,
  });

  if (error && !reply) {
    return NextResponse.json({ error }, { status: 502 });
  }

  return NextResponse.json({ reply, warning: error });
}
