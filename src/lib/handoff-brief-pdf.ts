/**
 * Server-side PDF generation for the Handoff Brief.
 * Uses pdf-lib; no sensitive data (e.g. env values) is included.
 */

import fs from "fs/promises";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { ExecutiveSummary } from "./db/types";

const MARGIN = 50;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LINE_HEIGHT = 14;
const SECTION_GAP = 18;
const HEADING_SIZE = 12;
const BODY_SIZE = 10;
const FOOTER_RESERVE = 52;
const MIN_Y = MARGIN + FOOTER_RESERVE;

/** Wrap text into lines that fit within maxWidth (approx chars for Helvetica at 10pt). */
function wrapLines(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxCharsPerLine) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [text];
}

interface Layout {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  helvetica: PDFFont;
  helveticaBold: PDFFont;
  maxChars: number;
}

function newPage(l: Layout): void {
  l.page = l.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  l.y = PAGE_HEIGHT - MARGIN;
}

function ensureLines(l: Layout, lineCount: number): void {
  const need = lineCount * LINE_HEIGHT + 4;
  if (l.y - need < MIN_Y) {
    newPage(l);
  }
}

function drawFooterLine(l: Layout, fullName: string, generatedAt: string): void {
  const footerY = MARGIN + 18;
  const text = `Ownbase · ${fullName} · Generated ${generatedAt}`;
  l.page.drawText(text.slice(0, 95), {
    x: MARGIN,
    y: footerY,
    size: 8,
    font: l.helvetica,
    color: rgb(0.45, 0.45, 0.45),
  });
}

