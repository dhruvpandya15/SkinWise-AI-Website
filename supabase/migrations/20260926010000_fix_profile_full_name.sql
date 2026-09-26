-- Preserve the name collected during sign-up in public.profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

-- Backfill profiles created by the previous trigger version.
update public.profiles as profiles
set full_name = nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    updated_at = now()
from auth.users as users
where profiles.user_id = users.id
  and profiles.full_name is null
  and nullif(trim(users.raw_user_meta_data ->> 'full_name'), '') is not null;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
