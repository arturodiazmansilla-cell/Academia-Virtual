import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { Course, GradeCategory } from "../../../shared/types/database.types";
import { useAuth } from "../../auth/hooks/useAuth";

export function useCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setCourses(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  async function createCourse(input: {
    title: string;
    description: string;
    subject: string;
    level: string;
    gradeCategory: GradeCategory | null;
    gradeNumber: number | null;
  }) {
    if (!user) return { error: "No hay sesión activa." };

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: input.title,
        description: input.description || null,
        subject: input.subject,
        level: input.level || null,
        grade_category: input.gradeCategory,
        grade_number: input.gradeNumber,
        instructor_id: user.id,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    await reload();
    return { error: null, course: data };
  }

  return { courses, loading, error, reload, createCourse };
}
