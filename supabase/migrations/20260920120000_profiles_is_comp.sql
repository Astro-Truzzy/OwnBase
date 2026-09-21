-- Comped accounts: a paid tier granted without payment (client accommodation,
-- pilot, internal account). Without a marker these are indistinguishable from
-- real subscribers, so they inflate Est. MRR, Paying Users and Conversion on
-- the admin dashboard with revenue nobody is actually paying.
--
-- is_comp is a revenue-attribution flag ONLY. Entitlements are untouched: a
-- comped account keeps its full tier, because access resolution keys off
-- plan + subscription_ends_at (src/lib/plan-limits.ts resolveEffectivePlanTier)
-- and never off this column.
--
-- The admin RPCs therefore expose two views of the same population:
--   plan_*    entitlement view — every account on that effective tier (comps included)
--   paying_*  revenue view     — same tier, excluding comps

-- ── 1. The column ───────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_comp boolean not null default false;

-- ── 2. Extend the billing-field guard to cover is_comp ──────────────────────
-- Body copied verbatim from 20260518120000_security_hardening.sql; the only
-- additions are the two is_comp lines. The RLS policy "Users can update own
-- profile" lets any authenticated user write their own row, so without this a
-- user could mark themselves comped and quietly vanish from revenue reporting.

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
    new.is_comp := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.plan is distinct from old.plan
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.subscription_ends_at is distinct from old.subscription_ends_at
      or new.paystack_customer_code is distinct from old.paystack_customer_code
      or new.paystack_subscription_code is distinct from old.paystack_subscription_code
      or new.is_comp is distinct from old.is_comp
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

-- ── 3. get_admin_overview_metrics: add the paying_* split + comped_users ────
-- plan_* buckets are intentionally unchanged (entitlement view). paying_* is
-- the same bucketing with comps filtered out, which is what the TS layer now
-- derives MRR / Paying Users / Conversion from.

create or replace function get_admin_overview_metrics()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with
    plan_counts as (
      select
        public.effective_plan_tier(plan, trial_ends_at, subscription_ends_at, now()) as plan,
        count(*) as cnt
      from profiles
      group by 1
    ),
    paying_counts as (
      select
        public.effective_plan_tier(plan, trial_ends_at, subscription_ends_at, now()) as plan,
        count(*) as cnt
      from profiles
      where not is_comp
      group by 1
    ),
    comped as (
      select count(*) as cnt from profiles where is_comp
    ),
    total_users as (
      select count(*) as total from auth.users
    ),
    new_7d as (
      select count(*) as cnt
      from auth.users
      where created_at >= now() - interval '7 days'
    ),
    new_30d as (
      select count(*) as cnt
      from auth.users
      where created_at >= now() - interval '30 days'
    ),
    active_7d as (
      select count(distinct user_id) as cnt
      from activity_log
      where created_at >= now() - interval '7 days'
    ),
    active_30d as (
      select count(distinct user_id) as cnt
      from activity_log
      where created_at >= now() - interval '30 days'
    ),
    trials_expiring_7d as (
      select count(*) as cnt
      from profiles
      where coalesce(plan, 'trial') = 'trial'
        and trial_ends_at between now() and now() + interval '7 days'
    ),
    repos_total as (
      select count(*) as cnt from tracked_repos
    ),
    uploads_total as (
      select count(*) as cnt from uploaded_projects
    ),
    summaries_month as (
      select count(*) as cnt
      from activity_log
      where action_type = 'summary_generated'
        and created_at >= date_trunc('month', now())
    ),
    -- Webhook events received in last 7 days without a processed_at stamp = still pending/failed
    webhook_pending_7d as (
      select count(*) as cnt
      from paystack_webhook_events
      where received_at >= now() - interval '7 days'
        and processed_at is null
    ),
    inactive_with_repos as (
      select count(distinct tr.user_id) as cnt
      from tracked_repos tr
      where not exists (
        select 1
        from activity_log al
        where al.user_id = tr.user_id
          and al.created_at >= now() - interval '30 days'
      )
    )
  select jsonb_build_object(
    'total_users',         (select total from total_users),
    'new_7d',              (select cnt from new_7d),
    'new_30d',             (select cnt from new_30d),
    'active_7d',           (select cnt from active_7d),
    'active_30d',          (select cnt from active_30d),
    -- Entitlement view: who is on which effective tier (comps included)
    'plan_free',           coalesce((select cnt from plan_counts where plan = 'free'), 0),
    'plan_trial',          coalesce((select cnt from plan_counts where plan = 'trial'), 0),
    'plan_starter',        coalesce((select cnt from plan_counts where plan = 'starter'), 0),
    'plan_pro',            coalesce((select cnt from plan_counts where plan = 'pro'), 0),
    'plan_agency',         coalesce((select cnt from plan_counts where plan = 'agency'), 0),
    -- Revenue view: same bucketing, comps excluded
    'paying_starter',      coalesce((select cnt from paying_counts where plan = 'starter'), 0),
    'paying_pro',          coalesce((select cnt from paying_counts where plan = 'pro'), 0),
    'paying_agency',       coalesce((select cnt from paying_counts where plan = 'agency'), 0),
    'comped_users',        (select cnt from comped),
    'trials_expiring_7d',  (select cnt from trials_expiring_7d),
    'repos_total',         (select cnt from repos_total),
    'uploads_total',       (select cnt from uploads_total),
    'summaries_month',     (select cnt from summaries_month),
    'webhook_pending_7d',  (select cnt from webhook_pending_7d),
    'inactive_with_repos', (select cnt from inactive_with_repos)
  );
$$;

-- ── 4. get_admin_users_page: surface is_comp for the admin users table ──────
-- Postgres won't let CREATE OR REPLACE change a RETURNS TABLE column list
-- (adding is_comp here), so drop first.

drop function if exists get_admin_users_page(int, int, text);

create function get_admin_users_page(
  page_limit  int  default 25,
  page_offset int  default 0,
  search_email text default null
)
returns table(
  user_id              uuid,
  email                text,
  plan                 text,
  trial_ends_at        timestamptz,
  subscription_ends_at timestamptz,
  is_comp              boolean,
  tracked_repos_count  bigint,
  last_activity        timestamptz,
  created_at           timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    au.id                              as user_id,
    au.email,
    public.effective_plan_tier(p.plan, p.trial_ends_at, p.subscription_ends_at, now()) as plan,
    p.trial_ends_at,
    p.subscription_ends_at,
    coalesce(p.is_comp, false)         as is_comp,
    coalesce(r.cnt, 0)                 as tracked_repos_count,
    la.last_at                         as last_activity,
    au.created_at
  from auth.users au
  left join profiles p on p.user_id = au.id
  left join lateral (
    select count(*) as cnt
    from tracked_repos tr
    where tr.user_id = au.id
  ) r on true
  left join lateral (
    select max(created_at) as last_at
    from activity_log al
    where al.user_id = au.id
  ) la on true
  where (
    search_email is null
    or au.email ilike '%' || search_email || '%'
  )
  order by au.created_at desc
  limit page_limit
  offset page_offset;
$$;

revoke execute on function get_admin_overview_metrics()         from public, authenticated;
revoke execute on function get_admin_users_page(int, int, text) from public, authenticated;
grant execute on function get_admin_overview_metrics()          to service_role;
grant execute on function get_admin_users_page(int, int, text)  to service_role;

-- ── 5. Index for the comp lookups ──────────────────────────────────────────
create index if not exists idx_profiles_is_comp
  on public.profiles(is_comp)
  where is_comp;
