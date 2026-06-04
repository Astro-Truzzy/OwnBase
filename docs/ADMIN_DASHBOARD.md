# Admin Dashboard

Internal business command center at `/admin` — visible only to accounts whose emails are in `ADMIN_ALLOWED_EMAILS`.

---

## Setup

### 1. Add your email to the environment

In `.env.local` (development) or Vercel → Settings → Environment Variables (production):

```env
ADMIN_ALLOWED_EMAILS=you@yourdomain.com
```

- Comma-separate multiple emails: `me@example.com,partner@example.com`
- The variable is server-only — **never** prefix with `NEXT_PUBLIC_`
- The account must already exist in Supabase Auth (sign up normally first)

### 2. Apply the database migration

```bash
supabase db push
```

Or paste `supabase/migrations/20260604120000_admin_metrics.sql` into the Supabase SQL editor.

This migration:
- Creates 7 admin RPC functions (service_role-only execute)
- Adds performance indexes on `profiles`, `activity_log`, and `paystack_webhook_events`

### 3. Access the dashboard

Sign in to OwnBase normally with your allowlisted email, then navigate to `/admin`.

---

## Security model

| Layer | What it does |
|-------|-------------|
| Middleware | Exempts `/admin` from the session-ending sign-out policy; gates unauthenticated requests to `/login`; email-checks against `ADMIN_ALLOWED_EMAILS` and redirects to `/admin/unauthorized` if denied |
| Layout (`src/app/admin/layout.tsx`) | Calls `requireAdminUser()` — redirects server-side if session or email check fails |
| API routes (`/api/admin/*`) | Call `requireAdminUserAPI()` — returns `401` instead of redirect |
| Database | RPC functions have `EXECUTE` revoked from `public` and `authenticated`; only `service_role` (used by `createAdminClient()`) can call them — user data never flows through RLS-bypass paths into the client |

**No admin flag on `profiles`** — email allowlist in env only. This prevents a compromised account from self-escalating.

---

## Dashboard pages

| Route | What you see |
|-------|--------------|
| `/admin` | Overview: all KPIs above the fold, alert strip, 30-day signup + DAU trends, plan breakdown |
| `/admin/users` | Searchable/paginated table: email, plan, status, repo count, last active, join date |
| `/admin/revenue` | Estimated MRR, plan mix, cohort table (signup month × plan), recent Paystack subscription events |
| `/admin/product` | Feature adoption (repos, uploads, summaries), retention signals, improvement signals |
| `/admin/system` | Webhook event log, env var checklist (set/missing — no secrets shown) |

---

## Metric definitions

| Metric | Source | Definition |
|--------|--------|------------|
| Total Users | `auth.users` | Count of all Supabase Auth accounts |
| New (7d / 30d) | `auth.users.created_at` | Accounts created within the window |
| Active (7d / 30d) | `activity_log` | Distinct users with at least one activity event |
| Paying Users | `profiles.plan` | `starter` + `pro` count |
| Est. MRR | `profiles.plan` | `(starter_count × ₦6,500) + (pro_count × ₦15,000)` · display-only, excludes trials, assumes all subscriptions are current |
| Trials expiring (7d) | `profiles.trial_ends_at` | Trials ending within the next 7 days |
| Repos total | `tracked_repos` | All tracked repos across all users |
| AI summaries (month) | `activity_log` where `action_type = 'summary_generated'` | Summaries generated in the current calendar month |
| Webhook pending (7d) | `paystack_webhook_events.processed_at IS NULL` | Events received in last 7 days with no `processed_at` — may indicate processing failures |
| Inactive w/ repos | `tracked_repos` ∩ no `activity_log` in 30d | Users who have repos but haven't been active — activation gap signal |

---

## API endpoints

Both require an authenticated session with an allowlisted email. Rate-limited to 120 req/min per user.

```
GET /api/admin/overview
```
Returns `{ metrics, signups, dau }` — the same data as the overview page.

```
GET /api/admin/users?page=0&limit=25&search=
```
Returns `{ users, total, page, limit }` — paginated user list.

---

## Rate limiting

Admin API paths (`/api/admin/*`) are covered by the `admin` rate-limit bucket: **120 requests / minute** per user ID (falls back to IP in dev).

---

## Troubleshooting

**Access denied on `/admin`**
- Confirm `ADMIN_ALLOWED_EMAILS` is set on your deployment (not just `.env.local`)
- The value must exactly match your Supabase Auth email (lowercased comparison)
- Make sure the variable does not have a trailing space or newline

**RPC errors in admin pages**
- Verify the migration ran: check Supabase SQL editor for `get_admin_overview_metrics`
- If functions were not found, run `supabase db push` or apply the SQL manually

**Webhook pending count stays high**
- Check Paystack webhook delivery logs in the Paystack dashboard
- Ensure `PAYSTACK_SECRET_KEY` is set and matches your Paystack account
- The `processed_at` column is updated when the webhook handler successfully processes the event
