/**
 * Generates an executive summary from repository content using OpenAI.
 * Uses only env OPENAI_API_KEY; no secrets in code.
 */

import type { ExecutiveSummary, ModuleMapEntry } from "../db/types";
import type { FetchedFile } from "../github/fetch-repo-content";
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 2560;

function buildContext(files: FetchedFile[], rootListing: string[]): string {
  const fileSections = files.map(
    (f) => `## File: ${f.path}\n${f.content}`
  ).join("\n\n---\n\n");
  const root = rootListing.length
    ? `## Root folder contents\n${rootListing.join(", ")}`
    : "";
  return [fileSections, root].filter(Boolean).join("\n\n");
}

const SYSTEM_PROMPT = `You are an analyst who explains software projects to non-technical business owners. Your output must be valid JSON only, no markdown or extra text.

Given repository file contents and root folder listing, produce an executive summary with this exact structure:
{
  "summary": "3 to 5 sentences in plain business language. What does this software do? Who is it for? Avoid technical jargon.",
  "keyComponents": ["list", "of", "main features or capabilities in business terms"],
  "paymentIntegrations": ["any payment processors, subscriptions, or billing (e.g. Stripe, PayPal). Empty array if none found."],
  "authentication": ["how users sign in or are identified, in simple terms (e.g. email/password, Google, SSO). Empty if unclear."],
  "externalServices": ["third-party APIs, databases, cloud services mentioned or implied"],
  "riskIndicators": ["simple risk notes: e.g. 'No README', 'Many external dependencies', 'Payment handling present'"],
  "techStackOverview": "One short paragraph naming the primary languages, frameworks, and runtime you infer from manifests and source (e.g. Next.js + TypeScript + Postgres). If unclear, say what is missing.",
  "localSetup": "Plain text, 5 to 10 sentences with numbered steps where helpful: how to clone this repository, install dependencies, which env vars are typically needed (name the integration, never invent secret values), how to run the dev server, and how to run tests. Base only on files you saw; if something is undocumented, say so explicitly.",
  "operationalFlows": ["3 to 6 short bullets describing main user journeys or system flows (e.g. sign-up, checkout, background job)."],
  "handoffNextSteps": ["6 to 10 actionable bullets for an engineer or owner taking over: access, secrets rotation, deployment, monitoring, docs to update, stakeholders to notify."],
  "moduleMap": [{"path": "one entry from the root folder listing, e.g. 'src/' or 'package.json'", "description": "one plain-language sentence: what this file or folder is or does in this project"}]
}

Rules:
- Use simple business language. No jargon like "middleware", "endpoints", "schema" unless you briefly explain.
- Infer from file names, README, and dependency lists. If something is unclear, say so in summary or omit from lists.
- riskIndicators: basic logic only (missing docs, many deps, payment code, etc.). Do not perform security scanning.
- localSetup, operationalFlows, handoffNextSteps, and techStackOverview must be specific to THIS repository, not generic SaaS advice.
- moduleMap: one entry per item in "Root folder contents" (skip dotfiles and lockfiles unless notable). "path" must match the root listing exactly, including any trailing "/" for folders. Never invent paths that were not in the listing.
- Never include secret values, API keys, tokens, or .env contents.`;

export interface GenerateSummaryInput {
  fullName: string;
  files: FetchedFile[];
  rootListing: string[];
}

export async function generateExecutiveSummary(
  input: GenerateSummaryInput
): Promise<{ summary: ExecutiveSummary; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return {
      summary: fallbackSummary(input.fullName),
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  const client = new OpenAI({ apiKey });
  const context = buildContext(input.files, input.rootListing);
  const userContent = `Repository: ${input.fullName}\n\n${context}`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return {
        summary: fallbackSummary(input.fullName),
        error: "Empty response from AI.",
      };
    }

    const parsed = JSON.parse(raw) as ExecutiveSummary;
    return { summary: normalizeSummary(parsed) };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return {
      summary: fallbackSummary(input.fullName),
      error: message,
    };
  }
}

/** Coerce stored JSON (any shape) into a complete ExecutiveSummary for UI / PDF. */
export function normalizeSummary(raw: unknown): ExecutiveSummary {
  const o = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const str = (v: unknown): string =>
    typeof v === "string" ? v : "Unable to generate summary.";
  const optStr = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  };
  const moduleMap = (v: unknown): ModuleMapEntry[] =>
    Array.isArray(v)
      ? v
          .filter(
            (x): x is Record<string, unknown> =>
              typeof x === "object" && x !== null,
          )
          .map((x) => ({
            path: typeof x.path === "string" ? x.path.trim() : "",
            description:
              typeof x.description === "string" ? x.description.trim() : "",
          }))
          .filter((x) => x.path.length > 0 && x.description.length > 0)
      : [];
  return {
    summary: str(o.summary),
    keyComponents: arr(o.keyComponents),
    paymentIntegrations: arr(o.paymentIntegrations),
    authentication: arr(o.authentication),
    externalServices: arr(o.externalServices),
    riskIndicators: arr(o.riskIndicators),
    techStackOverview: optStr(o.techStackOverview),
    localSetup: optStr(o.localSetup),
    operationalFlows: arr(o.operationalFlows),
    handoffNextSteps: arr(o.handoffNextSteps),
    moduleMap: moduleMap(o.moduleMap),
  };
}

function fallbackSummary(fullName: string): ExecutiveSummary {
  return {
    summary: `Summary for ${fullName} could not be generated. Check configuration and try again.`,
    keyComponents: [],
    paymentIntegrations: [],
    authentication: [],
    externalServices: [],
    riskIndicators: ["Summary generation failed or was skipped."],
    techStackOverview: undefined,
    localSetup: undefined,
    operationalFlows: [],
    handoffNextSteps: [],
    moduleMap: [],
  };
}
