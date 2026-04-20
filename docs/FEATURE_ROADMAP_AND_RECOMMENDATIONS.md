# Ownbase — Feature Roadmap & Recommendations for Commercial Launch

This document summarizes the current product, user flow, and **prioritized suggestions** to make Ownbase sellable to real paying users.

---

## 1. Current State Summary

### What Ownbase Does
- **Value prop:** Business owners own and control source code when external devs build for them (GitHub, GitLab, or zip upload).
- **Core flows:** Sign up → Connect repos or upload zips → Track repos in “organization” → View AI summary, collaborators, activity → Generate handoff brief PDF → Manage/revoke dev access.

### Existing Strengths
- Clear landing (hero, how-it-works, CTA).
- Auth: email + Google, GitHub, GitLab OAuth.
- Dashboard: org summary, tracked repos, uploads, provider-specific repo list.
- Repo detail: folder structure, AI summary, track/untrack, collaborators (GitHub), activity log, protection/audit export, handoff brief PDF.
- Devs page: per-repo collaborator list and revoke (GitHub).
- Uploads: zip upload (50 MB), download, delete; per-user storage.
- Solid stack: Next.js 15, Supabase, OpenAI, Tailwind, Motion.

### Gaps for a Commercial Product
- No billing, plans, or usage limits.
- No guided onboarding.
- No teams/workspaces or org-level billing.
- No invites or roles.
- No product analytics or lifecycle email.
- GitLab has less parity (no AI summary, no in-app collaborator management for handoff).
- Footer links (Pricing, About, Contact, Privacy, Terms) are placeholder (`#`).
- No error monitoring (e.g. Sentry) or public API.

---

## 2. Prioritized Recommendations

### Tier 1 — Must-Have for Paid Users

| # | Feature | Why | Effort |
|---|--------|-----|--------|
| 1 | **Pricing page + plans** | Visitors and trial users need to see what they pay. Add a `/pricing` section (or page) with 2–3 tiers (e.g. Starter / Pro / Team), feature comparison, and CTA to sign up or “Start free trial”. | Medium |
| 2 | **Billing (Stripe)** | Enable real revenue: subscriptions (monthly/yearly), usage-based add-ons (e.g. AI summaries/month, storage). Start with Stripe Checkout + Customer Portal; store `stripe_customer_id` and `subscription_status` on `profiles` or a new `subscriptions` table. | High |
| 3 | **Usage limits & enforcement** | Tie limits to plan: e.g. max tracked repos, max uploads, AI summaries per month. Show usage in dashboard (e.g. “3/10 repos”, “5/20 summaries this month”) and block or soft-prompt when over. | Medium |
| 4 | **Free trial** | 14-day full-access trial (or limited repos) so users can experience value before paying. Implement with `trial_ends_at` and gate features after trial. | Low–Medium |
| 5 | **Legal pages** | Replace `#` with real routes: Privacy Policy, Terms of Service, (optional) Cookie Policy. Required for trust and Stripe/payments. | Low |

**Suggested order:** Legal pages first (quick), then Pricing page, then Stripe + limits + trial together.

---

### Tier 2 — Activation & Retention

| # | Feature | Why | Effort |
|---|--------|-----|--------|
| 6 | **Onboarding checklist** | First-time dashboard: “Add your first repo”, “Generate your first summary”, “Download a handoff brief”. Progress state in DB or localStorage; celebratory state when done. Increases activation. | Low–Medium |
| 7 | **Welcome / lifecycle email** | Post-signup welcome, trial reminder (e.g. 3 days left), and “you’ve hit 80% of your limit”. Use Resend, SendGrid, or Supabase Edge Functions + provider. | Medium |
| 8 | **In-app upgrade prompts** | When user hits a limit or tries a premium action: modal or banner with plan comparison and link to pricing/checkout. | Low |
| 9 | **Dashboard empty states** | Dedicated copy and primary actions when org/repos/uploads are empty (e.g. “Add your first repository” with clear button to Organization or Connect GitHub). | Low |

---

### Tier 3 — Product Depth & Parity

| # | Feature | Why | Effort |
|---|--------|-----|--------|
| 10 | **AI summary + handoff for GitLab** | Today only GitHub repos get AI summary and handoff PDF. Add GitLab support (fetch project files/README, same OpenAI pipeline, store in `repo_summaries` keyed by GitLab project id/path) so GitLab users get full value. | Medium |
| 11 | **AI summary for uploaded zips** | After upload, optionally “Analyze” to unpack (or sample) and run AI summary; store and allow handoff brief for uploads. Differentiates from “just storage”. | Medium |
| 12 | **Teams / workspaces** | Real multi-tenant orgs: create “Organization” with name, invite members (email), roles (admin vs member). Billing tied to org; shared tracked repos and uploads. Enables B2B “team” plan. | High |
| 13 | **Notifications / activity digest** | In-app (and optional email) when: collaborator added/removed, repo tracked/untracked, or weekly “activity digest” for tracked repos. | Medium |

---

### Tier 4 — Trust, Compliance & Scale

