-- Módulo 6 (parte 1): solicitudes de acceso con link/QR público
--
-- 1. Nueva tabla enrollment_requests: el alumno se registra con nombre,
--    apellido, email y celular desde un link público (sin cuenta).
-- 2. RLS: el público (anon) puede insertar solo en cursos publicados;
--    instructor/admin ven y gestionan las solicitudes de sus cursos.
-- 3. Trigger: cuando el alumno aprobado crea su cuenta, se lo inscribe
--    automáticamente en sus cursos aprobados.
--
-- Aplicar con: supabase db push  (o pegar en el SQL editor de Supabase)

create table if not exists enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (course_id, email)
);

alter table enrollment_requests enable row level security;

grant select, insert, update on table enrollment_requests to authenticated;
grant insert on table enrollment_requests to anon;

-- El formulario público necesita leer el curso (título) sin sesión
grant select on table courses to anon;

-- Cualquiera (incluso sin cuenta) puede pedir acceso a un curso publicado
create policy "publico_solicita_en_cursos_publicados"
on enrollment_requests for insert
with check (
  exists (
    select 1 from courses c
    where c.id = enrollment_requests.course_id
      and c.status = 'publicado'
  )
);

-- El instructor y el admin ven las solicitudes de sus cursos
create policy "instructor_lee_solicitudes_de_sus_cursos"
on enrollment_requests for select
using (
  exists (
    select 1 from courses c
    where c.id = enrollment_requests.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

-- El instructor y el admin aprueban o rechazan solicitudes de sus cursos
create policy "instructor_gestiona_solicitudes_de_sus_cursos"
on enrollment_requests for update
using (
  exists (
    select 1 from courses c
    where c.id = enrollment_requests.course_id
      and (c.instructor_id = auth.uid() or public.is_admin())
  )
);

-- Al crear su cuenta, el alumno aprobado queda inscrito automáticamente
create or replace function public.enroll_approved_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
begin
  select email into user_email from auth.users where id = new.id;
  if user_email is null then
    return new;
  end if;

  insert into course_enrollments (course_id, student_id)
  select r.course_id, new.id
  from enrollment_requests r
  where lower(r.email) = lower(user_email)
    and r.status = 'aprobado'
  on conflict (course_id, student_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_enroll_approved_on_signup on profiles;
create trigger trg_enroll_approved_on_signup
  after insert on profiles
  for each row execute function public.enroll_approved_on_signup();
