// supabase/functions/convertir-a-pdf/index.ts
//
// Convierte un archivo Word/PowerPoint ya subido a Storage en un PDF,
// usando un contenedor Gotenberg (gratuito, self-hosted).
//
// Variables de entorno:
//   GOTENBERG_URL          -> configurada manualmente (supabase secrets set)
//   SUPABASE_URL            -> inyectada automáticamente
//   SUPABASE_SECRET_KEYS    -> inyectada automáticamente. JSON tipo
//                              {"default":"sb_secret_..."} — el equivalente
//                              actual a la antigua SUPABASE_SERVICE_ROLE_KEY.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "topic-content";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase ya no inyecta SUPABASE_SERVICE_ROLE_KEY como variable suelta;
// ahora viene dentro de SUPABASE_SECRET_KEYS, un JSON tipo
// {"default":"sb_secret_..."}. Esta función extrae la clave real.
function getServiceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) {
    throw new Error("Falta la variable SUPABASE_SECRET_KEYS (no está disponible en este entorno).");
  }
  const keys = JSON.parse(raw);
  const key = keys?.default;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEYS no tiene una clave 'default'.");
  }
  return key;
}

serve(async (req) => {
  // El navegador manda una petición OPTIONS antes del POST real
  // (preflight de CORS). Hay que responderla aparte, sin intentar
  // leer un body JSON que no existe.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // IMPORTANTE: se guarda fuera del try porque el body de la petición
  // solo se puede leer una vez. Si se intenta releer (o clonar después
  // de leído) dentro del catch, falla en silencio y el registro se
  // queda atascado en "procesando" sin mostrar el error real.
  let topicContentId: string | undefined;

  try {
    const body = await req.json();
    topicContentId = body?.topic_content_id;

    if (!topicContentId) {
      return new Response(JSON.stringify({ error: "Falta topic_content_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey());
    const gotenbergUrl = Deno.env.get("GOTENBERG_URL")!;

    const { data: registro, error: errBusqueda } = await supabase
      .from("topic_content")
      .select("*")
      .eq("id", topicContentId)
      .single();

    if (errBusqueda || !registro) {
      return new Response(JSON.stringify({ error: "Registro no encontrado" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (registro.content_type === "video") {
      await supabase
        .from("topic_content")
        .update({ conversion_status: "no_aplica" })
        .eq("id", topicContentId);
      return new Response(JSON.stringify({ ok: true, info: "Video, no requiere conversión" }), {
        headers: corsHeaders,
      });
    }

    await supabase
      .from("topic_content")
      .update({ conversion_status: "procesando" })
      .eq("id", topicContentId);

    const { data: archivoOriginal, error: errDescarga } = await supabase.storage
      .from(BUCKET)
      .download(registro.original_file_url);

    if (errDescarga || !archivoOriginal) {
      throw new Error("No se pudo descargar el archivo original: " + errDescarga?.message);
    }

    const formData = new FormData();
    formData.append("files", archivoOriginal, registro.file_name);

    const respuestaGotenberg = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
      method: "POST",
      body: formData,
    });

    if (!respuestaGotenberg.ok) {
      throw new Error(
        `Gotenberg respondió ${respuestaGotenberg.status}: ${await respuestaGotenberg.text()}`
      );
    }

    const pdfBlob = await respuestaGotenberg.blob();

    const rutaPdf = registro.original_file_url
      .replace("original/", "pdf/")
      .replace(/\.\w+$/, ".pdf");

    const { error: errSubida } = await supabase.storage
      .from(BUCKET)
      .upload(rutaPdf, pdfBlob, { contentType: "application/pdf", upsert: true });

    if (errSubida) {
      throw new Error("No se pudo subir el PDF: " + errSubida.message);
    }

    await supabase
      .from("topic_content")
      .update({ pdf_file_url: rutaPdf, conversion_status: "listo" })
      .eq("id", topicContentId);

    return new Response(JSON.stringify({ ok: true, pdf_file_url: rutaPdf }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    if (topicContentId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, getServiceKey());
        await supabase
          .from("topic_content")
          .update({ conversion_status: "error", error_message: String(error) })
          .eq("id", topicContentId);
      } catch (updateError) {
        console.error("No se pudo guardar el estado de error:", updateError);
      }
    }
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});