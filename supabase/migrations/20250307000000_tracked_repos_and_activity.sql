-- Tracked repos: repositories the user has added to "their organization" for secure visibility and control.
-- RLS: users can only read/write their own rows.

create table if not exists public.tracked_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  full_name text not null,
  added_at timestamptz not null default now(),
  unique(user_id, full_name)
);

create index if not exists idx_tracked_repos_user_id on public.tracked_repos(user_id);
create index if not exists idx_tracked_repos_full_name on public.tracked_repos(full_name);

alter table public.tracked_repos enable row level security;

create policy "Users can manage own tracked repos"
  on public.tracked_repos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Activity log: who did what, for audit trail and "who touched what" visibility.
-- RLS: users can only read their own activity.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  full_name text not null,
  action_type text not null,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_log_user_id on public.activity_log(user_id);
create index if not exists idx_activity_log_full_name on public.activity_log(full_name);
create index if not exists idx_activity_log_created_at on public.activity_log(created_at desc);

alter table public.activity_log enable row level security;

create policy "Users can read own activity"
  on public.activity_log
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity"
  on public.activity_log
  for insert
  with check (auth.uid() = user_id);

-- No update/delete: append-only audit log.
