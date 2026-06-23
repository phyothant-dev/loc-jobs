-- Add reject_reason column to applications

alter table public.applications add column if not exists reject_reason text;
