-- 004_lock_functions: stops signed-out visitors calling the staff check. Run by hand on 10 Nov 2026.
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;
