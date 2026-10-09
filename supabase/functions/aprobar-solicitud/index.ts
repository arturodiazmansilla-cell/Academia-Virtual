// supabase/functions/aprobar-solicitud/index.ts
//
// Se invoca desde el panel de Solicitudes al aprobar un acceso.
// 1. Verifica que quien llama sea admin o instructor.
// 2. Marca la solicitud como aprobada.
// 3. Si el alumno ya creó su cuenta, lo inscribe de inmediato
//    (si aún no, un trigger lo inscribe al registrarse).
// 4. Le envía un correo avisando que ya puede entrar (mejor esfuerzo).
// 5. Si está configurado WhatsApp, también le escribe a su celular (mejor esfuerzo).
//
// Variables de entorno (supabase secrets set):
//   RESEND_API_KEY          -> API key de Resend
//   ADMIN_EMAIL             -> correo del administrador
//   FROM_EMAIL              -> remitente verificado en Resend (por defecto ADMIN_EMAIL)
//   APP_URL                 -> URL pública de la app (p. ej. https://mi-academia.netlify.app)
//   WHATSAPP_TOKEN          -> (opcional) token permanente de Meta WhatsApp Cloud API
//   WHATSAPP_PHONE_NUMBER_ID-> (opcional) phone number ID de Meta
//   WHATSAPP_TEMPLATE_NAME  -> (opcional) nombre de la plantilla aprobada (por defecto "acceso_aprobado")

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const D = (...a: unknown[]) => console.log("[DIAG aprobar]", ...a);

/** Extrae una clave de los formatos posibles: string, {default:...}, {nombre:...}, [{api_key:...}] */
function pickFromParsed(parsed: unknown): string | null {
  if (typeof parsed === "string" && parsed) return parsed;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const o = parsed as Record<string, unknown>;
    if (typeof o["default"] === "string" && o["default"]) return o["default"] as string;
    for (const v of Object.values(o)) {
      if (typeof v === "string" && v) return v;
    }
  }
  if (Array.isArray(parsed)) {
    for (const k of parsed) {
      if (k && typeof k === "object" && typeof (k as { api_key?: unknown }).api_key === "string") {
        const ak = (k as { api_key: string }).api_key;
        if (ak) return ak;
      }
    }
    if (typeof parsed[0] === "string" && parsed[0]) return parsed[0] as string;
  }
  return null;
}

function getServiceKey(): string {
  // 1) Clave service_role clásica (JWT): la preferida, sin problemas de formato.
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  D("SUPABASE_SERVICE_ROLE_KEY presente:", !!legacy);
  if (legacy) return legacy;
  // 2) Formato nuevo.
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  D("SUPABASE_SECRET_KEYS presente:", !!raw);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      D("forma SECRET_KEYS:", Array.isArray(parsed) ? "array" : typeof parsed);
      const key = pickFromParsed(parsed);
      if (key) {
        D("clave de servicio extraída, inicio:", key.slice(0, 10));
        return key;
      }
    } catch {
      D("SECRET_KEYS no es JSON; probando como texto plano");
      if (/^sb_secret_/.test(raw)) return raw;
    }
  }
  throw new Error("Sin clave de servicio utilizable (ni SUPABASE_SERVICE_ROLE_KEY ni SUPABASE_SECRET_KEYS)");
}

function getPublicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  D("SUPABASE_ANON_KEY presente:", !!legacy);
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  D("SUPABASE_PUBLISHABLE_KEYS presente:", !!raw);
  if (raw) {
    try {
      const key = pickFromParsed(JSON.parse(raw));
      if (key) return key;
    } catch {
      /* noop */
    }
  }
  throw new Error("Sin clave pública utilizable (ni SUPABASE_ANON_KEY ni SUPABASE_PUBLISHABLE_KEYS)");
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log("Sin RESEND_API_KEY: no se envía correo al alumno.");
    return;
  }
  const adminEmail = Deno.env.get("ADMIN_EMAIL");
  const from = Deno.env.get("FROM_EMAIL") || adminEmail || "notificaciones@academia.virtual";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Academia Virtual <${from}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
  }
}

