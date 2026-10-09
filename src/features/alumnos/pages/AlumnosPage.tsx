// src/features/alumnos/pages/AlumnosPage.tsx
//
// Administración de alumnos inscritos: ver, filtrar por nombre/curso,
// desactivar/reactivar y desinscribir alumnos de un curso.
// El acceso a los cursos lo otorga solo el administrador/instructor.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";

interface EnrollmentRow {
  id: string;
  is_active: boolean;
  enrolled_at: string;
  course_id: string;
  student_id: string;
  course: { title: string } | null;
  student: { full_name: string } | null;
}

export function AlumnosPage() {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("todas");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_enrollments")
      .select(
        "id, is_active, enrolled_at, course_id, student_id, course:courses(title), student:profiles(full_name)"
      )
      .order("enrolled_at", { ascending: false });
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as unknown as EnrollmentRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.course && !map.has(r.course_id)) map.set(r.course_id, r.course.title);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (courseFilter !== "todas" && r.course_id !== courseFilter) return false;
      if (!q) return true;
      const name = r.student?.full_name?.toLowerCase() ?? "";
      return name.includes(q);
    });
  }, [rows, search, courseFilter]);

  const activeCount = rows.filter((r) => r.is_active).length;

  async function handleToggleActive(r: EnrollmentRow) {
    const name = r.student?.full_name ?? "el alumno";
    const ok = window.confirm(
      r.is_active
        ? `¿Desactivar a ${name} en "${r.course?.title ?? ""}"?\n\nNo podrá ver los temas ni contenidos del curso hasta reactivarlo.`
        : `¿Reactivar a ${name} en "${r.course?.title ?? ""}"?\n\nVolverá a tener acceso al curso.`
    );
    if (!ok) return;
    setBusyId(r.id);
    setActionError(null);
    const { error } = await supabase
      .from("course_enrollments")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    setBusyId(null);
    if (error) {
      setActionError(`No se pudo actualizar: ${error.message}`);
      return;
    }
    await reload();
  }

  async function handleUnenroll(r: EnrollmentRow) {
    const name = r.student?.full_name ?? "el alumno";
    const ok = window.confirm(
      `¿Desinscribir a ${name} de "${r.course?.title ?? ""}"?\n\nPerderá el acceso al curso. Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setBusyId(r.id);
    setActionError(null);
    const { error } = await supabase.from("course_enrollments").delete().eq("id", r.id);
    setBusyId(null);
    if (error) {
      setActionError(`No se pudo desinscribir: ${error.message}`);
      return;
    }
    await reload();
  }

  return (
    <>
      <span className="eyebrow">Gestión</span>
      <div className="page-header">
        <div>
          <h1>Alumnos inscritos</h1>
          <p className="course-meta">
            {rows.length} inscripción{rows.length === 1 ? "" : "es"} · {activeCount} activa
            {activeCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="filters-row">
        <label>
          Buscar por nombre
          <input
            type="search"
            placeholder="Ej. María Pérez"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Curso
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="todas">Todos los cursos</option>
            {courses.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Cargando alumnos…</p>}
      {error && <p role="alert">{error}</p>}
      {actionError && <p role="alert">{actionError}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p>No hay alumnos que coincidan con el filtro.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Curso</th>
              <th>Estado</th>
              <th>Inscrito</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={r.is_active ? "" : "row-inactive"}>
                <td>{r.student?.full_name ?? "—"}</td>
                <td>{r.course?.title ?? "—"}</td>
                <td>
                  <span className={`status-pill ${r.is_active ? "active" : "inactive"}`}>
                    {r.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>{new Date(r.enrolled_at).toLocaleDateString("es-BO")}</td>
                <td>
                  <div className="topic-actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={busyId === r.id}
                      onClick={() => handleToggleActive(r)}
                    >
                      {busyId === r.id ? "…" : r.is_active ? "Desactivar" : "Reactivar"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={busyId === r.id}
                      onClick={() => handleUnenroll(r)}
                    >
                      Desinscribir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
