-- Server-only GitHub OAuth tokens (API routes use service role; no client RLS access).
create table if not exists public.user_github_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  updated_at timestamptz not null default now()
);

alter table public.user_github_tokens enable row level security;

-- No policies: authenticated users cannot read/write; service role bypasses RLS.
