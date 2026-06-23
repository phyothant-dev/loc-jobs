-- Messages table for chat between uploaders and accepters
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  sender_id uuid references public.users on delete cascade not null,
  receiver_id uuid references public.users on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_job_id_idx on public.messages (job_id);
create index messages_sender_id_idx on public.messages (sender_id);
create index messages_receiver_id_idx on public.messages (receiver_id);
create index messages_created_at_idx on public.messages (created_at desc);

alter table public.messages enable row level security;

-- Participants can read messages they're involved in
create policy "Participants can read messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Authenticated users can send messages
create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Enable realtime for live chat
alter publication supabase_realtime add table public.messages;
