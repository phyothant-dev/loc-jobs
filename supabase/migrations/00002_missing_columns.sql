-- Add missing columns for avatar and image support
alter table public.users add column if not exists avatar_url text;

alter table public.jobs add column if not exists image_urls text[];

-- Create nearby_jobs RPC function
create or replace function public.nearby_jobs(
  lat double precision,
  lng double precision,
  radius_meters double precision default 50000
)
returns setof public.jobs
language plpgsql
security definer set search_path = 'public, extensions'
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
        location is not null
        and st_dwithin(
          location,
          st_makepoint(lng, lat)::geography,
          radius_meters
        )
      )
    )
  order by
    case when work_type = 'remote' then 0 else 1 end,
    case
      when location is not null
        then st_distance(location, st_makepoint(lng, lat)::geography)
      else null
    end;
end;
$$;

-- Create post_job RPC function
drop function if exists public.post_job;

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
security definer set search_path = 'public, extensions'
as $$
declare
  v_id uuid;
  v_location extensions.geography;
begin
  if p_lat is not null and p_lng is not null then
    v_location := st_makepoint(p_lng, p_lat)::geography;
  end if;

  insert into public.jobs (
    uploader_id,
    title,
    description,
    work_type,
    location,
    address,
    city,
    region,
    price,
    image_urls
  ) values (
    p_uploader_id,
    p_title,
    p_description,
    p_work_type,
    v_location,
    p_address,
    p_city,
    p_region,
    p_price,
    p_image_urls
  )
  returning id into v_id;

  return v_id;
end;
$$;
