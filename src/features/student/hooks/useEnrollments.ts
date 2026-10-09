// src/features/student/hooks/useEnrollments.ts
//
// Inscripciones ACTIVAS del alumno actual.
// El acceso lo otorga solo el administrador (no hay auto-inscripción);
// aquí el alumno solo puede ver y cancelar sus inscripciones.

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
      .eq("is_active", true)
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

  return { enrollments, enrolledCourseIds, loading, error, reload, unenroll };
}
