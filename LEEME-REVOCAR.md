# Revocar acceso aprobado (07/10/2026)

## Qué hace
En Solicitudes -> pestaña Aprobadas ahora hay un botón "Revocar acceso".
Al usarlo (con diálogo de confirmación):
1. Se elimina la inscripción del alumno al curso (pierde el acceso de inmediato).
2. La solicitud pasa a la pestaña Rechazadas.
La cuenta del alumno se conserva (puede tener otros cursos).

## Pasos
1. Copia los archivos en tu proyecto (sobrescribir):
   - supabase/functions/revocar-acceso/index.ts (NUEVO)
   - src/features/requests/pages/RequestsPage.tsx
   - src/features/requests/hooks/useEnrollmentRequests.ts
2. Despliega la función:
   npx supabase functions deploy revocar-acceso
3. Commit + push (Netlify redespliega el panel con el botón nuevo).
