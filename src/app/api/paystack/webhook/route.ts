import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackSignature } from "@/lib/paystack";
import {
  resolveAddonTypeFromPlanCode,
  resolveTierFromPlanCode,
  type PaystackPlanTier,
} from "@/lib/paystack-plans";
import type { AddonType } from "@/lib/plan-limits";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

type PaystackMetadata = {
  user_id?: string;
  plan_id?: string;
  plan_code?: string;
  addon_type?: string;
};

type PaystackPayload = {
  id?: string | number;
  status?: string;
  next_payment_date?: string;
  metadata?: PaystackMetadata;
  plan?: { plan_code?: string };
  customer?: { email?: string; customer_code?: string };
  subscription?: {
    subscription_code?: string;
    next_payment_date?: string;
    plan?: { plan_code?: string };
    plan_code?: string;
  };
  transaction?: {
    metadata?: PaystackMetadata;
    plan?: { plan_code?: string };
  };
};

function deriveEventKey(
  eventType: string,
  payload: PaystackPayload,
  rawBody: string
): { eventKey: string; paystackEventId: string | null } {
  const paystackEventId =
    payload.id == null ? null : String(payload.id);
  if (paystackEventId != null) {
    return {
      eventKey: `paystack:${eventType}:${paystackEventId}`,
      paystackEventId,
    };
  }
  const digest = createHash("sha256").update(rawBody).digest("hex");
  return { eventKey: `paystack:${eventType}:${digest}`, paystackEventId: null };
}

function detectPlanCode(payload: PaystackPayload): string | undefined {
  const metadata = payload.metadata ?? payload.transaction?.metadata;
  return (
    metadata?.plan_code ??
    payload.plan?.plan_code ??
    payload.subscription?.plan?.plan_code ??
    payload.subscription?.plan_code ??
    payload.transaction?.plan?.plan_code
  );
}

function derivePlanFromPayload(payload: PaystackPayload): PaystackPlanTier {
  const metadata = payload.metadata ?? payload.transaction?.metadata;
  if (
    metadata?.plan_id === "pro" ||
    metadata?.plan_id === "starter" ||
    metadata?.plan_id === "agency"
  ) {
    return metadata.plan_id;
  }
  return resolveTierFromPlanCode(detectPlanCode(payload)) ?? "starter";
}

