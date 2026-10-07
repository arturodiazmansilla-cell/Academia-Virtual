import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { Course, CourseStatus } from "../../../shared/types/database.types";

export function useCourse(courseId: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setCourse(data);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function updateCourse(patch: Partial<Pick<Course, "title" | "description" | "subject" | "level" | "grade_category" | "grade_number">>) {
    if (!courseId) return { error: "Curso no encontrado." };
    const { error } = await supabase
      .from("courses")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", courseId);

    if (error) return { error: error.message };
    await reload();
    return { error: null };
  }

  async function updateStatus(status: CourseStatus) {
    if (!courseId) return { error: "Curso no encontrado." };
    const { error } = await supabase
      .from("courses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", courseId);

    if (error) return { error: error.message };
    await reload();
    return { error: null };
  }

  return { course, loading, error, reload, updateCourse, updateStatus };
}
