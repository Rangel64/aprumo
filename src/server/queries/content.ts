import { notFound } from "next/navigation";
import type { ContentView } from "@/contracts/views";
import { QuickQuestionSchema } from "@/contracts/views";
import { createClient } from "@/lib/supabase/server";
import { safeHttpUrl } from "@/features/study/safe-url";

/** `ContentView` do contrato mais o que a página precisa para o cabeçalho (adição local, sem mexer no contrato). */
export type StudyContentView = ContentView & {
  summary: string;
  trail: { slug: string; name: string } | null;
  prerequisites: { slug: string; title: string }[];
};

/**
 * Conteúdo para estudo. Usa o client com sessão (RLS): leitura de conteúdo é liberada a
 * autenticados e `content_progress` só devolve a linha do próprio usuário.
 * Inexistente: notFound().
 */
export async function getContentView(slug: string, userId: string): Promise<StudyContentView> {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from("contents")
    .select("id, slug, title, summary")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Falha ao carregar o conteúdo.");
  if (!content) notFound();

  const [sectionsRes, progressRes, edgesRes, trailRes] = await Promise.all([
    supabase
      .from("content_sections")
      .select("id, kind, title, body_md, quick_question, source_citation, source_url, position")
      .eq("content_id", content.id)
      .order("position"),
    supabase
      .from("content_progress")
      .select("status")
      .eq("content_id", content.id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("content_edges")
      .select("from_id")
      .eq("to_id", content.id)
      .eq("kind", "prerequisite"),
    supabase
      .from("trail_contents")
      .select("position, trails(slug, name)")
      .eq("content_id", content.id)
      .order("position")
      .limit(1)
      .maybeSingle(),
  ]);
  if (sectionsRes.error || progressRes.error || edgesRes.error || trailRes.error) {
    throw new Error("Falha ao carregar o conteúdo.");
  }

  const prereqIds = (edgesRes.data ?? []).map((e) => e.from_id);
  let prerequisites: StudyContentView["prerequisites"] = [];
  if (prereqIds.length > 0) {
    const { data, error: prereqError } = await supabase
      .from("contents")
      .select("slug, title, sort")
      .in("id", prereqIds)
      .order("sort");
    if (prereqError) throw new Error("Falha ao carregar o conteúdo.");
    prerequisites = (data ?? []).map((c) => ({ slug: c.slug, title: c.title }));
  }

  const sections: ContentView["sections"] = (sectionsRes.data ?? []).map((s) => {
    const quick = QuickQuestionSchema.safeParse(s.quick_question);
    // Só http(s) vira link; qualquer outro esquema é descartado e a citação aparece sem link.
    const sourceUrl = safeHttpUrl(s.source_url);
    return {
      id: s.id,
      kind: s.kind as ContentView["sections"][number]["kind"],
      title: s.title,
      bodyMd: s.body_md,
      ...(quick.success ? { quickQuestion: quick.data } : {}),
      sourceCitation: s.source_citation,
      ...(sourceUrl ? { sourceUrl } : {}),
    };
  });

  const status = progressRes.data?.status === "mastered"
    ? "mastered"
    : progressRes.data?.status === "studying"
      ? "studying"
      : "not_started";

  const trailRow = trailRes.data?.trails;
  const trail = Array.isArray(trailRow) ? trailRow[0] : trailRow;

  return {
    id: content.id,
    slug: content.slug,
    title: content.title,
    summary: content.summary,
    sections,
    status,
    trail: trail ? { slug: trail.slug, name: trail.name } : null,
    prerequisites,
  };
}
