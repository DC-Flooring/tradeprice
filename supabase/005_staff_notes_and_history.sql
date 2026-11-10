-- 005_staff_notes_and_history: moves staff notes somewhere fitters can't read, lets staff
-- see each other's names, and keeps a history of every change to an account.
-- Run by hand in the Supabase SQL Editor, all in one go. Then merge the matching site update.

-- 1. STAFF NOTES: their own table, only staff can read or write it
create table if not exists public.account_staff (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.account_staff enable row level security;
revoke all on public.account_staff from anon, authenticated;
grant select, insert, update on public.account_staff to authenticated;

drop policy if exists "staff reads notes" on public.account_staff;
create policy "staff reads notes"
  on public.account_staff for select to authenticated
  using (public.is_staff());
drop policy if exists "staff adds notes" on public.account_staff;
create policy "staff adds notes"
  on public.account_staff for insert to authenticated
  with check (public.is_staff());
drop policy if exists "staff changes notes" on public.account_staff;
create policy "staff changes notes"
  on public.account_staff for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Copy any notes already written, then remove the old column fitters could read
-- (skipped if this file has already been run and the column is gone)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'accounts' and column_name = 'staff_notes') then
    execute 'insert into public.account_staff (account_id, notes, updated_at)
             select id, staff_notes, now() from public.accounts
             where staff_notes is not null and staff_notes <> ''''
             on conflict (account_id) do nothing';
  end if;
end;
$$;

-- The sign-up policy mentions staff_notes, so swap it for one that doesn't
drop policy if exists "fitter creates own pending account" on public.accounts;
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
  );

-- The protect trigger (002) without the staff_notes line
create or replace function public.protect_account_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  new.id := old.id;
  new.created_at := old.created_at;

  if public.is_staff() then
    return new;
  end if;

  new.mobile := old.mobile;
  new.tier := old.tier;
  new.discount_override := old.discount_override;
  new.status := old.status;
  new.lightspeed_code := old.lightspeed_code;
  new.id_check := old.id_check;
  new.approved_by := old.approved_by;
  new.approved_at := old.approved_at;

  return new;
end;
$$;

alter table public.accounts drop column if exists staff_notes;

-- 2. STAFF NAMES: staff can read the staff list (to show who did what). Fitters still can't.
revoke all on public.staff from anon, authenticated;
grant select on public.staff to authenticated;
drop policy if exists "staff reads staff" on public.staff;
create policy "staff reads staff"
  on public.staff for select to authenticated
  using (public.is_staff());

-- 3. HISTORY: one row per change, written by the database itself. Staff read only.
create table if not exists public.account_history (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts(id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by uuid,           -- the signed-in user; empty when changed in the dashboard
  action text not null,      -- signed_up, status, updated, notes
  changes jsonb not null default '{}'::jsonb   -- { column: { "from": ..., "to": ... } }
);
create index if not exists account_history_account_idx
  on public.account_history (account_id, changed_at desc);
alter table public.account_history enable row level security;
revoke all on public.account_history from anon, authenticated;
grant select on public.account_history to authenticated;

drop policy if exists "staff reads history" on public.account_history;
create policy "staff reads history"
  on public.account_history for select to authenticated
  using (public.is_staff());

-- Records sign ups and every real change to an account
create or replace function public.log_account_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o jsonb;
  n jsonb := to_jsonb(new);
  d jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'INSERT' then
    insert into public.account_history (account_id, changed_by, action, changes)
    values (new.id, auth.uid(), 'signed_up', '{}'::jsonb);
    return null;
  end if;

  o := to_jsonb(old);
  for k in select jsonb_object_keys(n) loop
    if k not in ('id', 'created_at') and (o -> k) is distinct from (n -> k) then
      d := d || jsonb_build_object(k, jsonb_build_object('from', o -> k, 'to', n -> k));
    end if;
  end loop;

  if d = '{}'::jsonb then
    return null;
  end if;

  insert into public.account_history (account_id, changed_by, action, changes)
  values (new.id, auth.uid(), case when d ? 'status' then 'status' else 'updated' end, d);
  return null;
end;
$$;

drop trigger if exists log_account_change on public.accounts;
create trigger log_account_change
  after insert or update on public.accounts
  for each row
  execute function public.log_account_change();

-- Records changes to staff notes
create or replace function public.log_notes_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  before_notes text := case when tg_op = 'UPDATE' then nullif(old.notes, '') else null end;
  after_notes text := nullif(new.notes, '');
begin
  if before_notes is not distinct from after_notes then
    return null;
  end if;
  insert into public.account_history (account_id, changed_by, action, changes)
  values (new.account_id, auth.uid(), 'notes',
          jsonb_build_object('notes', jsonb_build_object('from', before_notes, 'to', after_notes)));
  return null;
end;
$$;

drop trigger if exists log_notes_change on public.account_staff;
create trigger log_notes_change
  after insert or update on public.account_staff
  for each row
  execute function public.log_notes_change();

-- Nobody calls these directly; they only run as triggers
revoke all on function public.log_account_change() from public, anon, authenticated;
revoke all on function public.log_notes_change() from public, anon, authenticated;

-- 4. Start the history from what we already know: each sign up, and each approval
insert into public.account_history (account_id, changed_at, changed_by, action, changes)
select a.id, a.created_at, a.id, 'signed_up', '{}'::jsonb
from public.accounts a
where not exists (select 1 from public.account_history h where h.account_id = a.id and h.action = 'signed_up');

insert into public.account_history (account_id, changed_at, changed_by, action, changes)
select a.id, a.approved_at, a.approved_by, 'status',
       jsonb_build_object('status', jsonb_build_object('from', null, 'to', 'approved'))
from public.accounts a
where a.approved_at is not null
  and not exists (select 1 from public.account_history h where h.account_id = a.id and h.action = 'status');

notify pgrst, 'reload schema';
