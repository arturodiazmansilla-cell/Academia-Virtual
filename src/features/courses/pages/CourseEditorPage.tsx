import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useCourse } from "../hooks/useCourse";
import { useCourseTopics } from "../hooks/useCourseTopics";
import { TopicList } from "../components/TopicList";
import { ColegioSection } from "../../colegio/components/ColegioSection";
import type { Course, GradeCategory } from "../../../shared/types/database.types";
import { gradeLabel as buildGradeLabel } from "../../../shared/utils/categories";

function PublishSection({
  course,
  onPublish,
  onUnpublish,
  busy,
}: {
  course: Course;
  onPublish: () => void;
  onUnpublish: () => void;
  busy: boolean;
}) {
  const [copied, setCopied] = useState(false);
  // Base del link: VITE_PUBLIC_URL si está definida (p. ej. la URL de Netlify),
  // si no, el origen actual. Así el QR siempre apunta a la versión pública.
  const baseUrl =
    (import.meta.env.VITE_PUBLIC_URL as string | undefined)?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const enrollmentUrl = baseUrl ? `${baseUrl}/inscripcion/${course.id}` : "";
  const isLocalhost =
    enrollmentUrl.includes("localhost") || enrollmentUrl.includes("127.0.0.1");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(enrollmentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (course.status !== "publicado") {
    return (
      <div className="topic-actions" style={{ marginBottom: "1rem" }}>
        <button type="button" onClick={onPublish} disabled={busy}>
          {busy ? "Publicando…" : "Publicar curso"}
        </button>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2>Inscripción de alumnos</h2>
      <p className="course-meta">
        Comparte este link o el QR: el alumno deja sus datos y tú lo habilitas
        desde <Link to="/solicitudes">Solicitudes</Link>.
      </p>
      <div className="topic-actions" style={{ marginBottom: "0.75rem" }}>
        <input
          value={enrollmentUrl}
          readOnly
          onFocus={(e) => e.target.select()}
          style={{ flex: 1, minWidth: "16rem" }}
        />
        <button type="button" className="secondary" onClick={copyLink}>
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
      </div>
      <QRCodeSVG value={enrollmentUrl} size={180} />
      {isLocalhost && (
        <p role="alert" style={{ marginTop: "0.75rem" }}>
          Este link solo funciona en tu computadora (localhost). Para compartirlo
          con alumnos, despliega la app y copia el link desde la versión publicada,
          o define VITE_PUBLIC_URL con tu URL de Netlify.
        </p>
      )}
      <div className="topic-actions" style={{ marginTop: "0.75rem" }}>
        <button type="button" className="secondary" onClick={onUnpublish} disabled={busy}>
          {busy ? "Actualizando…" : "Volver a borrador"}
        </button>
      </div>
    </section>
  );
}

export function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { course, loading, error, updateCourse, updateStatus } = useCourse(courseId);
  const { topics, addTopic, updateTopic, deleteTopic, moveTopic } = useCourseTopics(courseId);

  const [editingInfo, setEditingInfo] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [gradeCategory, setGradeCategory] = useState<"" | GradeCategory>("");
  const [gradeNumber, setGradeNumber] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEditInfo() {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description ?? "");
    setSubject(course.subject);
    setLevel(course.level ?? "");
    setGradeCategory(course.grade_category ?? "");
    setGradeNumber(course.grade_number ? String(course.grade_number) : "");
    setEditingInfo(true);
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    const isGradeCat = gradeCategory === "primaria" || gradeCategory === "secundaria";
    const { error } = await updateCourse({
      title,
      description,
      subject,
      level,
      grade_category: gradeCategory || null,
      grade_number: isGradeCat && gradeNumber ? parseInt(gradeNumber, 10) : null,
    });
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

  async function handlePublish() {
    if (!course) return;
    const ok = window.confirm(
      `¿Publicar "${course.title}"?\n\nAparecerá en la sección Cursos y se generará su link/QR de inscripción para alumnos.`
    );
    if (!ok) return;
    setPublishing(true);
    setPublishError(null);
    const { error } = await updateStatus("publicado");
    setPublishing(false);
    if (error) setPublishError(error);
  }

  async function handleUnpublish() {
    if (!course) return;
    const ok = window.confirm(
      `¿Volver "${course.title}" a borrador?\n\nDejará de aparecer en la sección Cursos y el link/QR de inscripción dejará de funcionar.`
    );
    if (!ok) return;
    setPublishing(true);
    setPublishError(null);
    const { error } = await updateStatus("borrador");
    setPublishing(false);
    if (error) setPublishError(error);
  }

  return (
    <>
      <Link to="/cursos" className="eyebrow">← Mis cursos</Link>

      {publishError && <p role="alert">{publishError}</p>}

      <PublishSection
        course={course}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        busy={publishing}
      />

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
              <option value="tecnico">Curso técnico</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </label>
          <label>
            Grado
            <select
              value={gradeNumber}
              onChange={(e) => setGradeNumber(e.target.value)}
              required={gradeCategory === "primaria" || gradeCategory === "secundaria"}
              disabled={gradeCategory !== "primaria" && gradeCategory !== "secundaria"}
            >
              <option value="">Seleccionar…</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}°
                </option>
              ))}
            </select>
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
              {course.grade_category
                ? `${buildGradeLabel(course.grade_category, course.grade_number)} · `
                : ""}
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

      {courseId && <ColegioSection courseId={courseId} />}
    </>
  );
}
