-- Remove PostGIS dependency — use lat/lng columns + Haversine formula
-- Run this in Supabase Dashboard → SQL Editor

-- Add lat/lng columns to jobs
alter table public.jobs add column if not exists lat double precision;
alter table public.jobs add column if not exists lng double precision;

-- Drop PostGIS-dependent functions
drop function if exists public.nearby_jobs;
drop function if exists public.post_job;

-- Recreate nearby_jobs without PostGIS (Haversine formula)
create function public.nearby_jobs(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision default 50000
)
returns setof public.jobs
language plpgsql
security definer
as $$
begin
  return query
  select *
  from public.jobs
  where
    status = 'open'
    and (
      work_type = 'remote'
      or (
        jobs.lat is not null and jobs.lng is not null
        and (
          6371000 * 2 * asin(
            sqrt(
              power(sin(radians(jobs.lat - user_lat) / 2), 2)
              + cos(radians(user_lat))
              * cos(radians(jobs.lat))
              * power(sin(radians(jobs.lng - user_lng) / 2), 2)
            )
          )
        ) <= radius_meters
      )
    )
  order by
    case when work_type = 'remote' then 0 else 1 end,
    case
      when jobs.lat is not null and jobs.lng is not null
        then (
          6371000 * 2 * asin(
            sqrt(
              power(sin(radians(jobs.lat - user_lat) / 2), 2)
              + cos(radians(user_lat))
              * cos(radians(jobs.lat))
              * power(sin(radians(jobs.lng - user_lng) / 2), 2)
            )
          )
        )
      else null
    end;
end;
$$;

-- Recreate post_job without PostGIS geography type
create function public.post_job(
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
  p_lng double precision default null
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
    lng
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
    p_lng
  )
  returning id into v_id;

  return v_id;
end;
$$;
