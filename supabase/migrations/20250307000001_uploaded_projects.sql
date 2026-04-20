-- Uploaded projects: direct uploads stored in user's environment.
-- RLS: users can only read/write their own rows.

create table if not exists public.uploaded_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_uploaded_projects_user_id on public.uploaded_projects(user_id);

alter table public.uploaded_projects enable row level security;

create policy "Users can manage own uploaded projects"
  on public.uploaded_projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for project uploads (create if not exists).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-uploads',
  'project-uploads',
  false,
  52428800,
  array['application/zip', 'application/x-zip-compressed']
)
on conflict (id) do nothing;

-- RLS: users can only access their own folder (user_id prefix).
create policy "Users can upload to own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'project-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own uploads"
  on storage.objects
  for select
  using (
    bucket_id = 'project-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own uploads"
  on storage.objects
  for delete
  using (
    bucket_id = 'project-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
