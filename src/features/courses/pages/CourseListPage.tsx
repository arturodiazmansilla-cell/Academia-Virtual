import { useState, type FormEvent } from "react";
import { useCourses } from "../hooks/useCourses";
import { CourseCard } from "../components/CourseCard";
import { useNavigate } from "react-router-dom";

export function CourseListPage() {
  const { courses, loading, error, createCourse } = useCourses();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const { error, course } = await createCourse({ title, description, subject, level });
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }
    if (course) navigate(`/cursos/${course.id}`);
  }

  return (
    <>
      <span className="eyebrow">Cursos</span>
      <div className="page-header">
        <h1>Mis cursos</h1>
        <button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Nuevo curso"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="course-form">
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
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="p. ej. Excel, Matemáticas, Photoshop"
              required
            />
          </label>
          <label>
            Nivel
            <input
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="p. ej. Básico, Intermedio"
            />
          </label>
          {formError && <p role="alert">{formError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Creando…" : "Crear curso"}
          </button>
        </form>
      )}

      {loading && <p>Cargando cursos…</p>}
      {error && <p role="alert">{error}</p>}

      <div className="course-list">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {!loading && courses.length === 0 && <p>Todavía no tienes cursos. Crea el primero arriba.</p>}
    </>
  );
}
