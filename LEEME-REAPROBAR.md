# Reaprobar solicitudes rechazadas/revocadas (07/10/2026)

## Qué cambia
- En Solicitudes -> pestaña Rechazadas ahora hay botón "Aprobar".
- La función aprobar-solicitud acepta solicitudes en estado "rechazado"
  (antes solo "pendiente"): al reaprobar, crea/recupera la cuenta, inscribe
  de nuevo y envía un enlace de acceso directo fresco.

## Pasos
1. Copia los 2 archivos en tu proyecto (sobrescribir).
2. npx supabase functions deploy aprobar-solicitud
3. Comandos git (uno por uno):
   git add .
   git commit -m "Permite reaprobar solicitudes rechazadas"
   git push
