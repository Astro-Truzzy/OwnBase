import OpenAI from "openai";

const MODEL = "gpt-4o-mini";
const MAX_CONTEXT_CHARS = 48_000;
const MAX_OUTPUT = 2048;

const SYSTEM = `You are Ownbase's repository assistant. You help users understand their tracked codebases.

Rules:
- Answer using the provided file excerpts and repository layout when relevant. If information is missing, say so and suggest which files might help.
- Be concise and structured. Use markdown sparingly (headings, bullet lists) when it improves clarity.
- Do not invent file contents or APIs that are not implied by the context.
- Never print secrets, API keys, or tokens if they appear in context — redact them.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function runRepoAssistantChat(input: {
  messages: ChatMessage[];
  contextFiles: { path: string; content: string }[];
}): Promise<{ reply: string; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { reply: "", error: "OPENAI_API_KEY is not configured." };
  }

  let ctx = "";
  let used = 0;
  for (const f of input.contextFiles) {
    const block = `### ${f.path}\n${f.content}\n\n`;
    if (used + block.length > MAX_CONTEXT_CHARS) break;
    ctx += block;
    used += block.length;
  }

  const contextBlock =
    ctx.trim().length > 0
      ? `The user attached the following repository files as context:\n\n${ctx}`
      : "No file context was attached for this turn.";

  const client = new OpenAI({ apiKey });
  const trimmedMessages = input.messages.slice(-24);

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT,
      messages: [
        {
          role: "system",
          content: `${SYSTEM}\n\n${contextBlock}`,
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
    const message = e instanceof Error ? e.message : "Chat request failed.";
    return { reply: "", error: message };
  }
}
