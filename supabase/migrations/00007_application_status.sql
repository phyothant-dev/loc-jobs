-- Uploader-managed applications (accept/reject flow)

-- 1. Rename slots → vacancies
alter table public.jobs rename column slots to vacancies;

-- 2. Application status enum
create type application_status as enum ('pending', 'accepted', 'rejected');
alter table public.applications add column status application_status not null default 'pending';

-- 3. Drop old post_job and recreate with p_vacancies
drop function if exists public.post_job(uuid, text, text, work_type, text, text, text, numeric, text[], double precision, double precision);
drop function if exists public.post_job(uuid, text, text, work_type, text, text, text, numeric, text[], double precision, double precision, integer);
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
  p_vacancies integer default 1
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
    vacancies
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
    p_vacancies
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- 4. Replace triggers — allow any number of applications, count only accepted
drop trigger if exists on_application_before on public.applications;
drop function if exists public.handle_application_before;

-- After insert: no-op (status is 'pending' by default)
create or replace function public.handle_application_after()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  return new;
end;
$$;

drop trigger if exists on_application_after on public.applications;
create trigger on_application_after
  after insert on public.applications
  for each row execute function public.handle_application_after();

-- 5. Function: uploader accepts an application (checks vacancies)
create or replace function public.accept_application(p_application_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_job_id uuid;
  v_vacancies integer;
  v_accepted integer;
begin
  select job_id into v_job_id from public.applications where id = p_application_id;
  if v_job_id is null then raise exception 'Application not found'; end if;

  -- Only the uploader can accept
  if not exists (select 1 from public.jobs where id = v_job_id and uploader_id = auth.uid()) then
    raise exception 'Only the uploader can accept applications';
  end if;

  select vacancies into v_vacancies from public.jobs where id = v_job_id;
  select count(*) into v_accepted from public.applications where job_id = v_job_id and status = 'accepted';

  if v_accepted >= v_vacancies then
    raise exception 'All vacancies are already filled';
  end if;

  update public.applications set status = 'accepted' where id = p_application_id;

  -- Mark job as full if all vacancies filled
  if v_accepted + 1 >= v_vacancies then
    update public.jobs set status = 'full', updated_at = now() where id = v_job_id;
  end if;
end;
$$;

-- 6. Function: uploader rejects an application
create or replace function public.reject_application(p_application_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_job_id uuid;
begin
  select job_id into v_job_id from public.applications where id = p_application_id;
  if v_job_id is null then raise exception 'Application not found'; end if;

  if not exists (select 1 from public.jobs where id = v_job_id and uploader_id = auth.uid()) then
    raise exception 'Only the uploader can reject applications';
  end if;

  update public.applications set status = 'rejected' where id = p_application_id;
end;
$$;

-- 7. RLS: uploader can update applications for their jobs
drop policy if exists "Uploaders can update applications for their jobs" on public.applications;
create policy "Uploaders can update applications for their jobs"
  on public.applications for update
  using (exists (
    select 1 from public.jobs
    where id = job_id
    and uploader_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.jobs
    where id = job_id
    and uploader_id = auth.uid()
  ));
