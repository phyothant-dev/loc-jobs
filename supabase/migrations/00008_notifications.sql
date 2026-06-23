-- Notifications table + auto-create triggers

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_created_at_idx on public.notifications (created_at desc);

alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can read their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- System insert only (via trigger)
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Users can mark their own notifications as read
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notify uploader when someone applies
create or replace function public.notify_application_created()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uploader_id uuid;
  v_job_title text;
  v_applicant_name text;
begin
  select uploader_id, title into v_uploader_id, v_job_title
  from public.jobs where id = new.job_id;

  select display_name into v_applicant_name
  from public.users where id = new.searcher_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    v_uploader_id,
    'new_application',
    'New Applicant',
    coalesce(v_applicant_name, 'Someone') || ' applied to "' || v_job_title || '"',
    jsonb_build_object('job_id', new.job_id, 'searcher_id', new.searcher_id, 'application_id', new.id)
  );
  return new;
end;
$$;

create trigger on_application_created_notify
  after insert on public.applications
  for each row execute function public.notify_application_created();

-- Notify applicant when their application status changes
create or replace function public.notify_application_updated()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_job_title text;
begin
  if old.status <> new.status then
    select title into v_job_title from public.jobs where id = new.job_id;

    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.searcher_id,
      'application_' || new.status,
      'Application ' || new.status,
      'Your application for "' || v_job_title || '" was ' || new.status,
      jsonb_build_object('job_id', new.job_id, 'application_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger on_application_updated_notify
  after update on public.applications
  for each row execute function public.notify_application_updated();

-- Enable realtime
alter publication supabase_realtime add table public.notifications;

-- Notify receiver when someone sends a message
create or replace function public.notify_message_sent()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_sender_name text;
  v_job_title text;
begin
  select display_name into v_sender_name from public.users where id = new.sender_id;
  select title into v_job_title from public.jobs where id = new.job_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.receiver_id,
    'new_message',
    'New Message',
    coalesce(v_sender_name, 'Someone') || ' sent you a message about "' || v_job_title || '"',
    jsonb_build_object('job_id', new.job_id, 'sender_id', new.sender_id, 'message_id', new.id)
  );
  return new;
end;
$$;

create trigger on_message_sent_notify
  after insert on public.messages
  for each row execute function public.notify_message_sent();

-- Notify accepted applicants when job is marked completed
create or replace function public.notify_job_completed()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  r record;
begin
  if old.status <> 'completed' and new.status = 'completed' then
    for r in
      select searcher_id from public.applications
      where job_id = new.id and status = 'accepted'
    loop
      insert into public.notifications (user_id, type, title, body, data)
      values (
        r.searcher_id,
        'job_completed',
        'Job Completed',
        'The job "' || new.title || '" has been marked as completed',
        jsonb_build_object('job_id', new.id)
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_job_completed_notify
  after update on public.jobs
  for each row execute function public.notify_job_completed();
