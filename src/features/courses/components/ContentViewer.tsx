// src/features/courses/components/ContentViewer.tsx

import { useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { TopicContent } from "../../../shared/types/database.types";

const BUCKET = "topic-content";

interface Props {
  item: TopicContent;
}

export function ContentViewer({ item }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState(item.conversion_status);
  const [errorMessage, setErrorMessage] = useState(item.error_message);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    async function checkAndLoad() {
      const { data, error } = await supabase
        .from("topic_content")
        .select("conversion_status, pdf_file_url, original_file_url, error_message")
        .eq("id", item.id)
        .single();

      if (error || !data) return;
      setStatus(data.conversion_status);
      setErrorMessage(data.error_message);

      const ready = item.content_type === "video" || (data.conversion_status === "listo" && data.pdf_file_url);

      if (ready) {
        const path = item.content_type === "video" ? data.original_file_url : (data.pdf_file_url as string);
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
        setSignedUrl(signed?.signedUrl ?? null);
        if (interval) clearInterval(interval);
      }
    }

    checkAndLoad();
    if (item.content_type !== "video" && item.conversion_status !== "listo") {
      interval = setInterval(checkAndLoad, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  if (item.content_type === "video") {
    if (!signedUrl) return <p>Cargando video…</p>;
    return (
      <div className={expandido ? "topic-content-viewer-expandido" : undefined}>
        <div className="topic-content-viewer-toolbar">
          <button type="button" className="secondary" onClick={() => setExpandido((v) => !v)}>
            {expandido ? "Achicar" : "Expandir"}
          </button>
          <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="secondary">
            Abrir en pestaña nueva
          </a>
        </div>
        <video
          controls
          className={expandido ? "topic-content-video topic-content-video-grande" : "topic-content-video"}
          src={signedUrl}
        />
      </div>
    );
  }

  if (status === "error") {
    return <p role="alert">Error al convertir: {errorMessage ?? "desconocido"}</p>;
  }

  if (status !== "listo" || !signedUrl) {
    return <p>Convirtiendo a PDF, esto puede tardar unos segundos…</p>;
  }

  return (
    <div className={expandido ? "topic-content-viewer-expandido" : undefined}>
      <div className="topic-content-viewer-toolbar">
        <button type="button" className="secondary" onClick={() => setExpandido((v) => !v)}>
          {expandido ? "Achicar" : "Expandir"}
        </button>
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="secondary">
          Abrir en pestaña nueva
        </a>
      </div>
      <iframe
        title={item.file_name}
        src={signedUrl}
        className={expandido ? "topic-content-pdf topic-content-pdf-grande" : "topic-content-pdf"}
      />
    </div>
  );
}
