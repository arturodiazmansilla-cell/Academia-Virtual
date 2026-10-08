// src/features/student/pages/CatalogPage.tsx
//
// Catálogo de cursos publicados, filtrable por categoría y grado
// (rutas /catalogo, /catalogo/:categoria, /catalogo/:categoria/:grado).

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePublishedCourses, type PublishedCourse } from "../hooks/usePublishedCourses";
import { useEnrollments } from "../hooks/useEnrollments";
import {
  CATEGORIES,
  categoryLabel,
  gradeLabel,
  parseCategoryParam,
} from "../../../shared/utils/categories";

function CatalogCard({
  course,
  enrolled,
  onEnroll,
}: {
  course: PublishedCourse;
  enrolled: boolean;
  onEnroll: (courseId: string) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setBusy(true);
    setError(null);
    const err = await onEnroll(course.id);
    if (err) setError(err);
    setBusy(false);
  }

  const tag = course.subject || categoryLabel(course.grade_category);

  return (
    <div className="course-row catalog-card">
      <span className="status-bar publicado" />
      <div className="course-row-info">
        <h3>{course.title}</h3>
        <p className="course-meta">
          {course.subject}
          {course.level ? ` · ${course.level}` : ""}
          {course.instructor_name ? ` · Prof. ${course.instructor_name}` : ""}
        </p>
        <span className="course-tag">{tag}</span>
        {error && <p role="alert">{error}</p>}
      </div>
      <div className="topic-actions">
        {enrolled ? (
          <Link to={`/aprender/${course.id}`} className="secondary">
            Ver curso
          </Link>
        ) : (
          <button type="button" onClick={handleEnroll} disabled={busy}>
            {busy ? "Inscribiendo…" : "Inscribirme"}
          </button>
        )}
      </div>
    </div>
  );
}

export function CatalogPage() {
  const { categoria, grado } = useParams<{ categoria?: string; grado?: string }>();
  const { courses, loading, error } = usePublishedCourses();
  const { enrolledCourseIds, enroll } = useEnrollments();

  const category = parseCategoryParam(categoria);
  const gradeNum = grado ? parseInt(grado, 10) : null;
  const validGrade = gradeNum && gradeNum >= 1 && gradeNum <= 6 ? gradeNum : null;

  const filtered = courses.filter((c) => {
    if (category && c.grade_category !== category) return false;
    if (validGrade && c.grade_number !== validGrade) return false;
    return true;
  });

  const catDef = CATEGORIES.find((c) => c.key === category);

  async function handleEnroll(courseId: string): Promise<string | null> {
    const { error } = await enroll(courseId);
    return error;
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Migas de pan">
        <Link to="/catalogo">Catálogo</Link>
        {catDef && (
          <>
            <span aria-hidden> / </span>
            {validGrade ? (
              <Link to={`/catalogo/${catDef.key}`}>{catDef.label}</Link>
            ) : (
              <span>{catDef.label}</span>
            )}
          </>
        )}
        {catDef && validGrade && (
          <>
            <span aria-hidden> / </span>
            <span>{gradeLabel(catDef.key, validGrade)}</span>
          </>
        )}
      </nav>

      <div className="page-header">
        <div>
          <h1>Cursos disponibles</h1>
          <p className="course-meta">
            {filtered.length} curso{filtered.length === 1 ? "" : "s"} publicado
            {filtered.length === 1 ? "" : "s"}
            {catDef ? ` en ${validGrade ? gradeLabel(catDef.key, validGrade) : catDef.label}` : ""}
          </p>
        </div>
      </div>

      {loading && <p>Cargando cursos…</p>}
      {error && <p role="alert">{error}</p>}

      <div className="course-list">
        {filtered.map((course) => (
          <CatalogCard
            key={course.id}
            course={course}
            enrolled={enrolledCourseIds.has(course.id)}
            onEnroll={handleEnroll}
          />
        ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <p>
          {category
            ? "Todavía no hay cursos publicados en esta categoría."
            : "Todavía no hay cursos publicados. Vuelve pronto."}
        </p>
      )}
    </>
  );
}
