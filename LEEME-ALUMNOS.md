# Gestión de alumnos + acceso solo con habilitación (08/10/2026)

## 1. Nueva página "Alumnos" (instructor/admin)
- Menú lateral → **Alumnos**: tabla de inscritos con filtros por
  **nombre** y **curso**.
- Acciones por alumno (con confirmación en español):
  - **Desactivar/Reactivar**: le quita/devuelve el acceso al curso sin
    borrar la inscripción (el alumno deja de ver el curso y sus contenidos).
  - **Desinscribir**: elimina la inscripción (no se puede deshacer).

## 2. El acceso lo controla solo el administrador
- Se eliminó la auto-inscripción directa ("Inscribirme" del catálogo).
  Ahora el catálogo muestra **"Solicitar acceso"** (lleva al formulario con
  nombre/correo prellenados) o **"Solicitud pendiente"** si ya la pidió.
- El alumno solo ve y entra a cursos con inscripción ACTIVA:
  - Temas, contenidos y archivos exigen inscripción activa (también en la BD).
  - Un alumno desactivado no ve el curso en "Mis cursos" ni puede entrar.
- Al reaprobar una solicitud, la inscripción se reactiva automáticamente.

## Pasos
1. **Supabase → SQL Editor**: ejecuta
   `supabase/migrations/0011_gestion_alumnos_y_acceso.sql`
2. Copia TODOS los archivos del zip en tu proyecto (respetando carpetas).
3. Redespliega la función (cambio menor: reactiva al aprobar):
   npx supabase functions deploy aprobar-solicitud
4. Comandos git (uno por uno):
   git add .
   git commit -m "Gestion de alumnos y acceso solo con habilitacion"
   git push
