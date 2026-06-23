-- Saved/bookmarked jobs

create table public.saved_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  job_id uuid references public.jobs on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index saved_jobs_user_id_idx on public.saved_jobs (user_id);

alter table public.saved_jobs enable row level security;

create policy "Users can view their own saved jobs"
  on public.saved_jobs for select
  using (auth.uid() = user_id);

create policy "Users can save jobs"
  on public.saved_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave jobs"
  on public.saved_jobs for delete
  using (auth.uid() = user_id);
