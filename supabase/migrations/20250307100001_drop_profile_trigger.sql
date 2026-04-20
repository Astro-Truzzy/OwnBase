-- Remove trigger that runs during auth.users insert; RLS blocks the insert because
-- auth.uid() is not set in that context. Profiles are created from the app instead
-- (auth callback for OAuth, dashboard layout for email sign-up / first load).

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
