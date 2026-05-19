-- Security hardening: profiles billing columns, webhook ledger RLS, activity log inserts.

-- ── 1. Protect profiles billing columns from client tampering ──

create or replace function public.is_service_role_request()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

create or replace function public.guard_profiles_billing_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_service_role_request() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := coalesce(new.plan, 'trial');
    if new.plan is distinct from 'trial' then
      new.plan := 'trial';
    end if;
    new.trial_ends_at := null;
    new.subscription_ends_at := null;
    new.paystack_customer_code := null;
    new.paystack_subscription_code := null;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.plan is distinct from old.plan
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.subscription_ends_at is distinct from old.subscription_ends_at
      or new.paystack_customer_code is distinct from old.paystack_customer_code
      or new.paystack_subscription_code is distinct from old.paystack_subscription_code
    then
      raise exception 'billing fields on profiles are read-only'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profiles_billing_fields on public.profiles;
create trigger guard_profiles_billing_fields
  before insert or update on public.profiles
  for each row
  execute function public.guard_profiles_billing_fields();

-- ── 2. paystack_webhook_events: service role only ──

alter table public.paystack_webhook_events enable row level security;

revoke all on table public.paystack_webhook_events from anon, authenticated;
grant all on table public.paystack_webhook_events to service_role;

-- ── 3. activity_log: no client-side inserts (server / service role only) ──

drop policy if exists "Users can insert own activity" on public.activity_log;
