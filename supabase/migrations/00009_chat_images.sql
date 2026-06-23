-- Add image_url column to messages for image sharing
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'image_url') then
    alter table public.messages add column image_url text;
  end if;
end $$;

-- Add edit and soft-delete support
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'edited_at') then
    alter table public.messages add column edited_at timestamptz;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'deleted') then
    alter table public.messages add column deleted boolean not null default false;
  end if;
end $$;

-- RLS policies for edit/delete (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Senders can update their own messages') then
    create policy "Senders can update their own messages"
      on public.messages for update
      using (auth.uid() = sender_id)
      with check (auth.uid() = sender_id);
  end if;
end $$;
