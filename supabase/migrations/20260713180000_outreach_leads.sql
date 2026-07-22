-- Outreach CRM: local-business discovery, cold email drafts, send + reply triage.
-- Service-role only (admin dashboard / webhooks / cron). No client RLS policies.

-- ── Leads ────────────────────────────────────────────────────────────────────
create table if not exists public.outreach_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  address text,
  phone text,
  email text,
  website_url text,
  google_place_id text,
  google_maps_uri text,
  lat double precision,
  lng double precision,
  -- website_build = no site (offer to build); ownbase = has site (pitch OwnBase)
  track text not null
    check (track in ('website_build', 'ownbase')),
  status text not null default 'new'
    check (status in (
      'new',
      'enriched',
      'drafted',
      'queued',
      'sent',
      'replied',
      'escalated',
      'closed',
      'unsubscribed',
      'bounced',
      'skipped'
    )),
  business_summary text,
  source text not null default 'manual'
    check (source in ('manual', 'google_places', 'import')),
  raw jsonb not null default '{}'::jsonb,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UNIQUE allows multiple NULLs in Postgres; required for onConflict / dedupe
create unique index if not exists outreach_leads_google_place_id_uidx
  on public.outreach_leads (google_place_id);

create unique index if not exists outreach_leads_email_uidx
  on public.outreach_leads (lower(email))
  where email is not null and email <> '';

create index if not exists outreach_leads_status_idx on public.outreach_leads (status);
create index if not exists outreach_leads_track_idx on public.outreach_leads (track);
create index if not exists outreach_leads_created_at_idx on public.outreach_leads (created_at desc);

-- ── Messages (outbound drafts/sends + inbound replies) ───────────────────────
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.outreach_leads (id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  channel text not null default 'email' check (channel in ('email')),
  subject text,
  body_text text not null,
  body_html text,
  status text not null default 'draft'
    check (status in (
      'draft',
      'approved',
      'sent',
      'failed',
      'received',
      'triaged',
      'auto_replied'
    )),
  resend_email_id text,
  provider_message_id text,
  -- LLM triage for inbound
  intent text
    check (intent is null or intent in (
      'interested',
      'not_interested',
      'question',
      'pricing',
      'negotiate',
      'unsubscribe',
      'out_of_office',
      'other'
    )),
  needs_human boolean not null default false,
  triage_notes text,
  auto_reply_text text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_messages_lead_id_idx
  on public.outreach_messages (lead_id, created_at desc);
create index if not exists outreach_messages_status_idx
  on public.outreach_messages (status);
create index if not exists outreach_messages_needs_human_idx
  on public.outreach_messages (needs_human)
  where needs_human = true;
create index if not exists outreach_messages_resend_email_id_idx
  on public.outreach_messages (resend_email_id)
  where resend_email_id is not null;

-- ── Suppression (do-not-contact) ─────────────────────────────────────────────
create table if not exists public.outreach_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null default 'unsubscribe',
  created_at timestamptz not null default now(),
  constraint outreach_suppressions_email_unique unique (email)
);

create or replace function public.set_outreach_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists outreach_leads_updated_at on public.outreach_leads;
create trigger outreach_leads_updated_at
  before update on public.outreach_leads
  for each row execute function public.set_outreach_updated_at();

drop trigger if exists outreach_messages_updated_at on public.outreach_messages;
create trigger outreach_messages_updated_at
  before update on public.outreach_messages
  for each row execute function public.set_outreach_updated_at();

-- Service role only
alter table public.outreach_leads enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_suppressions enable row level security;

revoke all on table public.outreach_leads from anon, authenticated;
revoke all on table public.outreach_messages from anon, authenticated;
revoke all on table public.outreach_suppressions from anon, authenticated;

grant all on table public.outreach_leads to service_role;
grant all on table public.outreach_messages to service_role;
grant all on table public.outreach_suppressions to service_role;
