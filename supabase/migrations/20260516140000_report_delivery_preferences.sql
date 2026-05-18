-- Optional scheduled report digest delivery (email sent by cron when outbound mail is configured).

create table if not exists public.report_delivery_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  cadence text not null default 'weekly',
  destination_email text not null,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_delivery_preferences_cadence_chk
    check (cadence in ('weekly', 'monthly'))
);

create index if not exists idx_report_delivery_preferences_enabled
  on public.report_delivery_preferences (enabled)
  where enabled = true;

alter table public.report_delivery_preferences enable row level security;

create policy "Users can read own report delivery preferences"
  on public.report_delivery_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own report delivery preferences"
  on public.report_delivery_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own report delivery preferences"
  on public.report_delivery_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
