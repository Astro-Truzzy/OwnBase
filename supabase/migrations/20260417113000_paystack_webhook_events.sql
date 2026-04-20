-- Webhook event ledger for Paystack idempotency and replay protection.
-- We store an event key and raw payload reference so repeated deliveries are ignored.

create table if not exists public.paystack_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  paystack_event_id text,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  subscription_code text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_paystack_webhook_events_event_type
  on public.paystack_webhook_events(event_type);

create index if not exists idx_paystack_webhook_events_user_id
  on public.paystack_webhook_events(user_id);

create unique index if not exists uq_paystack_webhook_events_event_id
  on public.paystack_webhook_events(paystack_event_id)
  where paystack_event_id is not null;
