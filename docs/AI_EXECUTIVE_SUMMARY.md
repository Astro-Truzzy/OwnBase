# AI Executive Summary — System Architecture & Flow

## Overview

When a user **selects a repository** (clicks a repo on the dashboard), they are taken to a **repo detail page** where they can **generate** or **view** an AI-generated **Executive Summary**. The summary is stored in Supabase and written in plain business language for non-technical stakeholders.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User (Dashboard)                                                       │
│  Clicks repo card → /dashboard/repo/:owner/:name                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Repo detail page (SSR)                                                 │
│  • Resolves owner/name from URL                                         │
│  • Gets session (Supabase auth + GitHub provider_token)                 │
│  • Fetches repo metadata from GitHub API                                │
│  • Loads existing summary from Supabase (repo_summaries)                │
│  • Renders SummarySection (client) with initial summary or empty        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  User clicks "Generate summary" / "Regenerate"                          │
│  → Client: setLoading(true), call generateRepoSummary(repoId, fullName) │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Server Action: generateRepoSummary (actions.ts)                        │
│  1. Supabase: get user + session (provider_token)                        │
│  2. GitHub: fetchRelevantRepoContent(fullName, token)                   │
│     → README, package.json, manifests, root listing only                │
│  3. AI: generateExecutiveSummary({ fullName, files, rootListing })      │
│     → OpenAI with structured JSON output                                │
│  4. Supabase: upsert repo_summaries (user_id, repo_id, summary_json)    │
│  5. Return { success, summary?, error? }                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Client: setSummary(result.summary), router.refresh(), setLoading(false)│
│  UI shows summary sections or error message                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## AI Flow (detailed)

1. **Input**
   - Only **relevant files** are sent to the model (no full-repo scan):
     - README (and variants), `package.json`, `package-lock.json`, `requirements.txt`, `Pipfile`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`
   - **Root directory listing** (folder/file names) for high-level structure
   - Per-file and total size caps to keep token usage low (~25k chars total, ~30k bytes per file)

2. **Model**
   - **OpenAI** (`gpt-4o-mini`), using `response_format: { type: "json_object" }` for a fixed JSON shape.

3. **Output (ExecutiveSummary)**
   - **summary**: 3–5 sentences in plain business language (what it does, for whom).
   - **keyComponents**: Main features/capabilities in business terms.
   - **paymentIntegrations**: Payment processors, subscriptions, billing (e.g. Stripe, PayPal), or `[]`.
   - **authentication**: How users sign in (e.g. email/password, Google), or `[]`.
   - **externalServices**: Third-party APIs, databases, cloud services.
   - **riskIndicators**: Simple logic-based notes (e.g. "No README", "Many external dependencies"); no security scanning.

4. **Persistence**
   - One row per (user_id, repo_id) in `repo_summaries`; `summary_json` holds the ExecutiveSummary. Regenerating overwrites that row.

---

## Security & Configuration

- **API keys**: Only **environment variables** are used (`OPENAI_API_KEY`). No secrets in code or client.
- **GitHub**: Uses the user’s **OAuth provider_token** from the session; not stored in our DB beyond the session.
- **Supabase**: RLS ensures users can only read/write their own `repo_summaries` rows.

---

## Files Touched

| Area | Files |
|------|--------|
| DB / types | `src/lib/db/types.ts`, `supabase/migrations/..._repo_summaries.sql` |
| GitHub | `src/lib/github/fetch-repos.ts` (fetchRepo), `src/lib/github/fetch-repo-content.ts` |
| AI | `src/lib/ai/generate-summary.ts` |
| Server action | `src/app/dashboard/repo/actions.ts` |
| Repo detail UI | `src/app/dashboard/repo/[owner]/[name]/page.tsx`, `summary-section.tsx`, `loading.tsx`, `error.tsx` |
| Dashboard | `src/app/dashboard/repo-card.tsx` (link to repo detail) |
| Config | `.env.example` (OPENAI_API_KEY) |

---

## Running the migration

Apply the Supabase migration so `repo_summaries` exists and RLS is in place:

- If using Supabase CLI: `supabase db push` or run the SQL in the Supabase SQL editor.
- Table: `repo_summaries`; unique on `(user_id, repo_id)`.

After implementation, the flow is: **Dashboard → Select repo → Repo detail → Generate/View Executive Summary**, with loading and error states and summaries stored in Supabase.
