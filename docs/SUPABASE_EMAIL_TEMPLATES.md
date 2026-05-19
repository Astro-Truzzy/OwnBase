# Supabase auth email templates (Ownbase)

Branded HTML templates live in `docs/supabase-email-templates/`. Paste them into the Supabase Dashboard so confirmation and other auth emails match the product.

## Apply in Supabase Dashboard

1. Open **[Authentication → Email Templates](https://supabase.com/dashboard/project/_/auth/templates)** for your project.
2. For each template below, set the **Subject** and paste the **HTML body** (entire file contents).

| Template in Supabase | Subject line | HTML file |
|--------------------|--------------|-----------|
| **Confirm signup** | `Confirm your Ownbase account` | `confirm-signup.html` |
| **Reset password** | `Reset your Ownbase password` | `reset-password.html` |
| **Magic link** | `Sign in to Ownbase` | `magic-link.html` |

3. Under **Authentication → URL Configuration**, set **Site URL** to your production app URL (e.g. `https://yourapp.com`). The logo in emails loads from `{{ .SiteURL }}/LOGO/Icon-brandname.png`.
4. Send a test signup from `/signup` and open the email on desktop and mobile.

## What’s in the templates

- Ownbase colors (`#0891b2` accent, slate text) and card layout
- Logo from your deployed app (`public/LOGO/Icon-brandname.png`)
- Personalized greeting when `first_name` exists in signup metadata
- Primary CTA button plus plain link fallback
- **6-digit OTP** (`{{ .Token }}`) — set **Email OTP length** to `6` under Authentication → Providers → Email

## Custom SMTP (required for real users)

Supabase’s **built-in** email only sends to addresses on your **organization team** until you enable custom SMTP. For production signups, configure SMTP below.

### Option A — Resend (recommended)

1. Create an account at [resend.com](https://resend.com).
2. **Domains → Add domain** → enter your domain (e.g. `ownbase.com`).
3. Add the DNS records Resend shows (SPF, DKIM). Wait until status is **Verified**.
4. **API Keys → Create API Key** → copy the key (starts with `re_`).
5. In Supabase: **Authentication → [SMTP Settings](https://supabase.com/dashboard/project/_/auth/smtp)** → enable **Custom SMTP**.

| Supabase field | Value |
|----------------|--------|
| **Sender email** | `hello@yourdomain.com` (must use your verified domain) |
| **Sender name** | `Ownbase` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` (or `587` if 465 is blocked) |
| **Username** | `resend` (literal word, not your email) |
| **Password** | Your Resend API key (`re_...`) |
| **Minimum interval per user** | `60` (default is fine) |

6. Save. Sign up with a **non-team** email on `/signup` to test.
7. Optional: raise **Authentication → Rate Limits → Email** after SMTP is working (new SMTP projects start around 30 emails/hour).

Resend docs: [Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp).

### Option B — SendGrid

1. Create a SendGrid account and verify a sender domain or single sender.
2. **Settings → API Keys** → create a key with **Mail Send** permission.
3. Use **Settings → Sender Authentication** for domain DNS (SPF/DKIM).

| Supabase field | Value |
|----------------|--------|
| **Host** | `smtp.sendgrid.net` |
| **Port** | `587` |
| **Username** | `apikey` (literal) |
| **Password** | Your SendGrid API key |
| **Sender email** | Address on your verified domain |

### After SMTP is enabled

- Your HTML templates in **Email Templates** are unchanged.
- Mail comes from your domain instead of Supabase’s default.
- All sign-up, reset, and magic-link emails can go to any user email.

## Email OTP at signup

Ownbase shows a **6-digit verification code** step after email/password signup. Users enter the code from the confirmation email on `/signup` (no separate page).

### Supabase settings

1. **Authentication → Providers → Email**
   - Enable **Email** provider
   - Turn on **Confirm email** (users must verify before a full session)
   - Set **Email OTP length** to **6** (must match `EMAIL_OTP_LENGTH` in `src/lib/auth/email-otp.ts`)

2. **Authentication → Email Templates → Confirm signup**
   - Paste `confirm-signup.html` (must include `{{ .Token }}` for the OTP)
   - Subject: `Confirm your Ownbase account`

3. **Custom SMTP (Resend)** must be configured so confirmation emails are delivered.

4. **Authentication → URL Configuration**
   - Keep `/auth/callback` in redirect URLs (still used if the user clicks the link in the email instead of the code).

### Flow

1. User submits signup form → Supabase sends email with a 6-digit OTP (`{{ .Token }}`)  
2. App shows “Verify your email” with OTP input  
3. `verifyOtp({ email, token, type: 'signup' })` → session → redirect to dashboard  

Users can still confirm via the **link** in the email if they prefer.

## Preview locally

Supabase does not preview templates in-repo. After pasting HTML:

- Use **Send test email** in the template editor if available, or
- Sign up with a real address on staging/production.

## Updating templates

Edit the `.html` files in this repo, then re-paste into the dashboard (or use the [Management API](https://supabase.com/docs/guides/auth/auth-email-templates) with `mailer_templates_confirmation_content` etc.).

Related: [AUTH_REDIRECTS.md](./AUTH_REDIRECTS.md) for callback URLs used after the user clicks **Confirm email**.
