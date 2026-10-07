# Parche: la aprobación no debe caerse si falla el aviso

Fecha: 06/10/2026

## Problema
Al aprobar salía "Edge Function returned a non-2xx status code".
Causa probable: Resend rechaza enviar el correo al alumno si no tienes
un dominio verificado (solo permite enviarte a ti mismo), y ese error
tumbaba toda la función.

## Cambio
`supabase/functions/aprobar-solicitud/index.ts`: los avisos (correo y
WhatsApp) ahora son "mejor esfuerzo". La aprobación y la inscripción se
completan siempre; si un aviso falla, queda registrado en los logs de la
función sin romper nada.

## Pasos
1. Copia el archivo en tu proyecto (sobrescribir).
2. Redespliega:
   npx supabase functions deploy aprobar-solicitud
3. Prueba aprobar de nuevo.

## Nota sobre Resend
Para que el correo SÍ le llegue al alumno (no solo a ti), verifica un
dominio en Resend (Domains -> Add Domain). Mientras tanto, en las pruebas
usa tu propio correo como email del alumno.
