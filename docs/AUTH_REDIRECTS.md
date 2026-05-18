# Authentication redirects

OwnBase sends users through `/auth/callback` after OAuth (Google, GitHub, GitLab) and uses a `next` query param for the final in-app destination (usually `/dashboard`).

## 1. Environment variable (production)

In Vercel (or `.env.local` for local prod-like testing), set:

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

Use your canonical HTTPS URL with no trailing slash. This keeps OAuth `redirectTo` URLs stable when the app is behind proxies or preview domains.

## 2. Supabase Dashboard

Open **Project Settings → Authentication → URL Configuration**.

| Setting | Value |
|--------|--------|
| **Site URL** | `https://your-production-domain.com` |
| **Redirect URLs** | Add every origin where auth can complete (see below) |

**Redirect URLs to allowlist** (add each line):

```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

For Vercel preview deployments, either:

- Add each preview URL manually, e.g. `https://own-base-xxx.vercel.app/auth/callback`, or  
- Use a wildcard if your Supabase plan supports it: `https://*.vercel.app/auth/callback`

Without these entries, OAuth sign-in fails with a redirect URL mismatch error.

## 3. OAuth provider consoles

Each provider must allow Supabase’s callback URL (not your Next.js `/auth/callback` directly).

In **Supabase → Authentication → Providers**, copy the callback URL shown for each provider, then register it in:

| Provider | Where to register |
|----------|-------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth client → Authorized redirect URIs |
| **GitHub** | GitHub → Settings → Developer settings → OAuth Apps → Authorization callback URL |
| **GitLab** | GitLab → Preferences → Applications → Redirect URI |

See also [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).

## 4. How redirects work in the app

| Step | Behavior |
|------|----------|
| Visit `/dashboard` while logged out | Middleware sends you to `/login?redirectTo=/dashboard` |
| Sign in (email or OAuth) | After success, you land on `redirectTo` or `/dashboard` |
| OAuth flow | Browser → provider → Supabase → `/auth/callback?code=…&next=…` → final `next` path |
| Sign out | `/auth/sign-out` → `/login?signedOut=1` |

Post-auth paths are validated in `src/lib/auth/redirects.ts` so only same-origin paths like `/dashboard` or `/dashboard/repo/foo` are allowed.

## 5. Email sign-up confirmation

If email confirmation is enabled in Supabase, confirmation links use the same callback URL. Ensure **Redirect URLs** includes your production and local callback URLs, and **Site URL** matches production.

For branded confirmation emails (not the default plain Supabase template), see [SUPABASE_EMAIL_TEMPLATES.md](./SUPABASE_EMAIL_TEMPLATES.md).

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` (Google/GitHub/GitLab) | Add Supabase’s provider callback URL in the provider console |
| Supabase “redirect URL not allowed” | Add `https://<your-host>/auth/callback` under Redirect URLs |
| Lands on `/dashboard` instead of intended page | Check `redirectTo` is present on `/login`; middleware and forms pass it through |
| Works locally, fails on Vercel | Set `NEXT_PUBLIC_APP_URL` and add production + preview callback URLs in Supabase |
