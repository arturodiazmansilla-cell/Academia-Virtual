// src/features/student/pages/StudentCoursePage.tsx
//
// Vista de aprendizaje del alumno: temas del curso y sus contenidos
// en modo solo lectura. Reutiliza ContentViewer para video y PDF.

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCourse } from "../../courses/hooks/useCourse";
import { useCourseTopics } from "../../courses/hooks/useCourseTopics";
import { useTopicContent } from "../../courses/hooks/useTopicContent";
import { ContentViewer } from "../../courses/components/ContentViewer";
import { useEnrollments } from "../hooks/useEnrollments";
import { useAuth } from "../../auth/hooks/useAuth";

function StudentTopicItem({ topicId, title, description }: { topicId: string; title: string; description: string | null }) {
  const [open, setOpen] = useState(false);
  const { content, loading, error } = useTopicContent(open ? topicId : undefined);

  return (
    <div className="topic-item">
      <div className="topic-info">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="topic-actions">
        <button type="button" className="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Ocultar" : "Ver contenido"}
        </button>
      </div>
      {open && (
        <div className="topic-content-body">
          {loading && <p>Cargando contenido…</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && content.length === 0 && (
            <p>Este tema todavía no tiene contenido.</p>
          )}
          {content.map((item) => (
            <div key={item.id} className="topic-content-item">
              <div className="topic-content-item-header">
                <span>{item.file_name}</span>
              </div>
              <ContentViewer item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { course, loading: loadingCourse, error: courseError } = useCourse(courseId);
  const { topics, loading: loadingTopics } = useCourseTopics(courseId);
  const { enrolledCourseIds, loading: loadingEnroll } = useEnrollments();
  const { profile } = useAuth();

  if (loadingCourse || loadingEnroll) return <p>Cargando curso…</p>;
  if (courseError) return <p role="alert">{courseError}</p>;
  if (!course) return <p>Curso no encontrado.</p>;

  const isAdmin = profile?.role === "admin";
  const enrolled = courseId ? enrolledCourseIds.has(courseId) : false;

  if (course.status !== "publicado" && !isAdmin) {
    return (
      <>
        <Link to="/catalogo" className="eyebrow">← Catálogo</Link>
        <p>Este curso no está disponible.</p>
      </>
    );
  }

  if (!enrolled && !isAdmin) {
    return (
      <>
        <Link to="/catalogo" className="eyebrow">← Catálogo</Link>
        <h1>{course.title}</h1>
        <p>No tienes acceso a este curso. El acceso lo habilita tu instructor: solicítalo desde el catálogo.</p>
        <p>
          <Link to="/catalogo">Volver al catálogo →</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Link to="/mis-cursos" className="eyebrow">← Mis cursos</Link>
      <div className="page-header">
        <div>
          <h1>{course.title}</h1>
          <p className="course-meta">
            {course.subject}
            {course.level ? ` · ${course.level}` : ""}
          </p>
          {course.description && <p>{course.description}</p>}
        </div>
      </div>

      <h2>Temas</h2>
      {loadingTopics && <p>Cargando temas…</p>}
      {!loadingTopics && topics.length === 0 && <p>Este curso todavía no tiene temas.</p>}
      <div className="topic-list">
        {topics.map((topic) => (
          <StudentTopicItem
            key={topic.id}
            topicId={topic.id}
            title={topic.title}
            description={topic.description}
          />
        ))}
      </div>
    </>
  );
}
