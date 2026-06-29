-- Self-service account deletion RPC
-- Called from the client via supabase.rpc('delete_user_account')
-- SECURITY DEFINER allows deleting from auth.users using the anon key

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
