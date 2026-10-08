import { Link } from "react-router-dom";
import type { Course } from "../../../shared/types/database.types";
import { gradeLabel as buildGradeLabel } from "../../../shared/utils/categories";

const statusLabel: Record<Course["status"], string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
  rechazado: "Rechazado",
};

export function CourseCard({ course }: { course: Course }) {
  const gradeLabel = course.grade_category
    ? `${buildGradeLabel(course.grade_category, course.grade_number)} · `
    : "";

  return (
    <Link to={`/cursos/${course.id}`} className="course-row">
      <span className={`status-bar ${course.status}`} />
      <div className="course-row-info">
        <h3>{course.title}</h3>
        <p className="course-meta">
          {gradeLabel}
          {course.subject}
          {course.level ? ` · ${course.level}` : ""}
        </p>
      </div>
      <span className="status-label">{statusLabel[course.status]}</span>
    </Link>
  );
}
