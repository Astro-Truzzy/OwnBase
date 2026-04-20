# Google OAuth setup for Ownbase

To enable "Continue with Google" on the sign-up and login pages, configure Google as an OAuth provider in Google Cloud and Supabase.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project or select an existing one.
3. Open **APIs & Services** → **Credentials**.
4. Click **Create credentials** → **OAuth client ID**.
5. If prompted, configure the **OAuth consent screen** (e.g. External, add your app name and support email).
6. For **Application type**, choose **Web application**.
7. Under **Authorized redirect URIs**, add your Supabase auth callback URL:
   - In Supabase Dashboard go to **Authentication** → **URL Configuration**.
   - Copy the **Redirect URL** (e.g. `https://<project-ref>.supabase.co/auth/v1/callback`).
   - Paste it into Google as an authorized redirect URI (exact match required).
8. (Optional) Under **Authorized JavaScript origins**, add your app URLs (e.g. `http://localhost:3000` for dev, `https://yourdomain.com` for production).
9. Click **Create**, then copy the **Client ID** and **Client secret**.

## 2. Supabase Dashboard

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** → **Providers**.
3. Find **Google** and enable it.
4. Paste the **Client ID** and **Client secret** from Google Cloud.
5. Save.

## 3. Verify

- On the app’s sign-up (`/signup`) and login (`/login`) pages, use **Continue with Google**.
- You should be redirected to Google, then back to the app and into the dashboard after sign-in.

No code changes are required; the app already uses `signInWithOAuth({ provider: 'google' })` with the same callback as GitHub and GitLab.
