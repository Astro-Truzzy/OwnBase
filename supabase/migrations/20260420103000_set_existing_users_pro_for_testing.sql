-- Temporary test migration:
-- Put current existing users on Pro with an active subscription window.
-- Remove/revert before production rollout if this should not affect all users.

update public.profiles
set
  plan = 'pro',
  subscription_ends_at = now() + interval '5 years',
  updated_at = now()
where true;
