import type { ContentStatus, JourneyView } from "@/contracts/views";
import { createClient } from "@/lib/supabase/server";

const LOAD_ERROR = "Falha ao carregar a Jornada.";

/**
 * Jornada ativa do aluno (a mais recente, se houver mais de uma) ou null. Só leitura, com o
 * client com sessão (RLS). O estado de cada conteúdo vem de `content_progress` (ausente =
 * not_started); `nextContentSlug` é o primeiro conteúdo, por posição, ainda não dominado.
 * Nunca escreve em `content_progress`.
 */
export async function getActiveJourney(userId: string): Promise<JourneyView | null> {
  const supabase = await createClient();

  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select("id, goal_description, deadline")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (journeyError) throw new Error(LOAD_ERROR);
  if (!journey) return null;

  const [linksRes, progressRes] = await Promise.all([
    supabase
      .from("journey_contents")
      .select("position, contents(id, slug, title)")
      .eq("journey_id", journey.id)
      .order("position"),
    supabase.from("content_progress").select("content_id, status").eq("user_id", userId),
  ]);
  if (linksRes.error || progressRes.error) throw new Error(LOAD_ERROR);

  const status = new Map<string, ContentStatus>();
  for (const p of progressRes.data ?? []) {
    if (p.status === "mastered" || p.status === "studying") status.set(p.content_id, p.status);
  }

  const contents: JourneyView["contents"] = [];
  for (const row of linksRes.data ?? []) {
    const c = Array.isArray(row.contents) ? row.contents[0] : row.contents;
    if (!c) continue;
    contents.push({
      id: c.id,
      slug: c.slug,
      title: c.title,
      status: status.get(c.id) ?? "not_started",
      position: row.position,
    });
  }
  contents.sort((a, b) => a.position - b.position);

  return {
    id: journey.id,
    goalDescription: journey.goal_description,
    deadline: journey.deadline,
    contents,
    nextContentSlug: contents.find((c) => c.status !== "mastered")?.slug ?? null,
    masteredCount: contents.filter((c) => c.status === "mastered").length,
    total: contents.length,
  };
}