/** Tells an add-on event (repos/seats) apart from a base-plan event — metadata is authoritative on the initial charge, plan_code on renewals. */
function detectAddonType(payload: PaystackPayload): AddonType | null {
  const metadata = payload.metadata ?? payload.transaction?.metadata;
  if (metadata?.addon_type === "repos" || metadata?.addon_type === "seats") {
    return metadata.addon_type;
  }
  return resolveAddonTypeFromPlanCode(detectPlanCode(payload));
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret?.startsWith("sk_")) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? null;

  if (!verifyPaystackSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: PaystackPayload };
  try {
    event = JSON.parse(rawBody) as { event: string; data: PaystackPayload };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event: eventType, data } = event;
  const successEvents = [
    "subscription.create",
    "charge.success",
    "invoice.create",
    "invoice.update",
  ];
  const nonRenewalEvents = [
    "subscription.disable",
    "subscription.not_renew",
    "invoice.failed",
    "charge.failed",
  ];

  if (!successEvents.includes(eventType) && !nonRenewalEvents.includes(eventType)) {
    return NextResponse.json({ received: true });
  }

  const { eventKey, paystackEventId } = deriveEventKey(eventType, data, rawBody);
  const metadata = data.metadata ?? data.transaction?.metadata;
  const subscriptionCode = data.subscription?.subscription_code;
  const customerCode = data.customer?.customer_code;
  const nextPaymentDate = data.subscription?.next_payment_date ?? data.next_payment_date;
  let userId = metadata?.user_id;

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error("Paystack webhook: admin client init failed", e);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { error: ledgerInsertError } = await supabase
    .from("paystack_webhook_events")
    .insert({
      event_key: eventKey,
      paystack_event_id: paystackEventId,
      event_type: eventType,
      user_id: userId ?? null,
      subscription_code: subscriptionCode ?? null,
      payload: event,
      received_at: new Date().toISOString(),
    });

  if (ledgerInsertError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (ledgerInsertError) {
    console.error("Paystack webhook: failed to insert event ledger", ledgerInsertError);
    return NextResponse.json({ error: "Webhook ledger insert failed" }, { status: 500 });
  }

  if (!userId && customerCode) {
    const { data: profileByCustomer } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("paystack_customer_code", customerCode)
      .maybeSingle();
    userId = profileByCustomer?.user_id;
  }

  if (!userId) {
    await supabase
      .from("paystack_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_key", eventKey);
    return NextResponse.json({ received: true, warning: "No user_id resolved" });
  }

  const normalizedStatus = (data.status ?? "").toLowerCase();
  const successfulInvoiceState =
    normalizedStatus === "" ||
    normalizedStatus === "success" ||
    normalizedStatus === "paid";

  const isSuccessEvent =
    successEvents.includes(eventType) &&
    (eventType !== "invoice.update" || successfulInvoiceState);
  const isTerminalEvent =
    eventType === "subscription.disable" || eventType === "subscription.not_renew";

  // Add-on events (repos/seats) are a separate, independent subscription —
  // never fall through to the base-plan branch below, which would otherwise
  // misclassify the add-on's plan_code via resolveTierFromPlanCode's
  // "unknown code -> starter" fallback and overwrite the user's real plan.
  const addonType = detectAddonType(data);
  if (addonType) {
    let addonError: { message: string } | null = null;
    if (isSuccessEvent) {
      const currentPeriodEndsAt = nextPaymentDate
        ? new Date(nextPaymentDate).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await supabase.from("addon_subscriptions").upsert(
        {
          user_id: userId,
          addon_type: addonType,
          status: "active",
          paystack_subscription_code: subscriptionCode ?? null,
          paystack_customer_code: customerCode ?? null,
          current_period_ends_at: currentPeriodEndsAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,addon_type" }
      );
      addonError = res.error;
    } else if (isTerminalEvent) {
      const res = await supabase
        .from("addon_subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("addon_type", addonType);
      addonError = res.error;
    }

    if (addonError) {
      console.error("Paystack webhook: addon subscription update failed", addonError);
      return NextResponse.json({ error: "Addon subscription update failed" }, { status: 500 });
    }

    await supabase
      .from("paystack_webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        user_id: userId,
        subscription_code: subscriptionCode ?? null,
      })
      .eq("event_key", eventKey);

    return NextResponse.json({ received: true });
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select(
      "plan, subscription_ends_at, paystack_subscription_code, paystack_customer_code"
    )
    .eq("user_id", userId)
    .maybeSingle();

  let error: { message: string } | null = null;
  if (isSuccessEvent) {
    const plan = derivePlanFromPayload(data);
    const subscriptionEndsAt = nextPaymentDate
      ? new Date(nextPaymentDate).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const update = {
      paystack_subscription_code:
        subscriptionCode ?? currentProfile?.paystack_subscription_code ?? null,
      paystack_customer_code:
        customerCode ?? currentProfile?.paystack_customer_code ?? null,
      subscription_ends_at: subscriptionEndsAt,
      plan,
      updated_at: new Date().toISOString(),
    };
    const res = await supabase.from("profiles").update(update).eq("user_id", userId);
    error = res.error;
  } else if (isTerminalEvent) {
    const res = await supabase
      .from("profiles")
      .update({
        subscription_ends_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    error = res.error;
  }

  if (error) {
    console.error("Paystack webhook: profile update failed", error);
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }

  await supabase
    .from("paystack_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      user_id: userId,
      subscription_code: subscriptionCode ?? null,
    })
    .eq("event_key", eventKey);

  return NextResponse.json({ received: true });
}
