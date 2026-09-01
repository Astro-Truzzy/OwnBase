-- Repo summary history: append-only log of every AI executive summary ever
-- generated for a repository, so the AI Insights hub can show "what changed"
-- between versions instead of only the latest snapshot.
--
-- Single-tenant, additive, owner-scoped — same pattern as repo_summaries.
-- Rows are never updated or deleted from the app: `repo_summaries` keeps
-- working exactly as before (the "latest" pointer used by every existing
-- read), and this table simply gains one row every time generateRepoSummary
-- succeeds.

create table if not exists public.repo_summary_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- the owner
  repo_id bigint not null,
  full_name text not null,
  summary_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_repo_summary_history_user_id
  on public.repo_summary_history(user_id);

-- Newest-first per repo is the only access pattern (history list, diff picker).
create index if not exists idx_repo_summary_history_lookup
  on public.repo_summary_history(user_id, full_name, created_at desc);

-- ── RLS: owner-only, insert + read only — no update/delete, this is a log ──────
alter table public.repo_summary_history enable row level security;

drop policy if exists "Users can view own summary history" on public.repo_summary_history;
create policy "Users can view own summary history"
  on public.repo_summary_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own summary history" on public.repo_summary_history;
create policy "Users can insert own summary history"
  on public.repo_summary_history
  for insert
  with check (auth.uid() = user_id);
