-- 002_protect_accounts: the protect trigger promised in 001. Stops a fitter changing the
-- protected columns on their own account row (they are quietly put back to what they were).
-- Run by hand in the Supabase SQL Editor after 001_accounts.sql. Safe to run more than once.

create or replace function public.protect_account_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only requests that come through the website's API keys are checked
  -- (anon and signed-in users). The SQL Editor, the dashboard and the
  -- service role are trusted and can change anything.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- Nobody changes which login a row belongs to, or when it was made
  new.id := old.id;
  new.created_at := old.created_at;

  -- Staff can change everything else (approve, set tier, account number, notes)
  if public.is_staff() then
    return new;
  end if;

  -- Fitters: these always keep their current value. A fitter can still change
  -- their name, company, email and marketing choices.
  new.mobile := old.mobile;
  new.tier := old.tier;
  new.discount_override := old.discount_override;
  new.status := old.status;
  new.lightspeed_code := old.lightspeed_code;
  new.id_check := old.id_check;
  new.approved_by := old.approved_by;
  new.approved_at := old.approved_at;
  new.staff_notes := old.staff_notes;

  return new;
end;
$$;

drop trigger if exists protect_account_columns on public.accounts;

create trigger protect_account_columns
  before update on public.accounts
  for each row
  execute function public.protect_account_columns();
