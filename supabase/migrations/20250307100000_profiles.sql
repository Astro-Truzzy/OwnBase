-- Profiles: extended user/business data (first name, last name, business name, sector).
-- RLS: users can select/update/insert only their own row.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  first_name text,
  last_name text,
  business_name text,
  business_sector text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create profile on sign up (email or OAuth). Uses raw_user_meta_data from auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  fn text;
  ln text;
  full_name_val text;
begin
  fn := coalesce(
    nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'given_name'), '')
  );
  ln := coalesce(
    nullif(trim(new.raw_user_meta_data->>'last_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'family_name'), '')
  );
  if fn is null and ln is null then
    full_name_val := nullif(trim(new.raw_user_meta_data->>'full_name'), '');
    if full_name_val is null then
      full_name_val := nullif(trim(new.raw_user_meta_data->>'name'), '');
    end if;
    if full_name_val is not null then
      fn := split_part(full_name_val, ' ', 1);
      ln := nullif(trim(substring(full_name_val from length(fn) + 2)), '');
      if ln is null then ln := fn; end if;
    end if;
  end if;
  insert into public.profiles (user_id, first_name, last_name, business_name, business_sector, updated_at)
  values (
    new.id,
    fn,
    ln,
    nullif(trim(new.raw_user_meta_data->>'business_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'business_sector'), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
