-- Offboarding runs: persisted per-developer offboarding checklists.
--
-- Single-tenant, additive, owner-scoped. Records that the OWNER has started
-- offboarding a developer, which checklist steps are done, and when the run was
-- completed — so progress survives a reload and the completed run stands as
-- audit evidence ("access removed on this date").
--
-- Does NOT introduce login users and does NOT change auth: every row is keyed to
-- the owner (user_id) under the same owner-only RLS as the rest of the schema.
-- The derived half of the checklist (repos still accessible, sole-maintainer
-- repos, pending invitations) is computed in the app layer from repo_access +
-- live collaborators, so with this table empty the Continuity Center still shows
-- an accurate, untracked checklist.

-- ── offboarding_runs: one row per offboarding of one developer ─────────────────
create table if not exists public.offboarding_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- the owner
  member_id uuid references public.org_members(id) on delete set null,
  login text not null,                           -- provider login being offboarded
  status text not null default 'in_progress',    -- 'in_progress' | 'completed' | 'cancelled'
  steps jsonb not null default '{}'::jsonb,      -- {revoke_access: true, reassign: false, ...}
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offboarding_runs_status_chk
    check (status in ('in_progress', 'completed', 'cancelled'))
);

create index if not exists idx_offboarding_runs_user_id on public.offboarding_runs(user_id);
create index if not exists idx_offboarding_runs_member_id on public.offboarding_runs(member_id);

-- One open run per developer per owner; completed/cancelled runs accumulate as history.
create unique index if not exists idx_offboarding_runs_open_unique
  on public.offboarding_runs(user_id, lower(login))
  where status = 'in_progress';

-- ── RLS: owner-only, same pattern as org_members / repo_access ─────────────────
alter table public.offboarding_runs enable row level security;

drop policy if exists "Users can manage own offboarding runs" on public.offboarding_runs;
create policy "Users can manage own offboarding runs"
  on public.offboarding_runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at trigger (reuse shared public.set_updated_at) ────────────────────
drop trigger if exists offboarding_runs_updated_at on public.offboarding_runs;
create trigger offboarding_runs_updated_at
  before update on public.offboarding_runs
  for each row execute function public.set_updated_at();
