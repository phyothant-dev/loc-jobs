-- Add employment_type, salary_min, salary_max, salary_period to jobs

alter table public.jobs
  add column employment_type text,
  add column salary_min numeric(10,2),
  add column salary_max numeric(10,2),
  add column salary_period text;

drop function if exists public.post_job;

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
  p_vacancies integer default 1,
  p_category text default null,
  p_employment_type text default null,
  p_salary_min numeric(10,2) default null,
  p_salary_max numeric(10,2) default null,
  p_salary_period text default null
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
    vacancies,
    category,
    employment_type,
    salary_min,
    salary_max,
    salary_period
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
    p_vacancies,
    p_category,
    p_employment_type,
    p_salary_min,
    p_salary_max,
    p_salary_period
  )
  returning id into v_id;

  return v_id;
end;
$$;

alter table public.jobs
  add column if not exists deleted boolean default false;
