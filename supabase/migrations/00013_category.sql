-- Add category column to jobs

alter table public.jobs add column if not exists category text;
