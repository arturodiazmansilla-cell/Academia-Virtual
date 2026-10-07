import { useMemo, useState, type FormEvent } from "react";
import { useCourses } from "../hooks/useCourses";
import { CourseCard } from "../components/CourseCard";
import { useNavigate } from "react-router-dom";
import type { Course, GradeCategory } from "../../../shared/types/database.types";

const GRADE_ORDER: GradeCategory[] = ["primaria", "secundaria"];

function groupLabel(cat: GradeCategory | "otros"): string {
  if (cat === "primaria") return "Primaria";
  if (cat === "secundaria") return "Secundaria";
  return "Sin clasificar";
}

export function CourseListPage() {
  const { courses, loading, error, createCourse } = useCourses();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [gradeCategory, setGradeCategory] = useState<"" | GradeCategory>("");
  const [gradeNumber, setGradeNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Agrupa por etapa (Primaria, Secundaria, Sin clasificar) y ordena
  // por grado ascendente dentro de cada grupo.
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; courses: Course[] }[] = [];
    for (const cat of GRADE_ORDER) {
      const list = courses
        .filter((c) => c.grade_category === cat)
        .sort(
          (a, b) =>
            (a.grade_number ?? 99) - (b.grade_number ?? 99) ||
            a.title.localeCompare(b.title, "es")
        );
      if (list.length > 0) groups.push({ key: cat, label: groupLabel(cat), courses: list });
    }
    const rest = courses
      .filter((c) => c.grade_category !== "primaria" && c.grade_category !== "secundaria")
      .sort((a, b) => a.title.localeCompare(b.title, "es"));
    if (rest.length > 0) groups.push({ key: "otros", label: groupLabel("otros"), courses: rest });
    return groups;
  }, [courses]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const { error, course } = await createCourse({
      title,
      description,
      subject,
      level,
      gradeCategory: gradeCategory || null,
      gradeNumber: gradeNumber ? parseInt(gradeNumber, 10) : null,
    });
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
          <label>
            Etapa educativa
            <select
              value={gradeCategory}
              onChange={(e) => setGradeCategory(e.target.value as "" | GradeCategory)}
              required
            >
              <option value="">Seleccionar…</option>
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
            </select>
          </label>
          <label>
            Grado
            <select value={gradeNumber} onChange={(e) => setGradeNumber(e.target.value)} required>
              <option value="">Seleccionar…</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}°
                </option>
              ))}
            </select>
          </label>
          {formError && <p role="alert">{formError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Creando…" : "Crear curso"}
          </button>
        </form>
      )}

      {loading && <p>Cargando cursos…</p>}
      {error && <p role="alert">{error}</p>}

      {grouped.map((group) => (
        <section key={group.key}>
          <h2>{group.label}</h2>
          <div className="course-list">
            {group.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ))}

      {!loading && courses.length === 0 && <p>Todavía no tienes cursos. Crea el primero arriba.</p>}
    </>
  );
}
