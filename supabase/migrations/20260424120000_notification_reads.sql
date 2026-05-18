-- Per-user read state for dashboard notifications (synthetic ids from app logic + activity/upload UUIDs).

create table if not exists public.notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists idx_notification_reads_user_id on public.notification_reads (user_id);

alter table public.notification_reads enable row level security;

create policy "Users read own notification_reads"
  on public.notification_reads
  for select
  using (auth.uid() = user_id);

create policy "Users insert own notification_reads"
  on public.notification_reads
  for insert
  with check (auth.uid() = user_id);

create policy "Users update own notification_reads"
  on public.notification_reads
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
