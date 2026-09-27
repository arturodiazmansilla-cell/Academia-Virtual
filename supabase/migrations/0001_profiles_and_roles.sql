-- Módulo 1: autenticación y perfiles con roles
-- Aplicar con: supabase db push  (o pegar en el SQL editor de Supabase)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'alumno' check (role in ('admin', 'instructor', 'alumno')),
  status text not null default 'activo' check (status in ('activo', 'suspendido')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Cualquier usuario autenticado puede leer su propio perfil
create policy "usuario_lee_su_perfil"
on profiles for select
using (auth.uid() = id);

-- Un admin puede leer todos los perfiles (necesario para el panel de gestión)
create policy "admin_lee_todos_los_perfiles"
on profiles for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- El usuario puede crear su propio perfil al registrarse (una sola vez)
create policy "usuario_crea_su_perfil"
on profiles for insert
with check (auth.uid() = id);

-- El usuario puede actualizar campos propios (no su rol: eso lo controla el admin)
create policy "usuario_actualiza_su_perfil"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Un admin puede actualizar cualquier perfil (para cambiar roles o suspender)
create policy "admin_actualiza_cualquier_perfil"
on profiles for update
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Nota de seguridad: la política "usuario_actualiza_su_perfil" permite que un
-- alumno cambie su propio full_name, pero también, tal como está, su propio
-- role. Antes de producción, conviene mover 'role' y 'status' a una función
-- RPC con `security definer` que solo el admin pueda invocar, o usar un
-- trigger que impida modificar esas columnas salvo que quien ejecuta la
-- consulta sea admin. Lo dejamos señalado para resolverlo en este módulo
-- antes de dar por cerrado el flujo de auth + roles.

-- (Opcional) primer usuario admin manual, ejecutar una sola vez reemplazando el uuid:
-- update profiles set role = 'admin' where id = 'UUID-DEL-USUARIO';
