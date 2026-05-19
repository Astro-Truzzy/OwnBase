# Security

## Database migrations

Apply pending migrations (including `20260518120000_security_hardening.sql`):

```bash
supabase db push
```

Or run SQL from the Supabase Dashboard SQL editor.

### Profiles billing columns

A trigger blocks authenticated users from changing `plan`, `trial_ends_at`, `subscription_ends_at`, or Paystack fields. Only the **service role** (webhooks, auth callback trial init) may update them.

### Test migration note

If `20260420103000_set_existing_users_pro_for_testing.sql` already ran in your environment, manually review `profiles.plan` and `subscription_ends_at` for users who should not have Pro access.

## Environment variables

| Variable | Notes |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; never `NEXT_PUBLIC_` |
| `PAYSTACK_SECRET_KEY` | Webhook HMAC verification |
| `GITHUB_TOKEN` | **Development only** — ignored in production |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | **Required in production** — encrypts stored GitHub OAuth tokens (see below) |
| `UPSTASH_REDIS_REST_URL` | Rate limiting (recommended for production) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (recommended for production) |
| `CRON_SECRET` | Bearer token for `/api/cron/report-digest` |

## GitHub token encryption

OAuth tokens in `user_github_tokens` are encrypted with **AES-256-GCM** when `GITHUB_TOKEN_ENCRYPTION_KEY` is set.

Generate a key:

```bash
openssl rand -base64 32
```

Add to Vercel / `.env.local`:

```env
GITHUB_TOKEN_ENCRYPTION_KEY=your-base64-32-byte-key
```

- **Production:** required; app throws if missing when saving tokens.
- **Development:** optional; tokens stored in plaintext until the key is set.
- **Existing rows:** plaintext tokens still work until users sign in with GitHub again (re-saves encrypted).

## Rate limiting

Middleware applies limits via [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted):

| Scope | Paths | Limit |
|-------|--------|-------|
| Auth | `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback` | 30 / 10 min per IP |
| AI | `/api/dashboard/ai/*`, commit insight API | 40 / min per user (or IP if unsigned) |

1. Create a free Upstash Redis database.
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel.
3. Redeploy.

Without Upstash, a dev-only in-memory limiter runs (not reliable on serverless). Set Upstash before production traffic.

## Sign out (CSRF)

Sign out uses **POST** to `/auth/sign-out`. GET returns `405` so third-party sites cannot log users out via `<img src="/auth/sign-out">`.

## Reporting issues

Report security concerns privately to the project owner rather than in public issues.
