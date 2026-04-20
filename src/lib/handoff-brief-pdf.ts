/**
 * Server-side PDF generation for the Handoff Brief.
 * Uses pdf-lib; no sensitive data (e.g. env values) is included.
 */

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
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const LINE_HEIGHT = 14;
const SECTION_GAP = 20;
const TITLE_SIZE = 16;
const HEADING_SIZE = 12;
const BODY_SIZE = 10;

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

function drawWrappedText(
  page: PDFPage,
  text: string,
  opts: {
    x: number;
    y: number;
    font: PDFFont;
    size?: number;
    maxChars?: number;
  }
): number {
  const { x, y, font, size = BODY_SIZE, maxChars = 85 } = opts;
  const lines = wrapLines(text, maxChars);
  let currentY = y;
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= LINE_HEIGHT;
  }
  return currentY;
}

function drawSectionHeading(
  page: PDFPage,
  title: string,
  opts: { x: number; y: number; font: PDFFont; fontBold: PDFFont }
): number {
  const { x, y, fontBold } = opts;
  page.drawText(title, {
    x,
    y,
    size: HEADING_SIZE,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  return y - LINE_HEIGHT - 4;
}

function drawBulletList(
  page: PDFPage,
  items: string[],
  opts: { x: number; y: number; font: PDFFont; maxChars?: number }
): number {
  let { y } = opts;
  const { x, font, maxChars = 80 } = opts;
  for (const item of items) {
    const lines = wrapLines(item, maxChars);
    for (let i = 0; i < lines.length; i++) {
      const prefix = i === 0 ? "• " : "  ";
      page.drawText(prefix + lines[i], {
        x,
        y,
        size: BODY_SIZE,
        font,
        color: rgb(0.25, 0.25, 0.25),
      });
      y -= LINE_HEIGHT;
    }
    y -= 2;
  }
  return y;
}

function drawNotAvailable(
  page: PDFPage,
  opts: { x: number; y: number; font: PDFFont }
): number {
  const { x, y, font } = opts;
  page.drawText("Not available.", {
    x,
    y,
    size: BODY_SIZE,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });
  return y - LINE_HEIGHT - 8;
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
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // ----- Logo placeholder -----
  page.drawRectangle({
    x: MARGIN,
    y: y - 28,
    width: 120,
    height: 28,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 1,
  });
  page.drawText("Ownbase", {
    x: MARGIN + 8,
    y: y - 22,
    size: 11,
    font: helveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 50;

  // ----- Title -----
  page.drawText("Handoff Brief", {
    x: MARGIN,
    y,
    size: 22,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 28;

  page.drawText(fullName, {
    x: MARGIN,
    y,
    size: 12,
    font: helvetica,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 8;

  if (repoDescription) {
    y = drawWrappedText(page, repoDescription, {
      x: MARGIN,
      y,
      font: helvetica,
      maxChars: 90,
    });
    y -= SECTION_GAP;
  } else {
    y -= SECTION_GAP;
  }

  const sections: { heading: string; run: () => void }[] = [];

  // ----- 1. Project Overview -----
  sections.push({
    heading: "Project Overview",
    run: () => {
      y = drawSectionHeading(page, "Project Overview", {
        x: MARGIN,
        y,
        font: helvetica,
        fontBold: helveticaBold,
      });
      y = drawWrappedText(page, summary.summary, {
        x: MARGIN,
        y,
        font: helvetica,
      });
      y -= SECTION_GAP;
    },
  });

  // ----- 2. Tech Stack Detected -----
  const techItems = [
    ...summary.keyComponents,
    ...summary.externalServices,
  ].filter(Boolean);
  sections.push({
    heading: "Tech Stack Detected",
    run: () => {
      y = drawSectionHeading(page, "Tech Stack Detected", {
        x: MARGIN,
        y,
        font: helvetica,
        fontBold: helveticaBold,
      });
      if (techItems.length > 0) {
        y = drawBulletList(page, techItems, { x: MARGIN, y, font: helvetica });
      } else {
        y = drawNotAvailable(page, { x: MARGIN, y, font: helvetica });
      }
      y -= SECTION_GAP;
    },
  });

  // ----- 3. Key Features -----
  sections.push({
    heading: "Key Features",
    run: () => {
      y = drawSectionHeading(page, "Key Features", {
        x: MARGIN,
        y,
        font: helvetica,
        fontBold: helveticaBold,
      });
      if (summary.keyComponents.length > 0) {
        y = drawBulletList(page, summary.keyComponents, {
          x: MARGIN,
          y,
          font: helvetica,
        });
      } else {
        y = drawNotAvailable(page, { x: MARGIN, y, font: helvetica });
      }
      y -= SECTION_GAP;
    },
  });

  // ----- 4. External Integrations -----
  const integrations = [
    ...summary.externalServices,
    ...summary.paymentIntegrations,
    ...summary.authentication,
  ].filter(Boolean);
  sections.push({
    heading: "External Integrations",
    run: () => {
      y = drawSectionHeading(page, "External Integrations", {
        x: MARGIN,
        y,
        font: helvetica,
        fontBold: helveticaBold,
      });
      if (integrations.length > 0) {
        y = drawBulletList(page, integrations, {
          x: MARGIN,
          y,
          font: helvetica,
        });
      } else {
        y = drawNotAvailable(page, { x: MARGIN, y, font: helvetica });
      }
      y -= SECTION_GAP;
    },
  });

  // ----- 5. Environment Variables -----
  sections.push({
    heading: "Environment Variables",
    run: () => {
      y = drawSectionHeading(page, "Environment Variables", {
        x: MARGIN,
        y,
        font: helvetica,
        fontBold: helveticaBold,
      });
      page.drawText(
        "Not detected. Configure per your deployment documentation. Do not commit secrets.",
        {
          x: MARGIN,
          y,
          size: BODY_SIZE,
          font: helvetica,
          color: rgb(0.45, 0.45, 0.45),
        }
      );
      y -= LINE_HEIGHT + SECTION_GAP;
    },
  });

  // ----- 6. Setup Instructions -----
  sections.push({
    heading: "Setup Instructions",
    run: () => {
      y = drawSectionHeading(page, "Setup Instructions", {
        x: MARGIN,
        y,
        font: helvetica,
        fontBold: helveticaBold,
      });
      y = drawNotAvailable(page, { x: MARGIN, y, font: helvetica });
      y -= SECTION_GAP;
    },
  });

  // ----- 7. Risk Indicators (optional, no clutter) -----
  if (summary.riskIndicators.length > 0) {
    sections.push({
      heading: "Risk Indicators",
      run: () => {
        y = drawSectionHeading(page, "Risk Indicators", {
          x: MARGIN,
          y,
          font: helvetica,
          fontBold: helveticaBold,
        });
        y = drawBulletList(page, summary.riskIndicators, {
          x: MARGIN,
          y,
          font: helvetica,
        });
        y -= SECTION_GAP;
      },
    });
  }

  const minY = MARGIN + 40;
  for (const s of sections) {
    if (y < minY) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    s.run();
  }

  // Metadata
  doc.setTitle(`Handoff Brief — ${fullName}`);
  doc.setCreator("Ownbase");

  return doc.save();
}
