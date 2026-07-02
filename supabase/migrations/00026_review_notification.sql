-- Notify user when someone leaves a review on their job

create or replace function public.notify_review_created()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_reviewer_name text;
  v_job_title text;
begin
  select display_name into v_reviewer_name from public.users where id = new.reviewer_id;
  select title into v_job_title from public.jobs where id = new.job_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.reviewee_id,
    'new_review',
    'New Review',
    coalesce(v_reviewer_name, 'Someone') || ' left a ' || new.rating || '-star review on "' || v_job_title || '"',
    jsonb_build_object('job_id', new.job_id, 'review_id', new.id, 'reviewer_id', new.reviewer_id, 'rating', new.rating)
  );
  return new;
end;
$$;

create trigger on_review_created_notify
  after insert on public.reviews
  for each row execute function public.notify_review_created();