async function sendWhatsApp(
  to: string,
  firstName: string,
  courseTitle: string,
  accessLink: string
): Promise<void> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) {
    console.log("WhatsApp no configurado: se omite el mensaje.");
    return;
  }
  // Nombre de la plantilla aprobada en Meta (ver LEEME-WHATSAPP.md)
  const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "acceso_aprobado";

  // Normaliza a formato internacional: si vienen 8 dígitos (celular boliviano),
  // se antepone el código de país 591.
  let cleanTo = to.replace(/\D/g, "");
  if (cleanTo.length === 8) cleanTo = "591" + cleanTo;

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanTo,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: firstName },
                { type: "text", text: courseTitle },
                { type: "text", text: accessLink },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`WhatsApp respondió ${res.status}: ${await res.text()}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    D("invocación recibida");
    const { request_id } = await req.json();
    D("request_id:", request_id);
    if (!request_id) {
      return new Response(JSON.stringify({ error: "Falta request_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // --- Autenticación: solo admin o instructor ---
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    D("JWT presente:", !!jwt);
    if (!jwt) {
      D("sin JWT -> 401");
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, getPublicKey(), {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    D("getUser ok:", !!user, "error:", authError?.message ?? null);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey(), {
      auth: { persistSession: false },
    });
    D("cliente admin creado");

    const { data: profile, error: errProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    D("rol:", profile?.role ?? null, "error perfil:", errProfile?.message ?? null);
    if (errProfile || (profile?.role !== "admin" && profile?.role !== "instructor")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: solicitud, error: errGet } = await supabase
      .from("enrollment_requests")
      .select("*, courses(title)")
      .eq("id", request_id)
      .single();

    if (errGet || !solicitud) {
      D("ERROR select solicitud:", JSON.stringify(errGet));
      return new Response(
        JSON.stringify({
          error: "DIAG: falló la lectura de la solicitud",
          details: errGet?.message ?? null,
          code: errGet?.code ?? null,
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    D("solicitud encontrada, estado:", solicitud.status);

    if (solicitud.status !== "pendiente" && solicitud.status !== "rechazado") {
      return new Response(
        JSON.stringify({ ok: true, info: `La solicitud ya estaba: ${solicitud.status}` }),
        { headers: corsHeaders }
      );
    }
    if (solicitud.status === "rechazado") {
      D("reaprobando solicitud previamente rechazada/revocada");
    }

    // Marca como aprobada
    const { error: errUpdate } = await supabase
      .from("enrollment_requests")
      .update({ status: "aprobado", reviewed_at: new Date().toISOString() })
      .eq("id", request_id);
    if (errUpdate) {
      D("ERROR update:", JSON.stringify(errUpdate));
      throw new Error("DIAG: no se pudo actualizar: " + errUpdate.message);
    }
    D("solicitud marcada como aprobada");

    // --- 1. Buscar o crear la cuenta del alumno (ya no necesita registrarse) ---
    const studentEmail = String(solicitud.email).toLowerCase();
    let studentId: string | null = null;
    try {
      const { data: users, error: errUsers } = await supabase.auth.admin.listUsers();
      if (errUsers) throw errUsers;
      let match =
        users.users.find((u) => u.email?.toLowerCase() === studentEmail) ?? null;
      if (!match) {
        D("creando cuenta para", studentEmail);
        const { data: created, error: errCreate } =
          await supabase.auth.admin.createUser({
            email: solicitud.email,
            email_confirm: true,
            password: crypto.randomUUID() + "-" + crypto.randomUUID(),
            user_metadata: {
              first_name: solicitud.first_name,
              last_name: solicitud.last_name,
            },
          });
        if (errCreate) throw errCreate;
        match = created.user;
      } else {
        D("el alumno ya tenía cuenta");
      }
      studentId = match?.id ?? null;
    } catch (e) {
      D("ERROR creando/buscando cuenta:", String(e));
    }

    // --- 2. Inscribirlo directamente en el curso (y reactivar si estaba inactivo) ---
    if (studentId) {
      const { error: errEnroll } = await supabase.from("course_enrollments").upsert(
        { course_id: solicitud.course_id, student_id: studentId, is_active: true },
        { onConflict: "course_id,student_id" }
      );
      D("inscripción directa error:", errEnroll?.message ?? null);
    }

    // --- 3. Enlace mágico de acceso directo ---
    // (requiere agregar APP_URL a Redirect URLs en Supabase Auth)
    let accessUrl: string | null = null;
    try {
      const { data: linkData, error: errLink } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: solicitud.email,
          options: { redirectTo: `${appUrl}/mis-cursos` },
        });
      if (errLink) throw errLink;
      accessUrl =
        (linkData?.properties as { action_link?: string } | null)?.action_link ??
        null;
      D("magic link generado:", !!accessUrl);
    } catch (e) {
      D("ERROR magic link:", String(e));
    }

    const courseTitle =
      (solicitud.courses as { title?: string } | null)?.title ?? "el curso";
    const appUrl = (Deno.env.get("APP_URL") || "").replace(/\/$/, "");

    const warnings: string[] = [];

    const html = `
      <h2>¡Acceso aprobado!</h2>
      <p>Hola ${solicitud.first_name},</p>
      <p>Tu cuenta ya está lista y el curso <strong>${courseTitle}</strong>
      está habilitado para ti. No necesitas registrarte: entra directamente aquí:</p>
      ${
        accessUrl
          ? `<p><a href="${accessUrl}" style="display:inline-block;padding:12px 20px;background:#5b2333;color:#fff;text-decoration:none;border-radius:6px;">Entrar directamente a mi curso</a></p>
             <p style="font-size:13px;color:#555;">Si el botón no funciona, copia este enlace en tu navegador:<br>${accessUrl}</p>`
          : `<p>Entra a ${appUrl}/login con tu correo (${solicitud.email}).</p>`
      }
      <p style="font-size:13px;color:#555;">Si el enlace vence, entra a ${appUrl}/login
      con tu correo y usa "¿Olvidaste tu contraseña?" para definir tu clave.</p>
    `;

    // Los avisos son "mejor esfuerzo": si fallan, la aprobación igual queda.
    try {
      await sendEmail(
        solicitud.email,
        `Acceso aprobado: ${courseTitle} — Academia Virtual`,
        html
      );
      D("correo enviado (o omitido sin API key)");
    } catch (e) {
      warnings.push(`correo al alumno: ${e}`);
    }

    try {
      await sendWhatsApp(
        solicitud.phone,
        solicitud.first_name,
        courseTitle,
        // Enlace directo; si no se pudo generar, el login como respaldo
        accessUrl ?? `${appUrl}/login`
      );
      D("whatsapp enviado (u omitido)");
    } catch (e) {
      warnings.push(`whatsapp: ${e}`);
    }

    if (warnings.length > 0) {
      console.error("Avisos no enviados:", warnings);
    }

    D("fin OK");
    return new Response(JSON.stringify({ ok: true, warnings }), { headers: corsHeaders });
  } catch (error) {
    console.error("[DIAG aprobar] ERROR no controlado:", error);
    return new Response(
      JSON.stringify({ error: "DIAG: error interno", details: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
