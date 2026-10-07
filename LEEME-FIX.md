# Parche: corrección del envío de solicitud pública

Fecha: 06/10/2026

## Problema
El formulario de inscripción mostraba "No se pudo enviar tu solicitud".
Causa: insertaba pidiendo el id de vuelta (`.select("id")`), pero las
políticas RLS solo permiten a un visitante INSERTAR en
`enrollment_requests`, no leerla. El `RETURNING` era rechazado.

## Archivos
- src/features/enrollment/pages/EnrollmentPage.tsx (modificado)
- supabase/functions/notificar-solicitud/index.ts (modificado)
- Contexto-del-proyecto.md (modificado)

## Pasos
1. Copia los archivos en tu proyecto.
2. Redespliega la función:
   npx supabase functions deploy notificar-solicitud
3. Commit + push (Netlify redespliega solo con el fix del formulario).
4. Prueba de nuevo desde el celular en incógnito.
