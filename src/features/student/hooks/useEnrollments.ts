// src/features/student/hooks/useEnrollments.ts
//
// Inscripciones del alumno actual: listar, inscribirse y cancelar
// la inscripción. Mismo patrón que el resto de hooks del proyecto:
// reload() y funciones que devuelven { error: string | null }.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { CourseEnrollment } from "../../../shared/types/database.types";
import { useAuth } from "../../auth/hooks/useAuth";

export function useEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => e.course_id)),
    [enrollments]
  );

  const reload = useCallback(async () => {
    if (!user) {
      setEnrollments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("course_enrollments")
      .select("*")
      .eq("student_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setEnrollments(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function enroll(courseId: string) {
    if (!user) return { error: "No hay sesión activa." };
    const { error } = await supabase.from("course_enrollments").insert({
      course_id: courseId,
      student_id: user.id,
    });
    if (error) {
      // Violación de unique (course_id, student_id): ya estaba inscrito
      if (error.code === "23505") return { error: "Ya estás inscrito en este curso." };
      return { error: error.message };
    }
    await reload();
    return { error: null };
  }

  async function unenroll(courseId: string) {
    if (!user) return { error: "No hay sesión activa." };
    const { error } = await supabase
      .from("course_enrollments")
      .delete()
      .eq("course_id", courseId)
      .eq("student_id", user.id);
    if (error) return { error: error.message };
    await reload();
    return { error: null };
  }

  return { enrollments, enrolledCourseIds, loading, error, reload, enroll, unenroll };
}
