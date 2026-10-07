// supabase/functions/aprobar-solicitud/index.ts
//
// Se invoca desde el panel de Solicitudes al aprobar un acceso.
// 1. Marca la solicitud como aprobada.
// 2. Si el alumno ya creó su cuenta, lo inscribe de inmediato
//    (si aún no, un trigger lo inscribe al registrarse).
// 3. Le envía un correo avisando que ya puede entrar.
// 4. Si está configurado WhatsApp, también le escribe a su celular.
//
// Variables de entorno (supabase secrets set):
//   RESEND_API_KEY          -> API key de Resend
//   ADMIN_EMAIL             -> correo del administrador
//   FROM_EMAIL              -> remitente verificado en Resend (por defecto ADMIN_EMAIL)
//   APP_URL                 -> URL pública de la app (p. ej. https://mi-academia.netlify.app)
//   WHATSAPP_TOKEN          -> (opcional) token de Meta WhatsApp Cloud API
//   WHATSAPP_PHONE_NUMBER_ID-> (opcional) phone number ID de Meta

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) {
    throw new Error("Falta la variable SUPABASE_SECRET_KEYS.");
  }
  const keys = JSON.parse(raw);
  const key = keys?.default;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEYS no tiene una clave 'default'.");
  }
  return key;
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

async function sendWhatsApp(to: string, message: string): Promise<void> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) {
    console.log("WhatsApp no configurado: se omite el mensaje.");
    return;
  }

  const cleanTo = to.replace(/\D/g, "");
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
        type: "text",
        text: { body: message },
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
    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "Falta request_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey());

    const { data: solicitud, error: errGet } = await supabase
      .from("enrollment_requests")
      .select("*, courses(title)")
      .eq("id", request_id)
      .single();

    if (errGet || !solicitud) {
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (solicitud.status !== "pendiente") {
      return new Response(
        JSON.stringify({ ok: true, info: `La solicitud ya estaba: ${solicitud.status}` }),
        { headers: corsHeaders }
      );
    }

    // Marca como aprobada
    const { error: errUpdate } = await supabase
      .from("enrollment_requests")
      .update({ status: "aprobado", reviewed_at: new Date().toISOString() })
      .eq("id", request_id);
    if (errUpdate) throw new Error("No se pudo aprobar: " + errUpdate.message);

    // Si el alumno ya tiene cuenta, inscribirlo ahora mismo
    // (si no, el trigger trg_enroll_approved_on_signup lo hará al registrarse)
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const match = users?.users.find(
        (u) => u.email?.toLowerCase() === String(solicitud.email).toLowerCase()
      );
      if (match) {
        await supabase.from("course_enrollments").upsert(
          { course_id: solicitud.course_id, student_id: match.id },
          { onConflict: "course_id,student_id" }
        );
      }
    } catch (e) {
      console.error("No se pudo inscribir de inmediato:", e);
    }

    const courseTitle =
      (solicitud.courses as { title?: string } | null)?.title ?? "el curso";
    const appUrl = (Deno.env.get("APP_URL") || "").replace(/\/$/, "");
    const nombre = `${solicitud.first_name} ${solicitud.last_name}`;

    const html = `
      <h2>¡Acceso aprobado!</h2>
      <p>Hola ${solicitud.first_name},</p>
      <p>Tu solicitud para el curso <strong>${courseTitle}</strong> fue aprobada.
      Ya puedes acceder a los contenidos.</p>
      <p>Pasos:</p>
      <ol>
        <li>Crea tu cuenta en Academia Virtual con este mismo correo (${solicitud.email}).</li>
        <li>Entra a <strong>Mis cursos</strong> y verás el curso habilitado.</li>
      </ol>
      ${
        appUrl
          ? `<p><a href="${appUrl}/registro" style="display:inline-block;padding:10px 18px;background:#5b2333;color:#fff;text-decoration:none;border-radius:6px;">Crear mi cuenta</a></p>`
          : ""
      }
    `;

    await sendEmail(
      solicitud.email,
      `Acceso aprobado: ${courseTitle} — Academia Virtual`,
      html
    );

    await sendWhatsApp(
      solicitud.phone,
      `Hola ${solicitud.first_name}, tu acceso al curso "${courseTitle}" en Academia Virtual fue aprobado. Crea tu cuenta con tu correo ${solicitud.email} para entrar.`
    );

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
