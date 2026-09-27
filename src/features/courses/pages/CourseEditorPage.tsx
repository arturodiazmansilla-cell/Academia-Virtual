import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useCourse } from "../hooks/useCourse";
import { useCourseTopics } from "../hooks/useCourseTopics";
import { TopicList } from "../components/TopicList";

export function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { course, loading, error, updateCourse } = useCourse(courseId);
  const { topics, addTopic, updateTopic, deleteTopic, moveTopic } = useCourseTopics(courseId);

  const [editingInfo, setEditingInfo] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEditInfo() {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description ?? "");
    setSubject(course.subject);
    setLevel(course.level ?? "");
    setEditingInfo(true);
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    const { error } = await updateCourse({ title, description, subject, level });
    if (error) {
      setSaveError(error);
      return;
    }
    setSaveError(null);
    setEditingInfo(false);
  }

  if (loading) return <p>Cargando curso…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!course) return <p>Curso no encontrado.</p>;

  return (
    <>
      <Link to="/cursos" className="eyebrow">← Mis cursos</Link>

      {editingInfo ? (
        <form onSubmit={handleSaveInfo} className="course-form">
          <label>
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          <label>
            Materia / software
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </label>
          <label>
            Nivel
            <input value={level} onChange={(e) => setLevel(e.target.value)} />
          </label>
          {saveError && <p role="alert">{saveError}</p>}
          <div className="topic-actions">
            <button type="submit">Guardar</button>
            <button type="button" className="secondary" onClick={() => setEditingInfo(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="page-header">
          <div>
            <h1>{course.title}</h1>
            <p className="course-meta">
              {course.subject}
              {course.level ? ` · ${course.level}` : ""} — estado: {course.status}
            </p>
            {course.description && <p>{course.description}</p>}
          </div>
          <button onClick={startEditInfo}>Editar datos del curso</button>
        </div>
      )}

      <h2>Temas de avance</h2>
      <TopicList
        topics={topics}
        onAdd={addTopic}
        onUpdate={updateTopic}
        onDelete={deleteTopic}
        onMove={moveTopic}
      />
    </>
  );
}
