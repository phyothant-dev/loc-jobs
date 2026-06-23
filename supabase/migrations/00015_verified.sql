-- Add verified column to users and auto-verify function

alter table public.users add column if not exists verified boolean not null default false;

create or replace function public.check_user_verification(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  -- count jobs completed as uploader (status = completed, at least one accepted applicant)
  select count(*) into v_count
  from public.jobs j
  where j.uploader_id = p_user_id
    and j.status = 'completed';

  -- count jobs completed as accepted applicant
  select v_count + count(*) into v_count
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.searcher_id = p_user_id
    and a.status = 'accepted'
    and j.status = 'completed';

  if v_count >= 3 then
    update public.users set verified = true where id = p_user_id;
    return true;
  end if;

  return false;
end;
$$;
