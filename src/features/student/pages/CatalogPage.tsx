// src/features/student/pages/CatalogPage.tsx
//
// Catálogo de cursos publicados. El alumno puede explorar e inscribirse.

import { useState } from "react";
import { Link } from "react-router-dom";
import { usePublishedCourses, type PublishedCourse } from "../hooks/usePublishedCourses";
import { useEnrollments } from "../hooks/useEnrollments";

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

  return (
    <div className="course-row">
      <span className="status-bar publicado" />
      <div className="course-row-info">
        <h3>{course.title}</h3>
        <p className="course-meta">
          {course.subject}
          {course.level ? ` · ${course.level}` : ""}
          {course.instructor_name ? ` · Prof. ${course.instructor_name}` : ""}
        </p>
        {course.description && <p>{course.description}</p>}
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
  const { courses, loading, error } = usePublishedCourses();
  const { enrolledCourseIds, enroll } = useEnrollments();

  async function handleEnroll(courseId: string): Promise<string | null> {
    const { error } = await enroll(courseId);
    return error;
  }

  return (
    <>
      <span className="eyebrow">Catálogo</span>
      <div className="page-header">
        <div>
          <h1>Cursos disponibles</h1>
          <p className="course-meta">{courses.length} cursos publicados</p>
        </div>
      </div>

      {loading && <p>Cargando cursos…</p>}
      {error && <p role="alert">{error}</p>}

      <div className="course-list">
        {courses.map((course) => (
          <CatalogCard
            key={course.id}
            course={course}
            enrolled={enrolledCourseIds.has(course.id)}
            onEnroll={handleEnroll}
          />
        ))}
      </div>

      {!loading && !error && courses.length === 0 && (
        <p>Todavía no hay cursos publicados. Vuelve pronto.</p>
      )}
    </>
  );
}
