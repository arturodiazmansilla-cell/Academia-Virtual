-- La política "admin_lee_todos_los_perfiles" (y la de update equivalente)
-- consultaban la tabla profiles dentro de su propia condición, lo que
-- Postgres rechaza con "infinite recursion detected in policy for relation
-- profiles". La solución estándar es mover esa verificación a una función
-- security definer, que se ejecuta con permisos elevados y por lo tanto no
-- vuelve a pasar por las políticas RLS de profiles.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "admin_lee_todos_los_perfiles" on profiles;
create policy "admin_lee_todos_los_perfiles"
on profiles for select
using (public.is_admin());

drop policy if exists "admin_actualiza_cualquier_perfil" on profiles;
create policy "admin_actualiza_cualquier_perfil"
on profiles for update
using (public.is_admin());
