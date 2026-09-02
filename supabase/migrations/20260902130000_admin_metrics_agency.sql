-- Admin metrics: break out the Agency plan, which get_admin_overview_metrics
-- and get_admin_plan_history never bucketed separately (Agency subscribers
-- were counted in neither total, so revenue reporting silently excluded
-- them). Re-creates both functions with the same signature/permissions from
-- 20260604120000_admin_metrics.sql, adding an agency bucket alongside the
-- existing trial/starter/pro ones.

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
    'plan_agency',         coalesce((select cnt from plan_counts where plan = 'agency'), 0),
    'trials_expiring_7d',  (select cnt from trials_expiring_7d),
    'repos_total',         (select cnt from repos_total),
    'uploads_total',       (select cnt from uploads_total),
    'summaries_month',     (select cnt from summaries_month),
    'webhook_pending_7d',  (select cnt from webhook_pending_7d),
    'inactive_with_repos', (select cnt from inactive_with_repos)
  );
$$;

-- Postgres won't let CREATE OR REPLACE change a RETURNS TABLE column list
-- (adding agency_count here), so drop first.
drop function if exists get_admin_plan_history(int);

create function get_admin_plan_history(months_back int default 6)
returns table(month date, trial_count bigint, starter_count bigint, pro_count bigint, agency_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc('month', au.created_at)::date as month,
    count(*) filter (where coalesce(p.plan, 'trial') = 'trial')   as trial_count,
    count(*) filter (where p.plan = 'starter')                     as starter_count,
    count(*) filter (where p.plan = 'pro')                         as pro_count,
    count(*) filter (where p.plan = 'agency')                      as agency_count
  from auth.users au
  left join profiles p on p.user_id = au.id
  where au.created_at >= date_trunc('month', now())
    - ((months_back - 1) || ' months')::interval
  group by 1
  order by 1;
$$;

revoke execute on function get_admin_overview_metrics()  from public, authenticated;
revoke execute on function get_admin_plan_history(int)   from public, authenticated;
grant execute on function get_admin_overview_metrics()   to service_role;
grant execute on function get_admin_plan_history(int)    to service_role;
