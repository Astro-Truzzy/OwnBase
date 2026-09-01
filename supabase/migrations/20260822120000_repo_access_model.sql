-- Native access model: owner-managed org members + per-repo access grants.
--
-- Single-tenant, additive, owner-scoped. These tables let the OWNER record and
-- manage developer access as first-class data (role, expiry, provenance),
-- reconciled against live GitHub collaborators in the app layer. They do NOT
-- introduce login users and do NOT change auth: every row is keyed to the owner
-- (user_id) under the same owner-only RLS as the rest of the schema.
--
-- Nothing reads these tables until the Team & Access UI ships; with the tables
-- empty the matrix degrades safely to the live-GitHub view.

-- ── org_members: developers the OWNER manages (owner-scoped records) ──────────
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- the owner
  provider text not null default 'github',
  login text,
  email text,
  display_name text,
  avatar_url text,
  html_url text,
  org_role text not null default 'developer',   -- 'admin' | 'developer' | 'viewer'
  status text not null default 'active',         -- 'invited' | 'active' | 'removed'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider, login),
  constraint org_members_org_role_chk check (org_role in ('admin', 'developer', 'viewer')),
  constraint org_members_status_chk   check (status   in ('invited', 'active', 'removed')),
  constraint org_members_provider_chk check (provider in ('github', 'gitlab', 'manual'))
);

create index if not exists idx_org_members_user_id on public.org_members(user_id);

-- ── repo_access: per-repo grant + Ownbase-native metadata ─────────────────────
-- Source of truth for role/expiry/provenance; reconciled against live GitHub.
create table if not exists public.repo_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,   -- the owner
  member_id uuid references public.org_members(id) on delete set null,
  full_name text not null,                       -- matches tracked_repos.full_name
  provider text not null default 'github',
  login text not null,
  access_level text not null,                    -- 'none' | 'read' | 'write' | 'admin'
  granted_by text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,                        -- null = no expiry (Phase 1 = display only)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, full_name, login),
  constraint repo_access_level_chk    check (access_level in ('none', 'read', 'write', 'admin')),
  constraint repo_access_provider_chk check (provider in ('github', 'gitlab', 'manual'))
);

create index if not exists idx_repo_access_user_id on public.repo_access(user_id);
create index if not exists idx_repo_access_full_name on public.repo_access(full_name);
create index if not exists idx_repo_access_member_id on public.repo_access(member_id);
create index if not exists idx_repo_access_expires_at on public.repo_access(expires_at)
  where expires_at is not null;

-- ── RLS: owner-only, same pattern as tracked_repos / repo_summaries ───────────
alter table public.org_members enable row level security;
alter table public.repo_access enable row level security;

drop policy if exists "Users can manage own org members" on public.org_members;
create policy "Users can manage own org members"
  on public.org_members
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own repo access" on public.repo_access;
create policy "Users can manage own repo access"
  on public.repo_access
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at triggers (reuse shared public.set_updated_at) ──────────────────
drop trigger if exists org_members_updated_at on public.org_members;
create trigger org_members_updated_at
  before update on public.org_members
  for each row execute function public.set_updated_at();

drop trigger if exists repo_access_updated_at on public.repo_access;
create trigger repo_access_updated_at
  before update on public.repo_access
  for each row execute function public.set_updated_at();
