#CONTEXTO DEL PROYECTO
## Sistema de Academia Virtual

## Tecnologías
- React
- TypeScript
- Vite
- Supabase
- MetLife
- GitHub

## Ubicación local
"D:\OneDrive\Escritorio\Sistemas\academia-virtual"

## Repositorio
Rama principal: main

## Estado actual
- Autenticación: funcionando
- Agregar Mis Cursos Funcionando

## Base de datos
Supabase.

## ÚLTIMO ESTADO
Fecha: 06/10/2026

## Módulo 4: vista del alumno (implementado 06/10/2026)
- **Rutas nuevas** (alumno y admin): `/catalogo` (cursos publicados),
  `/mis-cursos` (inscripciones del alumno), `/aprender/:courseId` (temas y
  contenidos en solo lectura, reutiliza `ContentViewer`).
- **Nuevos archivos**: `src/features/student/hooks/usePublishedCourses.ts`,
  `src/features/student/hooks/useEnrollments.ts`,
  `src/features/student/pages/CatalogPage.tsx`,
  `src/features/student/pages/MyCoursesPage.tsx`,
  `src/features/student/pages/StudentCoursePage.tsx`.
- **Modificados**: `src/app/router.tsx`, `src/app/AppShell.tsx` (navegación
  según rol), `src/app/HomePage.tsx`, `src/shared/types/database.types.ts`
  (nuevo tipo `CourseEnrollment` + tabla en `Database`).
- **Base de datos**: migración `supabase/migrations/0006_enrollments_and_student_access.sql`
  — tabla `course_enrollments` (unique por curso+alumno), políticas RLS para
  ver cursos/temas/contenidos publicados, inscribirse y cancelar inscripción,
  y lectura de perfiles de instructores para el catálogo. La inscripción es
  abierta (sin aprobación); el panel de autorización (módulo 6) podrá
  restringirla después.
- **Corrección**: `database.types.ts` no cumplía el contrato de
  `@supabase/supabase-js` 2.117 (faltaban `Views`, `Functions` y
  `Relationships`, y usaba `interface` en vez de `type`), así que
  `tsc -b` fallaba en todo el proyecto con tipos `never`. Se corrigió
  siguiendo el formato del CLI y se agregó `src/vite-env.d.ts`.
  Ahora `npx tsc -b` y `npx vite build` pasan limpio.
- **Pendiente de aplicar**: ejecutar la migración 0006 en Supabase
  (`supabase db push` o SQL editor) antes de probar la vista del alumno.

## Agrupación de cursos por etapa y grado (06/10/2026)
- **Migración** `supabase/migrations/0007_course_grade_grouping.sql`:
  columnas `grade_category` ('primaria'|'secundaria') y `grade_number`
  (1-6) en `courses`, con relleno automático desde el título para los
  cursos existentes ("1ro de primaria" -> primaria/1, etc.).
- **Mis cursos** (`CourseListPage`): lista agrupada en bloques Primaria /
  Secundaria / Sin clasificar, ordenada por grado ascendente (1°, 2°…).
  La tarjeta muestra "1° de Primaria ·" en la línea de materia.
- **Formularios**: crear y editar curso ahora piden Etapa educativa y
  Grado (selectores, obligatorios).
- **Tipos**: `GradeCategory` y campos nuevos en `Course`
  (`database.types.ts`); `useCourses.createCourse` y
  `useCourse.updateCourse` aceptan los campos.
- `tsc -b` y `vite build` pasan limpio.

## Publicar curso + solicitudes de acceso con link/QR (06/10/2026)
- **Migración** `supabase/migrations/0008_enrollment_requests.sql`: tabla
  `enrollment_requests` (nombre, apellido, email, celular, estado
  pendiente/aprobado/rechazado); RLS: el público (anon) puede insertar solo
  en cursos publicados; instructor/admin gestionan las de sus cursos.
  Trigger `trg_enroll_approved_on_signup`: al crear su cuenta, el alumno
  aprobado queda inscrito automáticamente.
- **Editor del curso**: botón "Publicar curso" (con confirmación) y "Volver
  a borrador". Publicado: muestra link de inscripción + QR (qrcode.react)
  + botón copiar.
- **Ruta pública** `/inscripcion/:courseId` (sin sesión): formulario de
  solicitud; al enviar invoca la Edge Function `notificar-solicitud`.
- **Panel** `/solicitudes` (instructor/admin): pestañas
  pendientes/aprobadas/rechazadas/todas; aprobar invoca
  `aprobar-solicitud` (inscribe si ya tiene cuenta, avisa por correo y
  WhatsApp); rechazar es directo. Insignia con conteo en la navegación.
- **Edge Functions**: `notificar-solicitud` (correo al admin vía Resend +
  link para agendar recordatorio en Google Calendar),
  `aprobar-solicitud` (correo al alumno + WhatsApp opcional vía Meta Cloud
  API). Requieren secrets: RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL,
  APP_URL (+ WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID opcionales).
- **Dependencia nueva**: qrcode.react (package.json actualizado).
- `tsc -b` y `vite build` pasan limpio.
- **Pendiente del equipo**: aplicar migración 0008, `npm install`,
  desplegar las 2 functions, configurar secrets/Resend/WhatsApp (ver LEEME).

## REGLAS
- No cambiar tecnologías.
- No eliminar funcionalidades existentes.
- No modificar Supabase sin explicar primero.
- Mantener React + TypeScript + Vite.
- Antes de modificar archivos, revisar la estructura existente.

## PRÓXIMO PASO
Continuar con:
módulo 3: cargar el contenido de cada tema (video, Word, PowerPoint). Para eso te pregunté cómo prefieres manejar la vista previa de Word/PowerPoint:

Simple: subir archivo + botón de descarga (sin vista previa embebida) — más rápido de construir
Con vista previa: Office Online Viewer — pero exige que los archivos sean públicos, no privados
Conversión a PDF: más robusto, pero toma más tiempo de implementar ahora