| # | Feature | Why | Effort |
|---|--------|-----|--------|
| 14 | **SSO / SAML (enterprise)** | For larger accounts, offer “Sign in with SSO” and optional SAML. Often required for enterprise sales. | High |
| 15 | **Audit log export (enhanced)** | Today: JSON export per repo. Add CSV/PDF option, date range, and org-level “Export all activity” for compliance storytelling. | Low–Medium |
| 16 | **Status page / security page** | Simple status page (e.g. status.ownbase.com or `/status`) and a “Security” or “Compliance” page describing data handling, encryption, and availability. | Low |
| 17 | **Public API + webhooks** | REST API for “list my repos”, “get summary”, “activity feed”; webhooks for events (repo tracked, collaborator changed). Enables integrations and power users. | High |

---

### Tier 5 — UI/UX Polish

| # | Feature | Why | Effort |
|---|--------|-----|--------|
| 18 | **Pricing in nav and footer** | Uncomment and add Pricing link in `LandingFooter` and `LandingNav` to `/pricing` or `/#pricing`. | Low |
| 19 | **About & Contact** | Replace `#` with `/about` and `/contact` (contact form that sends to your email or ticketing). Builds trust and lead capture. | Low |
| 20 | **Help / docs** | Simple “Help” or “Docs” (e.g. `/docs`) with “Getting started”, “Connecting GitHub/GitLab”, “Handoff brief”, “Billing”. Reduces support load. | Medium |
| 21 | **Keyboard shortcuts & search** | Global shortcut (e.g. Cmd+K) to search repos or actions; improves power-user experience. | Medium |
| 22 | **Mobile-friendly dashboard** | Ensure dashboard and repo detail are usable on small screens (dock behavior, tables, CTAs). | Low–Medium |
| 23 | **Loading & error states** | Skeleton loaders for dashboard and repo detail; friendly error messages with retry. You have some loading/error routes; ensure all key flows use them. | Low |

---

### Tier 6 — Operations & Growth

| # | Feature | Why | Effort |
|---|--------|-----|--------|
| 24 | **Error monitoring** | Integrate Sentry (or similar) for frontend and server errors. Critical for production and fixing issues paying users hit. | Low |
| 25 | **Product analytics** | Anonymous usage events: signup, repo added, summary generated, handoff downloaded, limit hit. Use PostHog, Mixpanel, or Vercel Analytics to understand funnels and retention. | Low–Medium |
| 26 | **Feature flags** | Launch pricing or new features behind flags (e.g. LaunchDarkly or simple DB/env flags) to roll out gradually. | Low |
| 27 | **Blog** | Uncomment Blog in footer; add `/blog` with 1–2 posts (e.g. “Why code ownership matters”, “How to hand off a project”). Helps SEO and trust. | Low–Medium |

---

## 3. Suggested Phased Rollout

**Phase 1 — “Can sell” (4–8 weeks)**  
- Legal pages (Privacy, Terms).  
- Pricing page with plans and CTAs.  
- Stripe: subscriptions + free trial + usage limits (repos, AI summaries).  
- In-app upgrade prompts and usage display.  
- Pricing + Contact (and optionally About) in nav/footer.

**Phase 2 — “Stickier” (4–6 weeks)**  
- Onboarding checklist and empty states.  
- Welcome + trial reminder emails.  
- Error monitoring (Sentry).  
- Optional: basic product analytics.

**Phase 3 — “More value” (6–10 weeks)**  
- GitLab AI summary + handoff.  
- AI summary for uploads.  
- Help/docs section.  
- Optional: notifications or activity digest.

**Phase 4 — “Enterprise & scale” (ongoing)**  
- Teams/workspaces and org billing.  
- SSO/SAML.  
- Public API and webhooks.  
- Blog and content.

---

## 4. Quick Wins You Can Do Immediately

1. **Footer and nav:** Add real links for Pricing (`/pricing` or `#pricing`), About (`/about`), Contact (`/contact`), Privacy (`/privacy`), Terms (`/terms`).  
2. **Pricing section on landing:** Add a “Pricing” block on the homepage (even with “Coming soon” or “Start free – upgrade when you need more”) and link from nav.  
3. **Dashboard empty state:** When `trackedRepos.length === 0`, show a clear “Add your first repository” card with primary CTA to Organization or connect provider.  
4. **Repo detail:** Ensure “Generate summary” and “Download handoff brief” are above the fold on desktop and tap-friendly on mobile.  
5. **Signup:** After signup, redirect to `/dashboard?onboarding=1` and show a one-time tooltip or checklist (“Add your first repo”).

---

## 5. Metrics to Track Once Live

- **Acquisition:** Signups per week, source (organic vs paid).  
- **Activation:** % signups who add ≥1 repo or upload within 7 days.  
- **Monetization:** Trial → paid conversion, MRR, LTV.  
- **Usage:** Repos per user, summaries per month, handoff downloads.  
- **Retention:** WAU/MAU, churn by plan.  
- **Health:** Error rate, P95 latency for key actions (summary, handoff PDF).

---

## 6. Summary

Ownbase already has a strong core: clear value proposition, auth, dashboard, repo tracking, AI summary, handoff brief, and activity/audit. To **sell as a business** and attract paying users, focus first on:

1. **Pricing + Stripe + limits + trial** so you can charge and enforce value.  
2. **Legal pages and trust** (Privacy, Terms, Contact, About).  
3. **Onboarding and email** so users reach “aha” and stay.  
4. **GitLab parity and upload AI** so all code types deliver the same value.  
5. **Teams/workspaces** when you target teams and larger accounts.

Use the phased plan above as a roadmap and the “Quick wins” for immediate impact. If you tell me which phase or feature you want to implement first, I can help with concrete implementation steps (e.g. Stripe webhooks, new tables, or UI components).
