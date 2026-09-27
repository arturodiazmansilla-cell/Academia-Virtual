import { useState } from "react";
import type { CourseTopic } from "../../../shared/types/database.types";

interface Props {
  topics: CourseTopic[];
  onAdd: (input: { title: string; description: string }) => Promise<{ error: string | null } | void>;
  onUpdate: (id: string, input: { title: string; description: string }) => Promise<{ error: string | null } | void>;
  onDelete: (id: string) => Promise<{ error: string | null } | void>;
  onMove: (id: string, direction: "up" | "down") => void;
}

export function TopicList({ topics, onAdd, onUpdate, onDelete, onMove }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function handleAdd() {
    if (!newTitle.trim()) return;
    await onAdd({ title: newTitle, description: newDescription });
    setNewTitle("");
    setNewDescription("");
  }

  function startEdit(topic: CourseTopic) {
    setEditingId(topic.id);
    setEditTitle(topic.title);
    setEditDescription(topic.description ?? "");
  }

  async function saveEdit(id: string) {
    await onUpdate(id, { title: editTitle, description: editDescription });
    setEditingId(null);
  }

  return (
    <div className="topic-list">
      {topics.length === 0 && <p>Este curso todavía no tiene temas de avance.</p>}

      {topics.map((topic, index) => (
        <div key={topic.id} className="topic-item">
          {editingId === topic.id ? (
            <div className="topic-edit-form">
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
              <div className="topic-actions">
                <button onClick={() => saveEdit(topic.id)}>Guardar</button>
                <button onClick={() => setEditingId(null)} className="secondary">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="topic-order-controls">
                <button
                  onClick={() => onMove(topic.id, "up")}
                  disabled={index === 0}
                  aria-label="Subir tema"
                >
                  ↑
                </button>
                <button
                  onClick={() => onMove(topic.id, "down")}
                  disabled={index === topics.length - 1}
                  aria-label="Bajar tema"
                >
                  ↓
                </button>
              </div>
              <div className="topic-info">
                <strong>
                  {index + 1}. {topic.title}
                </strong>
                {topic.description && <p>{topic.description}</p>}
              </div>
              <div className="topic-actions">
                <button onClick={() => startEdit(topic)} className="secondary">
                  Editar
                </button>
                <button onClick={() => onDelete(topic.id)} className="danger">
                  Borrar
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <div className="topic-add-form">
        <h4>Agregar tema</h4>
        <input
          placeholder="Título del tema"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          placeholder="Descripción (opcional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          rows={2}
        />
        <button onClick={handleAdd} disabled={!newTitle.trim()}>
          Agregar tema
        </button>
      </div>
    </div>
  );
}
