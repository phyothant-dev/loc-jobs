-- Reports / flagging

create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  reporter_id uuid references public.users on delete cascade not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_job_id_idx on public.reports (job_id);

alter table public.reports enable row level security;

drop policy if exists "Users can insert reports" on public.reports;
create policy "Users can insert reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Uploaders can view reports on their jobs" on public.reports;
create policy "Uploaders can view reports on their jobs"
  on public.reports for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = reports.job_id
      and jobs.uploader_id = auth.uid()
    )
  );