function drawSectionHeading(l: Layout, title: string): void {
  ensureLines(l, 2);
  l.page.drawText(title, {
    x: MARGIN,
    y: l.y,
    size: HEADING_SIZE,
    font: l.helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  l.y -= LINE_HEIGHT + 6;
}

function drawParagraph(l: Layout, text: string, opts?: { muted?: boolean }): void {
  const lines = wrapLines(text, l.maxChars);
  const color = opts?.muted ? rgb(0.45, 0.45, 0.45) : rgb(0.2, 0.2, 0.2);
  for (const line of lines) {
    ensureLines(l, 1);
    l.page.drawText(line, {
      x: MARGIN,
      y: l.y,
      size: BODY_SIZE,
      font: l.helvetica,
      color,
    });
    l.y -= LINE_HEIGHT;
  }
  l.y -= 4;
}

function drawBulletList(l: Layout, items: string[]): void {
  for (const item of items) {
    const lines = wrapLines(item, l.maxChars - 2);
    for (let i = 0; i < lines.length; i++) {
      ensureLines(l, 1);
      const prefix = i === 0 ? "• " : "  ";
      l.page.drawText(prefix + lines[i], {
        x: MARGIN,
        y: l.y,
        size: BODY_SIZE,
        font: l.helvetica,
        color: rgb(0.25, 0.25, 0.25),
      });
      l.y -= LINE_HEIGHT;
    }
    l.y -= 2;
  }
  l.y -= 4;
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function buildFallbackTechOverview(summary: ExecutiveSummary): string {
  const parts: string[] = [];
  if (summary.keyComponents.length) {
    parts.push(
      `Capability areas noted in the summary: ${summary.keyComponents.slice(0, 8).join(", ")}${summary.keyComponents.length > 8 ? ", …" : ""}.`
    );
  }
  const integrations = dedupeStrings([
    ...summary.externalServices,
    ...summary.paymentIntegrations,
  ]);
  if (integrations.length) {
    parts.push(
      `Third-party surfaces referenced: ${integrations.slice(0, 10).join(", ")}${integrations.length > 10 ? ", …" : ""}. Regenerate the repository executive summary for a tighter stack paragraph if this brief is outdated.`
    );
  }
  if (!parts.length) {
    return "No dedicated tech stack paragraph was stored for this repository. Regenerate the executive summary from the dashboard after README or dependency changes.";
  }
  return parts.join(" ");
}

function buildFallbackLocalSetup(fullName: string, s: ExecutiveSummary): string {
  const lines: string[] = [];
  lines.push(
    `Repository: ${fullName}. The steps below are typical after cloning; always confirm against the project README and manifests in the repo root.`
  );
  lines.push(
    "1) Clone the repository and check out the default branch used for production (see provider settings if unsure)."
  );
  const vendors = dedupeStrings([
    ...s.externalServices,
    ...s.paymentIntegrations,
    ...s.authentication,
  ]);
  if (vendors.length) {
    lines.push(
      `2) Create a local environment file (for example .env) and configure credentials for: ${vendors.slice(0, 12).join(", ")}${vendors.length > 12 ? ", …" : ""}. Obtain keys from each vendor console — this PDF never contains secret values.`
    );
  } else {
    lines.push(
      "2) Install dependencies using the manifest at the repository root (for example package.json, requirements.txt, go.mod, or Cargo.toml)."
    );
  }
  lines.push(
    "3) Run the development server using the script documented in the repository (for example npm run dev). Run the test suite before shipping changes if tests exist."
  );
  lines.push(
    "4) If setup details are missing, regenerate the executive summary from Ownbase so AI can re-read README and config files."
  );
  return lines.join("\n\n");
}

function defaultHandoffNextSteps(fullName: string): string[] {
  return [
    `Confirm maintainer access to ${fullName} on GitHub, GitLab, or your host.`,
    "Complete local setup, run tests, and reproduce the main flows listed in this brief.",
    "Inventory production hosting, DNS, databases, background jobs, and CI/CD tied to this repo.",
    "Rotate shared credentials and review vendor dashboards (billing, API limits, webhooks).",
    "Capture contacts for security, compliance, and product stakeholders outside this document.",
  ];
}

function buildIntegrationGuidance(summary: ExecutiveSummary): string[] {
  const bullets: string[] = [];
  const combined = dedupeStrings([
    ...summary.externalServices,
    ...summary.paymentIntegrations,
    ...summary.authentication,
  ]);
  if (combined.length) {
    bullets.push(
      `Plan configuration time for: ${combined.join(", ")}. Exact environment variable names live in the repo (README, .env.example, deployment configs).`
    );
  }
  bullets.push(
    "Never commit API keys, tokens, or customer data. Use per-environment secrets in your host's secret store."
  );
  bullets.push(
    "After ownership transfer, rotate credentials the previous team had access to and audit third-party integrations."
  );
  return bullets;
}

export interface HandoffBriefInput {
  fullName: string;
  summary: ExecutiveSummary;
  repoDescription?: string | null;
}

/**
 * Builds a Handoff Brief PDF from existing AI summary data.
 * Server-side only; does not include sensitive env values.
 */
export async function buildHandoffBriefPdf(
  input: HandoffBriefInput
): Promise<Uint8Array> {
  const { fullName, summary, repoDescription } = input;
  const generatedAt = new Date().toISOString().slice(0, 19) + "Z";

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const l: Layout = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    helvetica,
    helveticaBold,
    maxChars: 86,
  };

  // ----- Brand logo -----
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "LOGO",
      "Icon-brandname.png",
    );
    const logoBytes = await fs.readFile(logoPath);
    const logoImage = await doc.embedPng(logoBytes);
    const drawW = 112;
    const drawH = (logoImage.height * drawW) / logoImage.width;
    l.page.drawImage(logoImage, {
      x: MARGIN,
      y: l.y - drawH,
      width: drawW,
      height: drawH,
    });
    l.y -= drawH + 16;
  } catch {
    l.page.drawText("Ownbase", {
      x: MARGIN,
      y: l.y - 14,
      size: 12,
      font: helveticaBold,
      color: rgb(0.15, 0.15, 0.15),
    });
    l.y -= 32;
  }

  l.page.drawText("Technical handoff brief", {
    x: MARGIN,
    y: l.y,
    size: 22,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  l.y -= 28;

  l.page.drawText(fullName, {
    x: MARGIN,
    y: l.y,
    size: 12,
    font: helvetica,
    color: rgb(0.35, 0.35, 0.35),
  });
  l.y -= LINE_HEIGHT + SECTION_GAP;

  drawParagraph(
    l,
    "This document summarizes what Ownbase inferred from the repository snapshot used when the executive summary was generated. It is meant to orient a new engineer or owner: scope, stack, integrations, setup, and sensible next actions. Regenerate the summary after large refactors so this brief stays aligned with the code.",
  );
  l.y -= 4;

  drawSectionHeading(l, "Repository");
  if (repoDescription?.trim()) {
    drawParagraph(l, repoDescription.trim());
  } else {
    drawParagraph(
      l,
      "No live repository description was attached to this export. Open the project on your provider for the canonical description, topics, and default branch.",
      { muted: true },
    );
  }
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Project overview");
  drawParagraph(l, summary.summary);
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Tech stack");
  drawParagraph(
    l,
    summary.techStackOverview?.trim() || buildFallbackTechOverview(summary),
  );
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Key capabilities");
  if (summary.keyComponents.length > 0) {
    drawBulletList(l, summary.keyComponents);
  } else {
    drawParagraph(l, "None listed in the stored summary.", { muted: true });
  }
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Operational flows");
  const flows =
    summary.operationalFlows?.filter((s) => s.trim().length > 0) ?? [];
  if (flows.length > 0) {
    drawBulletList(l, flows);
  } else {
    drawParagraph(
      l,
      "No dedicated flow list in the stored summary. Derive user and system flows from the overview and capabilities above, or regenerate the executive summary to populate flow bullets.",
      { muted: true },
    );
  }
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Local setup & development");
  drawParagraph(
    l,
    summary.localSetup?.trim() || buildFallbackLocalSetup(fullName, summary),
  );
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Integrations & configuration");
  const integrationList = dedupeStrings([
    ...summary.externalServices,
    ...summary.paymentIntegrations,
    ...summary.authentication,
  ]);
  if (integrationList.length > 0) {
    drawBulletList(l, integrationList);
  } else {
    drawParagraph(l, "No third-party integrations were listed in the summary.", {
      muted: true,
    });
  }
  drawBulletList(l, buildIntegrationGuidance(summary));
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Environment variables & secrets");
  drawBulletList(l, [
    "This PDF does not echo .env files or secret values.",
    "Search the repo for .env.example, .env.local.example, docker-compose, Terraform, or host-specific docs to learn required keys.",
    "Treat any list of vendors in this brief as a hint for which consoles and API keys you must provision.",
  ]);
  l.y -= SECTION_GAP;

  if (summary.riskIndicators.length > 0) {
    drawSectionHeading(l, "Risk & documentation signals");
    drawBulletList(l, summary.riskIndicators);
    l.y -= SECTION_GAP;
  }

  drawSectionHeading(l, "Recipient checklist (next actions)");
  const nextSteps =
    summary.handoffNextSteps?.filter((s) => s.trim().length > 0) ?? [];
  drawBulletList(
    l,
    nextSteps.length > 0 ? nextSteps : defaultHandoffNextSteps(fullName),
  );
  l.y -= SECTION_GAP;

  drawSectionHeading(l, "Disclaimer");
  drawParagraph(
    l,
    "Content is inferred from a partial file sample at summary time, not a full security audit. Validate assumptions in source control before production changes.",
    { muted: true },
  );

  drawFooterLine(l, fullName, generatedAt);

  doc.setTitle(`Handoff Brief — ${fullName}`);
  doc.setCreator("Ownbase");

  return doc.save();
}
