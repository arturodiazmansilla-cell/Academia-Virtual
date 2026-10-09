// src/features/enrollment/pages/EnrollmentPage.tsx
//
// Página PÚBLICA (sin sesión): el alumno llega desde el link o el QR del
// curso, deja sus datos y su solicitud queda "pendiente" hasta que el
// instructor/admin la apruebe.

import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { Course } from "../../../shared/types/database.types";

export function EnrollmentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  // Si viene desde el catálogo con sesión iniciada, prellena nombre y correo
  const prefill = (location.state as { prefill?: { firstName?: string; lastName?: string; email?: string } } | null)?.prefill;
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [firstName, setFirstName] = useState(prefill?.firstName ?? "");
  const [lastName, setLastName] = useState(prefill?.lastName ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function load() {
      if (!courseId) {
        setLoadingCourse(false);
        return;
      }
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq("status", "publicado")
        .single();
      setCourse(data);
      setLoadingCourse(false);
    }
    load();
  }, [courseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setSubmitting(true);
    setFormError(null);

    const { error } = await supabase.from("enrollment_requests").insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      course_id: courseId,
    });

    if (error) {
      setSubmitting(false);
      if (error.code === "23505") {
        setFormError("Ya enviaste una solicitud para este curso con ese correo.");
      } else {
        setFormError("No se pudo enviar tu solicitud. Intenta de nuevo.");
      }
      return;
    }

    // Avisa al administrador (correo + recordatorio). La función ubica la
    // solicitud por curso+correo. Si falla, la solicitud igual quedó
    // guardada; no se bloquea al alumno.
    try {
      await supabase.functions.invoke("notificar-solicitud", {
        body: { course_id: courseId, email: email.trim().toLowerCase() },
      });
    } catch {
      // silencioso: best-effort
    }

    setSubmitting(false);
    setSent(true);
  }

  if (loadingCourse) {
    return (
      <div className="auth-screen">
        <p>Cargando…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>Curso no disponible</h1>
          <p>El enlace no es válido o el curso ya no está publicado.</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>¡Solicitud enviada!</h1>
          <p>
            Gracias, {firstName}. Tu solicitud para el curso{" "}
            <strong>{course.title}</strong> quedó registrada.
          </p>
          <p>
            Cuando el instructor la apruebe, recibirás un correo a{" "}
            <strong>{email}</strong> (y un WhatsApp si diste tu número) con tu{" "}
            <strong>enlace de acceso directo</strong>: tu cuenta se crea
            automáticamente, no necesitas registrarte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="eyebrow">Academia Virtual</span>
        <h1>Solicitar acceso</h1>
        <p className="course-meta">
          {course.title}
          {course.subject ? ` · ${course.subject}` : ""}
        </p>
        {course.description && <p>{course.description}</p>}

        <form onSubmit={handleSubmit} className="course-form">
          <label>
            Nombre
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </label>
          <label>
            Apellido
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
            />
          </label>
          <label>
            Celular (con código de país)
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="p. ej. 59171234567"
            />
          </label>
          {formError && <p role="alert">{formError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      </div>
    </div>
  );
}
