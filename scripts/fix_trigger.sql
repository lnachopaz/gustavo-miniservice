-- ============================================================
-- FIX TRIGGER — incluye apellido (NOT NULL en clientes)
-- Ejecutar en Supabase → SQL Editor → New query → Run
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  begin
    insert into public.clientes (id, email, nombre, apellido)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'apellido', '')
    )
    on conflict (id) do nothing;
  exception when others then
    null;
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
