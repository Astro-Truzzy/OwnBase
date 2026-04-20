-- Trial and Paystack subscription fields for profiles.
-- trial_ends_at: when the 1-month free trial ends (set on first profile create).
-- plan: 'trial' | 'starter' | 'pro' (optional, for display).
-- subscription_ends_at: when current Paystack subscription period ends (updated via webhook).
-- paystack_*: for linking to Paystack customer/subscription.

alter table public.profiles
  add column if not exists trial_ends_at timestamptz,
  add column if not exists plan text default 'trial',
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_subscription_code text,
  add column if not exists subscription_ends_at timestamptz;

comment on column public.profiles.trial_ends_at is 'When the 1-month free trial ends; null for legacy users (no restriction).';
comment on column public.profiles.subscription_ends_at is 'When the current Paystack subscription period ends; extended on renewal webhook.';
