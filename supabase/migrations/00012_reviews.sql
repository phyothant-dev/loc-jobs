-- Ratings & reviews

create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  reviewer_id uuid references public.users on delete cascade not null,
  reviewee_id uuid references public.users on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (job_id, reviewer_id)
);

create index if not exists reviews_reviewee_id_idx on public.reviews (reviewee_id);
create index if not exists reviews_job_id_idx on public.reviews (job_id);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Users can leave reviews" on public.reviews;
create policy "Users can leave reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

drop policy if exists "Reviewers can update their own reviews" on public.reviews;
create policy "Reviewers can update their own reviews"
  on public.reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);
