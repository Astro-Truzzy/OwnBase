/**
 * Paystack subscription helpers.
 * Set PAYSTACK_SECRET_KEY and plan codes (e.g. PAYSTACK_PLAN_STARTER) in env.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

export interface InitializeSubscriptionOptions {
  email: string;
  planCode: string;
  /** Optional: callback URL after payment (e.g. /dashboard/billing?success=1) */
  callbackUrl?: string;
  /** Optional: passed to webhook so we can update the right profile (e.g. { user_id: "..." }) */
  metadata?: Record<string, string>;
}

export interface InitializeSubscriptionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Initialize a Paystack transaction with a plan code (subscription).
 * Returns the URL to redirect the user to complete payment.
 * After success, Paystack sends subscription.create / charge.success webhooks.
 */
export async function initializeSubscription(
  options: InitializeSubscriptionOptions
): Promise<InitializeSubscriptionResult | { error: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_")) {
    return { error: "Paystack is not configured" };
  }

  const body: Record<string, unknown> = {
    email: options.email,
    plan: options.planCode,
    amount: "0", // Plan amount is used when plan is set
  };
  if (options.callbackUrl) {
    (body as Record<string, string>).callback_url = options.callbackUrl;
  }
  if (options.metadata && Object.keys(options.metadata).length > 0) {
    body.metadata = options.metadata;
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    status?: boolean;
    data?: { authorization_url: string; access_code: string; reference: string };
    message?: string;
  };

  if (!res.ok || !data.status || !data.data?.authorization_url) {
    return {
      error: data.message ?? "Failed to initialize Paystack subscription",
    };
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Verify Paystack webhook signature (HMAC SHA512 of raw body).
 */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Get the hosted "manage subscription" link for a subscription code.
 * User can update card or cancel from that page.
 */
export async function getSubscriptionManageLink(
  subscriptionCode: string
): Promise<{ link: string } | { error: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_")) {
    return { error: "Paystack is not configured" };
  }

  const res = await fetch(
    `${PAYSTACK_BASE}/subscription/${encodeURIComponent(subscriptionCode)}/manage/link`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    }
  );

  const data = (await res.json()) as {
    status?: boolean;
    data?: { link: string };
    message?: string;
  };

  if (!res.ok || !data.status || !data.data?.link) {
    return { error: data.message ?? "Could not get manage link" };
  }
  return { link: data.data.link };
}
