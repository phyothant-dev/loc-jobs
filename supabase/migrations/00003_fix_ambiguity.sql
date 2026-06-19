-- Fix ambiguous column reference in nearby_jobs
-- Run after 00003_nopostgis.sql

drop function if exists public.nearby_jobs;

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
