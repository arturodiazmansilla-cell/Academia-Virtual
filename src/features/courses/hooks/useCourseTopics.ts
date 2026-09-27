import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type { CourseTopic } from "../../../shared/types/database.types";

export function useCourseTopics(courseId: string | undefined) {
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("course_topics")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setTopics(data ?? []);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addTopic(input: { title: string; description: string }) {
    if (!courseId) return { error: "Curso no encontrado." };
    const nextOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.order_index)) + 1 : 0;

    const { error } = await supabase.from("course_topics").insert({
      course_id: courseId,
      title: input.title,
      description: input.description || null,
      order_index: nextOrder,
    });

    if (error) return { error: error.message };
    await reload();
    return { error: null };
  }

  async function updateTopic(topicId: string, patch: { title: string; description: string }) {
    const { error } = await supabase
      .from("course_topics")
      .update({ title: patch.title, description: patch.description || null })
      .eq("id", topicId);

    if (error) return { error: error.message };
    await reload();
    return { error: null };
  }

  async function deleteTopic(topicId: string) {
    const { error } = await supabase.from("course_topics").delete().eq("id", topicId);
    if (error) return { error: error.message };
    await reload();
    return { error: null };
  }

  async function moveTopic(topicId: string, direction: "up" | "down") {
    const index = topics.findIndex((t) => t.id === topicId);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= topics.length) return;

    const a = topics[index];
    const b = topics[swapIndex];

    // Intercambia order_index entre los dos temas
    const { error: e1 } = await supabase
      .from("course_topics")
      .update({ order_index: b.order_index })
      .eq("id", a.id);
    const { error: e2 } = await supabase
      .from("course_topics")
      .update({ order_index: a.order_index })
      .eq("id", b.id);

    if (e1 || e2) return { error: (e1 ?? e2)?.message };
    await reload();
    return { error: null };
  }

  return { topics, loading, error, reload, addTopic, updateTopic, deleteTopic, moveTopic };
}
