// src/features/courses/components/TopicContentSection.tsx
//
// Se inserta dentro de cada topic-item en TopicList.tsx. Sigue las mismas
// clases CSS (secondary, danger) usadas en el resto del componente.

import { useState } from "react";
import { useTopicContent } from "../hooks/useTopicContent";
import { ContentViewer } from "./ContentViewer";

interface Props {
  topicId: string;
}

export function TopicContentSection({ topicId }: Props) {
  const { content, loading, error, uploadContent, deleteContent } = useTopicContent(topicId);
  const [expanded, setExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const result = await uploadContent(file);
    if (result?.error) {
      setUploadError(result.error);
    } else {
      setFile(null);
    }
    setUploading(false);
  }

  return (
    <div className="topic-content-section">
      <button type="button" className="secondary" onClick={() => setExpanded((v) => !v)}>
        {expanded ? "Ocultar contenido" : `Contenido (${content.length})`}
      </button>

      {expanded && (
        <div className="topic-content-body">
          {loading && <p>Cargando contenido…</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && content.length === 0 && <p>Este tema todavía no tiene contenido.</p>}

          {content.map((item) => (
            <div key={item.id} className="topic-content-item">
              <div className="topic-content-item-header">
                <span>{item.file_name}</span>
                <button type="button" className="danger" onClick={() => deleteContent(item.id)}>
                  Borrar
                </button>
              </div>
              <ContentViewer item={item} />
            </div>
          ))}

          <div className="topic-content-upload">
            <input
              type="file"
              accept=".mp4,.webm,.mov,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
            <button type="button" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Subiendo…" : "Subir contenido"}
            </button>
            {uploadError && <p role="alert">{uploadError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
