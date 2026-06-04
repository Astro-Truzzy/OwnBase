-- Admin metrics RPC functions for the internal business dashboard.
-- All functions run as SECURITY DEFINER (bypasses RLS, reads auth.users).
-- Execute permission is restricted to service_role only.
-- These are called exclusively from server-side admin code via createAdminClient().

-- ─────────────────────────────────────────────────────────────────────────────
-- Overview metrics: single JSON object with all headline KPIs
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_admin_overview_metrics()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with
    plan_counts as (
      select
        coalesce(plan, 'trial') as plan,
        count(*) as cnt
      from profiles
      group by coalesce(plan, 'trial')
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
    'plan_trial',          coalesce((select cnt from plan_counts where plan = 'trial'), 0),
    'plan_starter',        coalesce((select cnt from plan_counts where plan = 'starter'), 0),
    'plan_pro',            coalesce((select cnt from plan_counts where plan = 'pro'), 0),
    'trials_expiring_7d',  (select cnt from trials_expiring_7d),
    'repos_total',         (select cnt from repos_total),
    'uploads_total',       (select cnt from uploads_total),
    'summaries_month',     (select cnt from summaries_month),
    'webhook_pending_7d',  (select cnt from webhook_pending_7d),
    'inactive_with_repos', (select cnt from inactive_with_repos)
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily signup series (last N days)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_admin_signup_series(days_back int default 30)
returns table(day date, signups bigint)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('day', created_at)::date as day,
    count(*) as signups
  from auth.users
  where created_at >= now() - (days_back || ' days')::interval
  group by 1
  order by 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily active user series (last N days, based on activity_log)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_admin_dau_series(days_back int default 30)
returns table(day date, active_users bigint)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('day', created_at)::date as day,
    count(distinct user_id) as active_users
  from activity_log
  where created_at >= now() - (days_back || ' days')::interval
  group by 1
  order by 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Paginated user list for admin/users page
-- ─────────────────────────────────────────────────────────────────────────────
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
    coalesce(p.plan, 'trial')          as plan,
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Total user count (for pagination header)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_admin_users_count(search_email text default null)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)
  from auth.users
  where (search_email is null or email ilike '%' || search_email || '%');
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Plan distribution over time (last N months, cohort by signup month)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_admin_plan_history(months_back int default 6)
returns table(month date, trial_count bigint, starter_count bigint, pro_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('month', au.created_at)::date as month,
    count(*) filter (where coalesce(p.plan, 'trial') = 'trial')   as trial_count,
    count(*) filter (where p.plan = 'starter')                     as starter_count,
    count(*) filter (where p.plan = 'pro')                         as pro_count
  from auth.users au
  left join profiles p on p.user_id = au.id
  where au.created_at >= date_trunc('month', now())
    - ((months_back - 1) || ' months')::interval
  group by 1
  order by 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Recent Paystack webhook events for system health page
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_admin_webhook_events(event_limit int default 30)
returns table(
  id           uuid,
  event_key    text,
  event_type   text,
  processed    boolean,
  received_at  timestamptz,
  processed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    pwe.id,
    pwe.event_key,
    pwe.event_type,
    (pwe.processed_at is not null) as processed,
    pwe.received_at,
    pwe.processed_at
  from paystack_webhook_events pwe
  order by pwe.received_at desc
  limit event_limit;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Restrict execute to service_role only
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function get_admin_overview_metrics()                  from public, authenticated;
revoke execute on function get_admin_signup_series(int)                  from public, authenticated;
revoke execute on function get_admin_dau_series(int)                     from public, authenticated;
revoke execute on function get_admin_users_page(int, int, text)          from public, authenticated;
revoke execute on function get_admin_users_count(text)                   from public, authenticated;
revoke execute on function get_admin_plan_history(int)                   from public, authenticated;
revoke execute on function get_admin_webhook_events(int)                 from public, authenticated;

grant execute on function get_admin_overview_metrics()                   to service_role;
grant execute on function get_admin_signup_series(int)                   to service_role;
grant execute on function get_admin_dau_series(int)                      to service_role;
grant execute on function get_admin_users_page(int, int, text)           to service_role;
grant execute on function get_admin_users_count(text)                    to service_role;
grant execute on function get_admin_plan_history(int)                    to service_role;
grant execute on function get_admin_webhook_events(int)                  to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Performance indexes (idempotent — IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_profiles_plan        on public.profiles(plan);
create index if not exists idx_profiles_created_at  on public.profiles(created_at);
-- activity_log already has idx_activity_log_created_at (desc) from initial migration
-- Adding a composite index for the inactive-users query:
create index if not exists idx_activity_log_user_created
  on public.activity_log(user_id, created_at desc);
create index if not exists idx_paystack_webhook_received
  on public.paystack_webhook_events(received_at desc);
create index if not exists idx_paystack_webhook_pending
  on public.paystack_webhook_events(processed_at)
  where processed_at is null;
