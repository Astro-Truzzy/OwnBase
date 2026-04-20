# Paystack setup for Ownbase

## 1. Create plans in Paystack

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com).
2. Go to **Settings → Plans** (or **Plans** in the sidebar).
3. Create at least one plan, e.g.:
   - **Starter**: ₦9,999/month, interval **monthly**.
   - **Pro**: ₦24,999/month, interval **monthly**.
4. Copy each plan’s **Plan code** (e.g. `PLN_xxxx`).

## 2. Environment variables

Add to `.env` (or Vercel/hosting env):

```env
PAYSTACK_SECRET_KEY=sk_live_xxxx          # From Paystack Dashboard → Settings → API Keys
PAYSTACK_PLAN_STARTER=PLN_xxxx            # Plan code for Starter
PAYSTACK_PLAN_PRO=PLN_xxxx                # Plan code for Pro (optional)
SUPABASE_SERVICE_ROLE_KEY=xxxx            # Required for webhook (Supabase Dashboard → Settings → API)
```

For local testing you can use **Test** keys and test plan codes (`sk_test_...`, `PLN_...` from test mode).

## 3. Webhook URL

1. In Paystack Dashboard go to **Settings → Webhooks**.
2. Set **Webhook URL** to: `https://your-domain.com/api/paystack/webhook`
3. Paystack will send events to this URL. The route verifies the signature and updates the user’s subscription in the database.

Events used: `subscription.create`, `charge.success`, `invoice.create`, `invoice.update`.

## 4. Flow

- **Sign up** → user gets a **1-month free trial** (`trial_ends_at` set in DB).
- **No charge** until they click **Subscribe** on the Billing page and complete payment on Paystack.
- After payment, Paystack sends a webhook; we set `subscription_ends_at` and `paystack_subscription_code` on their profile.
- When **trial expires** and there’s no active subscription, the dashboard shows a banner asking them to subscribe.

## 5. Optional: App URL for callback

If your app runs on a custom domain, set:

```env
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

This is used as the Paystack **callback_url** after payment (e.g. redirect to `/dashboard/billing?success=1`). If unset, the code falls back to `VERCEL_URL` or `http://localhost:3000`.
