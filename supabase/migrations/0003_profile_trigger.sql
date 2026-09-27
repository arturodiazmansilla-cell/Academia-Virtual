-- Crea el perfil automáticamente cuando se registra un usuario en auth.users.
-- Corre como "security definer", así que no depende de los GRANT/RLS del
-- cliente ni de si el usuario ya tiene sesión activa (evita el error
-- "permission denied for table profiles" cuando falta la confirmación de
-- correo).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'alumno',
    'activo'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
