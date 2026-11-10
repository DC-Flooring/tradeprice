-- 003_staff_helpers: lets the site ask "am I staff?" without exposing the staff table. Run by hand in the Supabase SQL Editor on 10 Nov 2026.
create or replace function public.am_i_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_staff();
$$;

revoke all on function public.am_i_staff() from public, anon;
grant execute on function public.am_i_staff() to authenticated;
