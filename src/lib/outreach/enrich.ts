/**
 * Optional email enrichment via Hunter.io domain search.
 * Useful for OwnBase track (businesses that already have a website/domain).
 */
export async function findEmailForDomain(websiteUrl: string): Promise<{
  email: string | null;
  confidence: number | null;
}> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return { email: null, confidence: null };
  }

  let domain: string;
  try {
    domain = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    return { email: null, confidence: null };
  }

  const url = new URL("https://api.hunter.io/v2/domain-search");
  url.searchParams.set("domain", domain);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString());
  if (!res.ok) {
    const responseText = await res.text().catch(() => "<unable to read response>");
    console.error(
      `[outreach][hunter] failed to enrich email for domain=${domain} status=${res.status} ${res.statusText} response=${responseText}`,
    );
    return { email: null, confidence: null };
  }

  const data = (await res.json()) as {
    data?: {
      emails?: Array<{ value?: string; confidence?: number; type?: string }>;
    };
  };

  const emails = data.data?.emails ?? [];
  const preferred =
    emails.find((e) => e.type === "personal") ??
    emails.find((e) => e.value) ??
    null;

  return {
    email: preferred?.value?.toLowerCase() ?? null,
    confidence: preferred?.confidence ?? null,
  };
}
