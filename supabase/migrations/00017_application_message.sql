-- Add message column to applications

alter table public.applications add column if not exists message text;
