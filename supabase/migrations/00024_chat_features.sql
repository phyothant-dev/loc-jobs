-- Chat features: reply_to, read receipts

alter table public.messages add column reply_to_id uuid references public.messages(id) on delete set null;

alter table public.messages add column read_at timestamptz;

-- Update RLS to allow participants to update read_at
create policy "Participants can update read_at"
  on public.messages
  for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);
