-- First-time dashboard UI walkthrough completion timestamp.
alter table public.profiles
  add column if not exists dashboard_walkthrough_completed_at timestamptz;

comment on column public.profiles.dashboard_walkthrough_completed_at is
  'When set, the interactive dashboard tab walkthrough is hidden permanently for this user.';

-- Existing accounts skip the tour; only new signups after this migration see it.
update public.profiles
set dashboard_walkthrough_completed_at = now()
where dashboard_walkthrough_completed_at is null;
