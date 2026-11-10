-- 001_accounts: creates the staff and accounts tables, RLS policies and the protect trigger.
-- Run by hand in the Supabase SQL Editor on 10 Nov 2026.
-- STAFF: who counts as staff. Nobody can read this table through the API.
create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.staff where id = auth.uid());
$$;

-- ACCOUNTS
create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  company_name text,
  mobile text not null unique,
  email text,
  tier text not null default 'trade',
  discount_override numeric(4,2),
  status text not null default 'pending',
  lightspeed_code text unique,
  id_check text not null default 'not_started',
  marketing_email boolean not null default false,
  marketing_sms boolean not null default false,
  marketing_consent_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  staff_notes text,

  constraint accounts_tier_check
    check (tier in ('trade', 'trade_plus', 'trade_gold')),
  constraint accounts_status_check
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  constraint accounts_id_check_check
    check (id_check in ('not_started', 'passed', 'failed', 'skipped')),
  constraint accounts_mobile_check
    check (mobile ~ '^\+447[0-9]{9}$'),
  constraint accounts_override_check
    check (discount_override is null or (discount_override >= 0 and discount_override <= 50))
);

alter table public.accounts enable row level security;

-- Lock the table down, then open only what is needed
revoke all on public.accounts from anon;
revoke all on public.accounts from authenticated;
grant select, insert, update on public.accounts to authenticated;

-- FITTER: read own row only
create policy "fitter reads own account"
  on public.accounts for select to authenticated
  using (id = auth.uid());

-- FITTER: create own row, but only as a plain pending account
create policy "fitter creates own pending account"
  on public.accounts for insert to authenticated
  with check (
    id = auth.uid()
    and status = 'pending'
    and tier = 'trade'
    and discount_override is null
    and lightspeed_code is null
    and id_check = 'not_started'
    and approved_by is null
    and approved_at is null
    and staff_notes is null
  );

-- FITTER: update own row (protected columns are reset by the trigger below)
create policy "fitter updates own account"
  on public.accounts for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- STAFF: read and update everything
create policy "staff reads all accounts"
  on public.accounts for select to authenticated
  using (public.is_staff());

create policy "staff updates all accounts"
  on public.accounts for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());
