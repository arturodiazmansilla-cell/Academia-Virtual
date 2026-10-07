// src/features/student/pages/MyCoursesPage.tsx
//
// "Mis cursos" del alumno: cursos en los que está inscrito, con opción
// de continuar o cancelar la inscripción (con confirmación previa).

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { Course } from "../../../shared/types/database.types";
import { useEnrollments } from "../hooks/useEnrollments";

export function MyCoursesPage() {
  const { enrollments, loading: loadingEnroll, error: enrollError, unenroll } = useEnrollments();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const courseIds = useMemo(() => enrollments.map((e) => e.course_id), [enrollments]);

  useEffect(() => {
    async function load() {
      if (courseIds.length === 0) {
        setCourses([]);
        setLoadingCourses(false);
        return;
      }
      setLoadingCourses(true);
      const { data } = await supabase.from("courses").select("*").in("id", courseIds);
      setCourses(data ?? []);
      setLoadingCourses(false);
    }
    load();
  }, [courseIds]);

  async function handleUnenroll(course: Course) {
    const ok = window.confirm(
      `¿Seguro que quieres cancelar tu inscripción en "${course.title}"?\n\nPerderás el acceso a sus temas y contenidos.`
    );
    if (!ok) return;
    setCancelingId(course.id);
    const { error } = await unenroll(course.id);
    setCancelingId(null);
    if (error) window.alert(`No se pudo cancelar la inscripción: ${error}`);
  }

  const loading = loadingEnroll || loadingCourses;

  return (
    <>
      <span className="eyebrow">Alumno</span>
      <div className="page-header">
        <div>
          <h1>Mis cursos</h1>
          <p className="course-meta">{enrollments.length} inscripciones</p>
        </div>
        <Link to="/catalogo" className="secondary">
          Explorar catálogo
        </Link>
      </div>

      {loading && <p>Cargando tus cursos…</p>}
      {enrollError && <p role="alert">{enrollError}</p>}

      {!loading && !enrollError && (
        <div className="course-list">
          {courses.map((course) => (
            <div key={course.id} className="course-row">
              <span className="status-bar publicado" />
              <div className="course-row-info">
                <h3>{course.title}</h3>
                <p className="course-meta">
                  {course.subject}
                  {course.level ? ` · ${course.level}` : ""}
                </p>
              </div>
              <div className="topic-actions">
                <Link to={`/aprender/${course.id}`}>Continuar</Link>
                <button
                  type="button"
                  className="danger"
                  disabled={cancelingId === course.id}
                  onClick={() => handleUnenroll(course)}
                >
                  {cancelingId === course.id ? "Cancelando…" : "Cancelar inscripción"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !enrollError && courses.length === 0 && (
        <p>
          Todavía no estás inscrito en ningún curso.{" "}
          <Link to="/catalogo">Explora el catálogo →</Link>
        </p>
      )}
    </>
  );
}
