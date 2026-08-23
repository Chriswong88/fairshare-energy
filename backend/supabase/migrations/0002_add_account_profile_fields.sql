-- Adds account details collected by the landing page signup form.
-- Run this on Supabase projects that already applied 0001 before these fields existed.

alter table public.profiles
  add column if not exists electricity_provider text not null default '',
  add column if not exists electricity_plan text not null default '';

-- Ask Supabase/PostgREST to refresh its schema cache after the table change.
notify pgrst, 'reload schema';
