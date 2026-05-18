import OpenAI from "openai";
import type { CommitDetail } from "@/lib/repo-commit-detail";
import { buildCommitContextForAi } from "@/lib/repo-commit-detail";

const MODEL = "gpt-4o-mini";
const MAX_OUTPUT = 2048;

const SYSTEM = `You are Ownbase's commit review assistant. You help engineering and business stakeholders understand what a specific commit changed and what it means.

Rules:
- Base answers only on the commit metadata and diffs provided. If a file has no diff, say you cannot see its contents.
- Explain impact in plain language: what behavior likely changed, risks, and who might care (product, security, ops).
- Summarize file groups when many files changed (e.g. "documentation", "API routes", "UI components").
- Be concise and structured. Use short headings and bullet lists when helpful.
- Never invent features or file contents not supported by the diff.
- Redact secrets, tokens, passwords, or API keys if they appear in diffs — describe them only as "[redacted secret]".`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function runCommitInsightChat(input: {
  commit: CommitDetail;
  messages: ChatMessage[];
}): Promise<{ reply: string; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { reply: "", error: "OPENAI_API_KEY is not configured." };
  }

  const commitContext = buildCommitContextForAi(input.commit);
  const client = new OpenAI({ apiKey });
  const trimmedMessages = input.messages.slice(-20);

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT,
      messages: [
        {
          role: "system",
          content: `${SYSTEM}\n\n---\n\nCommit under review:\n\n${commitContext}`,
        },
        ...trimmedMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!reply) return { reply: "", error: "Empty model response." };
    return { reply };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Insight request failed.";
    return { reply: "", error: message };
  }
}
