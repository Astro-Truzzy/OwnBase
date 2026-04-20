-- Optional onboarding checklist UI state (dismissal persists across sessions).
alter table public.profiles
  add column if not exists onboarding_checklist_dismissed_at timestamptz;

comment on column public.profiles.onboarding_checklist_dismissed_at is
  'When set, the dashboard onboarding checklist is hidden until reset.';
