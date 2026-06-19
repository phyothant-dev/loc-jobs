create extension if not exists postgis with schema extensions;

create type user_role as enum ('uploader', 'searcher', 'both');
create type work_type as enum ('onsite', 'remote', 'hybrid');
create type job_status as enum ('open', 'accepted', 'completed', 'cancelled');

create table public.users (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  role user_role not null default 'both',
  location geography(point),
  city text,
  region text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  uploader_id uuid references public.users on delete cascade not null,
  title text not null,
  description text,
  work_type work_type not null default 'onsite',
  location geography(point),
  address text,
  city text,
  region text,
  status job_status not null default 'open',
  price numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.acceptances (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  searcher_id uuid references public.users on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(job_id)
);

create index jobs_location_idx on public.jobs using gist (location);
create index jobs_city_idx on public.jobs (city);
create index jobs_status_idx on public.jobs (status);
create index jobs_created_at_idx on public.jobs (created_at desc);
create index jobs_work_type_idx on public.jobs (work_type);
create index acceptances_job_id_idx on public.acceptances (job_id);
create index acceptances_searcher_id_idx on public.acceptances (searcher_id);
create index users_location_idx on public.users using gist (location);

alter table public.jobs enable row level security;
alter table public.acceptances enable row level security;
alter table public.users enable row level security;

create policy "Users can read all users"
  on public.users for select
  using (true);

create policy "Users can insert their own record"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own record"
  on public.users for update
  using (auth.uid() = id);

create policy "Anyone can read open jobs"
  on public.jobs for select
  using (true);

create policy "Uploaders can create jobs"
  on public.jobs for insert
  with check (
    auth.uid() = uploader_id
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('uploader', 'both')
    )
  );

create policy "Uploaders can update their own jobs"
  on public.jobs for update
  using (auth.uid() = uploader_id);

create policy "Uploaders can delete their own jobs"
  on public.jobs for delete
  using (auth.uid() = uploader_id);

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
    )
  );

create policy "Users can read their own acceptances"
  on public.acceptances for select
  using (auth.uid() = searcher_id);

create policy "Uploaders can read acceptances for their jobs"
  on public.acceptances for select
  using (
    exists (
      select 1 from public.jobs
      where id = job_id
      and uploader_id = auth.uid()
    )
  );

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_job_accepted()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.jobs
  set status = 'accepted', updated_at = now()
  where id = new.job_id;
  return new;
end;
$$;

create trigger on_acceptance_created
  after insert on public.acceptances
  for each row execute function public.handle_job_accepted();

create function public.update_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.update_updated_at();
