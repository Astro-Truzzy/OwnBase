-- Admin metrics: break out the Free tier. The app computes a user's
-- *effective* plan lazily (src/lib/plan-limits.ts resolveEffectivePlanTier)
-- rather than writing "free" back to profiles.plan — a trial-expired or
-- subscription-lapsed account still has plan='trial'/'starter'/'pro'/'agency'
-- stored, so the admin RPCs were counting those accounts under their stale
-- stored plan instead of Free. This adds a SQL mirror of that same resolution
-- rule and uses it everywhere the admin dashboard buckets/labels a plan.
--
-- Mirrors resolveEffectivePlanTier + computeAccessStatus exactly:
--   active subscription (subscription_ends_at in the future) -> stored plan
--   live trial (trial_ends_at in the future)                 -> 'trial'
--   trial_ends_at never set (legacy pre-trial account)        -> stored plan
--   otherwise (trial ended, no active subscription)           -> 'free'

create or replace function public.normalize_plan_tier(plan_in text)
returns text
language sql
stable
as $$
  select case
    when plan_in in ('free', 'starter', 'pro', 'agency', 'trial') then plan_in
    else 'trial'
  end;
$$;

create or replace function public.effective_plan_tier(
  plan_in                text,
  trial_ends_at          timestamptz,
  subscription_ends_at   timestamptz,
  as_of                  timestamptz default now()
)
returns text
language sql
stable
as $$
  select case
    when subscription_ends_at is not null and subscription_ends_at > as_of
      then public.normalize_plan_tier(plan_in)
    when trial_ends_at is not null and trial_ends_at > as_of
      then 'trial'
    when trial_ends_at is null
      then public.normalize_plan_tier(plan_in)
    else 'free'
  end;
$$;

revoke execute on function public.normalize_plan_tier(text) from public, authenticated;
revoke execute on function public.effective_plan_tier(text, timestamptz, timestamptz, timestamptz) from public, authenticated;
grant execute on function public.normalize_plan_tier(text) to service_role;
grant execute on function public.effective_plan_tier(text, timestamptz, timestamptz, timestamptz) to service_role;

-- ── get_admin_overview_metrics: bucket by effective plan, add plan_free ──────
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
    'plan_free',           coalesce((select cnt from plan_counts where plan = 'free'), 0),
    'plan_trial',          coalesce((select cnt from plan_counts where plan = 'trial'), 0),
    'plan_starter',        coalesce((select cnt from plan_counts where plan = 'starter'), 0),
    'plan_pro',            coalesce((select cnt from plan_counts where plan = 'pro'), 0),
    'plan_agency',         coalesce((select cnt from plan_counts where plan = 'agency'), 0),
    'trials_expiring_7d',  (select cnt from trials_expiring_7d),
    'repos_total',         (select cnt from repos_total),
    'uploads_total',       (select cnt from uploads_total),
    'summaries_month',     (select cnt from summaries_month),
    'webhook_pending_7d',  (select cnt from webhook_pending_7d),
    'inactive_with_repos', (select cnt from inactive_with_repos)
  );
$$;

-- ── get_admin_plan_history: add free_count, bucket by effective plan ────────
-- Postgres won't let CREATE OR REPLACE change a RETURNS TABLE column list.
drop function if exists get_admin_plan_history(int);

create function get_admin_plan_history(months_back int default 6)
returns table(
  month date,
  trial_count bigint,
  starter_count bigint,
  pro_count bigint,
  agency_count bigint,
  free_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('month', au.created_at)::date as month,
    count(*) filter (
      where public.effective_plan_tier(p.plan, p.trial_ends_at, p.subscription_ends_at, now()) = 'trial'
    ) as trial_count,
    count(*) filter (
      where public.effective_plan_tier(p.plan, p.trial_ends_at, p.subscription_ends_at, now()) = 'starter'
    ) as starter_count,
    count(*) filter (
      where public.effective_plan_tier(p.plan, p.trial_ends_at, p.subscription_ends_at, now()) = 'pro'
    ) as pro_count,
    count(*) filter (
      where public.effective_plan_tier(p.plan, p.trial_ends_at, p.subscription_ends_at, now()) = 'agency'
    ) as agency_count,
    count(*) filter (
      where public.effective_plan_tier(p.plan, p.trial_ends_at, p.subscription_ends_at, now()) = 'free'
    ) as free_count
  from auth.users au
  left join profiles p on p.user_id = au.id
  where au.created_at >= date_trunc('month', now())
    - ((months_back - 1) || ' months')::interval
  group by 1
  order by 1;
$$;

-- ── get_admin_users_page: label each user with their effective plan ─────────
create or replace function get_admin_users_page(
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
revoke execute on function get_admin_plan_history(int)          from public, authenticated;
revoke execute on function get_admin_users_page(int, int, text) from public, authenticated;
grant execute on function get_admin_overview_metrics()          to service_role;
grant execute on function get_admin_plan_history(int)           to service_role;
grant execute on function get_admin_users_page(int, int, text)  to service_role;
