-- Rename accept → apply, add 'full' to enum, prevent duplicate applications

-- 1. Add 'full' to job_status enum
alter type job_status add value 'full';

-- 2. Rename table
alter table public.acceptances rename to applications;

-- 3. Rename indexes
alter index acceptances_job_id_idx rename to applications_job_id_idx;
alter index acceptances_searcher_id_idx rename to applications_searcher_id_idx;

-- 4. Add unique constraint: one application per user per job
alter table public.applications add constraint applications_user_job_unique unique (searcher_id, job_id);

-- 5. Recreate RLS policies with new names
drop policy if exists "Searchers can accept jobs" on public.applications;
create policy "Searchers can apply to jobs"
  on public.applications for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('searcher', 'both')
    )
    and exists (
      select 1 from public.jobs
      where id = job_id
      and status = 'open'
    )
  );

drop policy if exists "Users can read their own acceptances" on public.applications;
create policy "Users can read their own applications"
  on public.applications for select
  using (auth.uid() = searcher_id);

drop policy if exists "Uploaders can read acceptances for their jobs" on public.applications;
create policy "Uploaders can read applications for their jobs"
  on public.applications for select
  using (exists (
    select 1 from public.jobs
    where id = job_id
    and uploader_id = auth.uid()
  ));

-- 6. Recreate trigger functions
drop trigger if exists on_acceptance_before on public.applications;
drop trigger if exists on_acceptance_after on public.applications;
drop function if exists public.handle_acceptance_before;
drop function if exists public.handle_acceptance_after;

create or replace function public.handle_application_before()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_slots integer;
  v_count integer;
begin
  select slots into v_slots from public.jobs where id = new.job_id;
  select count(*) into v_count from public.applications where job_id = new.job_id;
  if v_count >= v_slots then
    raise exception 'This job already has all slots filled';
  end if;
  return new;
end;
$$;

create trigger on_application_before
  before insert on public.applications
  for each row execute function public.handle_application_before();

create or replace function public.handle_application_after()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_slots integer;
begin
  select slots into v_slots from public.jobs where id = new.job_id;
  if (select count(*) from public.applications where job_id = new.job_id) >= v_slots then
    update public.jobs set status = 'full', updated_at = now() where id = new.job_id;
  end if;
  return new;
end;
$$;

create trigger on_application_after
  after insert on public.applications
  for each row execute function public.handle_application_after();
