// src/features/student/pages/CatalogPage.tsx
//
// Sección "Cursos", filtrable por categoría y grado
// (rutas /catalogo, /catalogo/:categoria, /catalogo/:categoria/:grado).
// El alumno ve solo cursos publicados; el administrador ve todos.

import { Link, useNavigate, useParams } from "react-router-dom";
import { usePublishedCourses, type PublishedCourse } from "../hooks/usePublishedCourses";
import { useEnrollments } from "../hooks/useEnrollments";
import { useMyRequests } from "../../requests/hooks/useMyRequests";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  CATEGORIES,
  categoryLabel,
  gradeLabel,
  parseCategoryParam,
} from "../../../shared/utils/categories";

const STATUS_LABEL: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  rechazado: "Rechazado",
};

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Antigüedad de publicación: "nuevo" (verde, publicado en la última semana)
 * o "semana" (amarillo, ya pasó la semana). Solo para cursos publicados.
 */
function courseRecency(course: PublishedCourse): "nuevo" | "semana" | null {
  if (course.status !== "publicado" || !course.published_at) return null;
  const age = Date.now() - new Date(course.published_at).getTime();
  if (Number.isNaN(age) || age < 0) return null;
  return age <= SEMANA_MS ? "nuevo" : "semana";
}

function CatalogCard({
  course,
  enrolled,
  requestStatus,
  studentName,
  studentEmail,
  isAdmin,
}: {
  course: PublishedCourse;
  enrolled: boolean;
  requestStatus: string | undefined;
  studentName: string;
  studentEmail: string;
  isAdmin: boolean;
}) {
  const tag = course.subject || categoryLabel(course.grade_category);
  const recency = courseRecency(course);

  // Nombre y apellido para prellenar el formulario de solicitud
  const [firstName, ...rest] = studentName.trim().split(/\s+/);
  const prefill = {
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    email: studentEmail,
  };

  return (
    <div className={`course-row catalog-card${recency ? ` curso-${recency}` : ""}`}>
      <span className={`status-bar ${course.status}`} />
      <div className="course-row-info">
        <h3>{course.title}</h3>
        <p className="course-meta">
          {course.subject}
          {course.level ? ` · ${course.level}` : ""}
          {course.instructor_name ? ` · Prof. ${course.instructor_name}` : ""}
        </p>
        <span className="course-tag">{tag}</span>
        {recency === "nuevo" && (
          <span className="course-tag tag-nuevo" style={{ marginLeft: "0.5rem" }}>
            Nuevo
          </span>
        )}
        {isAdmin && (
          <span className="course-tag" style={{ marginLeft: "0.5rem" }}>
            {STATUS_LABEL[course.status] ?? course.status}
          </span>
        )}
      </div>
      {isAdmin ? (
        <div className="topic-actions">
          <Link to={`/cursos/${course.id}`}>Editar</Link>
          <Link to={`/aprender/${course.id}`} className="secondary">
            Ver
          </Link>
        </div>
      ) : (
        <div className="topic-actions">
          {enrolled ? (
            <Link to={`/aprender/${course.id}`} className="secondary">
              Ver curso
            </Link>
          ) : requestStatus === "pendiente" ? (
            <button type="button" disabled title="Tu solicitud está en revisión">
              Solicitud pendiente
            </button>
          ) : requestStatus === "aprobado" ? (
            <Link to={`/aprender/${course.id}`} className="secondary">
              Ver curso
            </Link>
          ) : (
            <Link
              to={`/inscripcion/${course.id}`}
              state={{ prefill }}
            >
              Solicitar acceso
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function CatalogPage() {
  const { categoria, grado } = useParams<{ categoria?: string; grado?: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { courses, loading, error } = usePublishedCourses(isAdmin);
  const { enrolledCourseIds } = useEnrollments();
  const { statusByCourse } = useMyRequests();

  const category = parseCategoryParam(categoria);
  const gradeNum = grado ? parseInt(grado, 10) : null;
  const validGrade = gradeNum && gradeNum >= 1 && gradeNum <= 6 ? gradeNum : null;

  const filtered = courses.filter((c) => {
    if (category && c.grade_category !== category) return false;
    if (validGrade && c.grade_number !== validGrade) return false;
    return true;
  });

  const catDef = CATEGORIES.find((c) => c.key === category);

  function handleCategoryFilter(key: string) {
    navigate(key ? `/catalogo/${key}` : "/catalogo");
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Migas de pan">
        <Link to="/catalogo">Cursos</Link>
        {catDef && (
          <>
            <span aria-hidden> / </span>
            {validGrade ? (
              <Link to={`/catalogo/${catDef.key}`}>{catDef.short}</Link>
            ) : (
              <span>{catDef.short}</span>
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
          <h1>{isAdmin ? "Todos los cursos" : "Cursos disponibles"}</h1>
          {category && (
            <p className="course-meta">
              {filtered.length} curso{filtered.length === 1 ? "" : "s"}
              {isAdmin ? "" : " publicado" + (filtered.length === 1 ? "" : "s")}
              {` en ${validGrade ? gradeLabel(catDef!.key, validGrade) : catDef!.short}`}
            </p>
          )}
        </div>
      </div>

      <div className="filters-row">
        <label>
          Categoría
          <select value={category ?? ""} onChange={(e) => handleCategoryFilter(e.target.value)}>
            <option value="">Selecciona una categoría…</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.short}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Cargando cursos…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && !category && (
        <p>Selecciona una categoría para ver los cursos.</p>
      )}

      {!loading && !error && category && (
        <div className="course-list">
          {filtered.map((course) => (
            <CatalogCard
              key={course.id}
              course={course}
              enrolled={enrolledCourseIds.has(course.id)}
              requestStatus={statusByCourse.get(course.id)}
              studentName={profile?.full_name ?? ""}
              studentEmail={user?.email ?? ""}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {!loading && !error && category && filtered.length === 0 && (
        <p>Todavía no hay cursos{isAdmin ? "" : " publicados"} en esta categoría.</p>
      )}
    </>
  );
}
