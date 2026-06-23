-- Add slots column to jobs (default 1, meaning 1 person needed)
alter table public.jobs add column slots integer not null default 1;

-- Remove unique constraint on acceptances (allow multiple accepters per job)
alter table public.acceptances drop constraint acceptances_job_id_key;

-- Drop old trigger that auto-set status to 'accepted' on first acceptance
drop trigger if exists on_acceptance_created on public.acceptances;
drop function if exists public.handle_job_accepted;

-- Update RLS: allow accepting only if status = 'open' AND slots not full
drop policy if exists "Searchers can accept jobs" on public.acceptances;
create policy "Searchers can accept jobs"
  on public.acceptances for insert
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
      and (select count(*) from public.acceptances where job_id = id) < slots
    )
  );

-- Trigger to auto-set job status to 'full' when all slots are filled
create or replace function public.handle_acceptance_fill()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.acceptances where job_id = new.job_id) >= (select slots from public.jobs where id = new.job_id) then
    update public.jobs set status = 'full', updated_at = now() where id = new.job_id;
  end if;
  return new;
end;
$$;

create trigger on_acceptance_fill
  after insert on public.acceptances
  for each row execute function public.handle_acceptance_fill();

-- Update post_job function to accept slots parameter
create or replace function public.post_job(
  p_uploader_id uuid,
  p_title text,
  p_description text default null,
  p_work_type work_type default 'onsite',
  p_address text default null,
  p_city text default null,
  p_region text default null,
  p_price numeric(10,2) default null,
  p_image_urls text[] default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_slots integer default 1
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into public.jobs (
    uploader_id,
    title,
    description,
    work_type,
    address,
    city,
    region,
    price,
    image_urls,
    lat,
    lng,
    slots
  ) values (
    p_uploader_id,
    p_title,
    p_description,
    p_work_type,
    p_address,
    p_city,
    p_region,
    p_price,
    p_image_urls,
    p_lat,
    p_lng,
    p_slots
  )
  returning id into v_id;

  return v_id;
end;
$$;
