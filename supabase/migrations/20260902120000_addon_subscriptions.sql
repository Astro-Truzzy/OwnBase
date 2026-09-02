-- Add-on subscriptions: owner-purchasable capacity boosts (+5 repos, +2 seats)
-- layered on top of an eligible paid base plan (see ADDONS in
-- src/lib/pricing-tiers.ts). One row per addon_type per user — add-ons are a
-- single on/off toggle, not stackable quantities.
--
-- Mirrors the single-subscription billing model already on profiles: written
-- only by the Paystack webhook via the service role, never client-writable —
-- same protection as profiles' billing columns (guard_profiles_billing_fields
-- in 20260518120000_security_hardening.sql). The owner can read their own
-- rows to show status/manage links on the Billing page.

create table if not exists public.addon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- the owner
  addon_type text not null,                       -- 'repos' | 'seats'
  status text not null default 'active',          -- 'active' | 'canceled'
  paystack_customer_code text,
  paystack_subscription_code text,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, addon_type),
  constraint addon_subscriptions_type_chk   check (addon_type in ('repos', 'seats')),
  constraint addon_subscriptions_status_chk check (status in ('active', 'canceled'))
);

create index if not exists idx_addon_subscriptions_user_id on public.addon_subscriptions(user_id);

alter table public.addon_subscriptions enable row level security;

drop policy if exists "Users can read own addon subscriptions" on public.addon_subscriptions;
create policy "Users can read own addon subscriptions"
  on public.addon_subscriptions
  for select
  using (auth.uid() = user_id);

revoke all on table public.addon_subscriptions from anon, authenticated;
grant select on table public.addon_subscriptions to authenticated;
grant all on table public.addon_subscriptions to service_role;

drop trigger if exists addon_subscriptions_updated_at on public.addon_subscriptions;
create trigger addon_subscriptions_updated_at
  before update on public.addon_subscriptions
  for each row execute function public.set_updated_at();
