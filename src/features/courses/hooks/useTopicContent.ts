// src/features/courses/hooks/useTopicContent.ts
//
// Mismo patrón que useCourseTopics: reload(), funciones que devuelven
// { error: string | null }, sin lanzar excepciones.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { TopicContent, TopicContentType } from "../../../shared/types/database.types";

const BUCKET = "topic-content";

function detectContentType(fileName: string): TopicContentType | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["mp4", "webm", "mov"].includes(ext ?? "")) return "video";
  if (["doc", "docx"].includes(ext ?? "")) return "word";
  if (["ppt", "pptx"].includes(ext ?? "")) return "powerpoint";
  return null;
}

// Supabase Storage rechaza tildes, "ñ" y varios caracteres especiales en
// las rutas de archivo. El nombre "bonito" (file.name) se sigue guardando
// tal cual para mostrarlo en pantalla; esto solo limpia la ruta interna.
function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes/diacríticos
    .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // reemplaza todo lo demás por "_"
}

export function useTopicContent(topicId: string | undefined) {
  const [content, setContent] = useState<TopicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("topic_content")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setContent(data ?? []);
    }
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function uploadContent(file: File) {
    if (!topicId) return { error: "Tema no encontrado." };

    const contentType = detectContentType(file.name);
    if (!contentType) {
      return {
        error: "Formato no soportado. Usa video (.mp4/.webm/.mov), Word (.doc/.docx) o PowerPoint (.ppt/.pptx).",
      };
    }

    const storagePath = `original/${topicId}/${Date.now()}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
    if (uploadError) return { error: uploadError.message };

    const { data: inserted, error: insertError } = await supabase
      .from("topic_content")
      .insert({
        topic_id: topicId,
        content_type: contentType,
        file_name: file.name,
        original_file_url: storagePath,
        conversion_status: contentType === "video" ? "no_aplica" : "pendiente",
      })
      .select()
      .single();

    if (insertError) return { error: insertError.message };

    if (contentType !== "video") {
      const { error: fnError } = await supabase.functions.invoke("convertir-a-pdf", {
        body: { topic_content_id: inserted.id },
      });
      if (fnError) {
        // El registro ya quedó guardado como "pendiente"; se puede
        // reintentar la conversión más adelante sin volver a subir el archivo.
        console.error("Error al invocar la conversión:", fnError);
      }
    }

    await reload();
    return { error: null };
  }

  async function deleteContent(contentId: string) {
    const item = content.find((c) => c.id === contentId);

    const { error } = await supabase.from("topic_content").delete().eq("id", contentId);
    if (error) return { error: error.message };

    if (item) {
      const paths = [item.original_file_url, item.pdf_file_url].filter(Boolean) as string[];
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
    }

    await reload();
    return { error: null };
  }

  return { content, loading, error, reload, uploadContent, deleteContent };
}
