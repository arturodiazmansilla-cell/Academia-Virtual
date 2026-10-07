# Activar WhatsApp en Academia Virtual (06/10/2026)

Meta exige 3 cosas para enviar avisos por WhatsApp: un número registrado,
un token permanente y una **plantilla aprobada** (no se permite texto libre
para mensajes que inicia el negocio).

## Parte 1: App y número en Meta (lo haces tú, ~15 min)

1. Entra a **developers.facebook.com** con tu cuenta de Facebook.
2. **Mis apps → Crear app**. Nombre: `Academia Virtual`. Tipo: **Negocio**.
3. En el panel de la app: **Agregar producto → WhatsApp → Configurar**.
4. Registra tu número:
   - En el menú de WhatsApp de la app ve a **Configuración → Números de teléfono
     → Agregar número de teléfono**.
   - Sigue la verificación (te llega un código por SMS o llamada).
   - IMPORTANTE: ese número quedará desvinculado de la app de WhatsApp normal/
     Business del celular. Usa un número que puedas dedicar a esto (puede ser
     un chip secundario).
   - Copia el **Identificador de número de teléfono** (phone_number_id).
5. Token permanente:
   - Ve a **business.facebook.com → Configuración del negocio**.
   - **Usuarios → Usuarios del sistema → Agregar**. Nombre: `academia-virtual`.
   - Asígnale el activo de **WhatsApp** de tu app.
   - **Generar token** → marca el permiso `whatsapp_business_messaging` →
     copia el token (solo se muestra una vez, guárdalo bien).

## Parte 2: Plantilla del mensaje (la revisa Meta, suele tardar minutos/horas)

1. En developers.facebook.com → tu app → **WhatsApp → Plantillas de mensajes
   → Crear plantilla**.
2. Datos exactos:
   - **Nombre:** `acceso_aprobado`
   - **Idioma:** Español
   - **Categoría:** Utilidad
   - **Cuerpo (cópialo tal cual):**

     Hola {{1}}, tu acceso al curso "{{2}}" en Academia Virtual fue aprobado. Entra directamente aquí: {{3}}

3. Enviar a revisión y esperar que quede **Aprobada**.

## Parte 3: Secrets en Supabase

En tu proyecto Supabase → **Edge Functions → Secrets**, agrega:

| Name | Value |
|---|---|
| WHATSAPP_TOKEN | el token permanente del paso 5 |
| WHATSAPP_PHONE_NUMBER_ID | el identificador del paso 4 |
| WHATSAPP_TEMPLATE_NAME | `acceso_aprobado` |

(Los secrets quedan activos de inmediato, sin redesplegar.)

## Parte 4: Código y deploy

1. Copia el archivo de este zip en tu proyecto (sobrescribe
   `supabase/functions/aprobar-solicitud/index.ts`).
2. `npx supabase functions deploy aprobar-solicitud`
3. Prueba: crea una solicitud con TU número de celular (con código país,
   ej. 59170012345) y apruébala. Debe llegarte el WhatsApp.

## Notas
- El código normaliza el número: si el alumno escribe 8 dígitos, se antepone
  591 automáticamente. Si escribe con código de país, se respeta.
- Mientras la plantilla no esté aprobada, los envíos fallan pero la
  aprobación igual se completa (queda en los logs como aviso).
- Costo: las primeras 1000 conversaciones/mes son gratis; después Meta cobra
  por conversación (precio variable por país).
