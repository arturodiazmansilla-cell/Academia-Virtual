# Parche diagnóstico + robusto (06/10/2026)

## Qué cambia
1. `aprobar-solicitud` ahora registra CADA paso en los logs ([DIAG aprobar]):
   qué claves encuentra, autenticación, lectura y actualización. Con un solo
   intento veremos el error exacto.
2. Resolución de claves robusta en ambas funciones: prefiere
   SUPABASE_SERVICE_ROLE_KEY (clásica) y acepta todos los formatos de
   SUPABASE_SECRET_KEYS / PUBLISHABLE_KEYS.
3. Se restauró la verificación de admin/instructor en aprobar-solicitud
   (estaba abierta sin control: cualquiera podía aprobar).

## Pasos (importante: copiar ANTES de desplegar)
1. Copia los 2 archivos en tu proyecto (sobrescribir).
2. Redespliega ambas:
   npx supabase functions deploy aprobar-solicitud
   npx supabase functions deploy notificar-solicitud
3. Intenta aprobar UNA vez.
4. Ve a Supabase -> Edge Functions -> aprobar-solicitud -> Logs y mándame
   las líneas que empiezan con [DIAG aprobar].
