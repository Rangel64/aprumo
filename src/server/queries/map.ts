import type { ContentStatus, MapEdge, MapView } from "@/contracts/views";
import { CompetencyIdSchema } from "@/contracts/views";
import { brasiliaDayRange } from "@/features/map/reviewed-today";
import type { MapTrail } from "@/features/map/map-model";
import { createClient } from "@/lib/supabase/server";

const LOAD_ERROR = "Falha ao carregar o Mapa.";

/**
 * Mapa do aluno. Só leitura, com o client com sessão (RLS): o catálogo é legível a
 * autenticados e `content_progress`/`flashcard_states` só devolvem as linhas do próprio usuário.
 * Nunca escreve em `content_progress` (domínio é conquistado, não declarado).
 *
 * `reviewedToday`: algum flashcard do conteúdo com `reviewed_at` no dia de Brasília (UTC-3).
 * `now` é injetável para teste.
 */
export async function getMapView(userId: string, now: Date = new Date()): Promise<MapView> {
  const supabase = await createClient();
  const { start, end } = brasiliaDayRange(now);

  const [contentsRes, edgesRes, progressRes, trailsRes, compRes, reviewedRes] = await Promise.all([
    supabase.from("contents").select("id, slug, title, pos_x, pos_y, sort").order("sort"),
    supabase.from("content_edges").select("from_id, to_id, kind"),
    supabase.from("content_progress").select("content_id, status").eq("user_id", userId),
    supabase.from("trail_contents").select("trail_id, content_id"),
    supabase.from("competency_contents").select("competency, content_id"),
    supabase
      .from("flashcard_states")
      .select("flashcards(content_id)")
      .eq("user_id", userId)
      .gte("reviewed_at", start.toISOString())
      .lt("reviewed_at", end.toISOString()),
  ]);
  if (
    contentsRes.error ||
    edgesRes.error ||
    progressRes.error ||
    trailsRes.error ||
    compRes.error ||
    reviewedRes.error
  ) {
    throw new Error(LOAD_ERROR);
  }

  const status = new Map<string, ContentStatus>();
  for (const p of progressRes.data ?? []) {
    if (p.status === "mastered" || p.status === "studying") status.set(p.content_id, p.status);
  }

  const reviewed = new Set<string>();
  for (const r of reviewedRes.data ?? []) {
    const card = Array.isArray(r.flashcards) ? r.flashcards[0] : r.flashcards;
    if (card) reviewed.add(card.content_id);
  }

  const trailIds = new Map<string, string[]>();
  for (const t of trailsRes.data ?? []) {
    trailIds.set(t.content_id, [...(trailIds.get(t.content_id) ?? []), t.trail_id]);
  }

  const competencies = new Map<string, number[]>();
  for (const c of compRes.data ?? []) {
    const parsed = CompetencyIdSchema.safeParse(c.competency);
    if (!parsed.success) continue;
    competencies.set(c.content_id, [...(competencies.get(c.content_id) ?? []), parsed.data]);
  }

  const edges: MapEdge[] = [];
  for (const e of edgesRes.data ?? []) {
    if (e.kind === "prerequisite" || e.kind === "related") {
      edges.push({ from: e.from_id, to: e.to_id, kind: e.kind });
    }
  }

  return {
    nodes: (contentsRes.data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      status: status.get(c.id) ?? "not_started",
      reviewedToday: reviewed.has(c.id),
      position: { x: c.pos_x, y: c.pos_y },
      trailIds: trailIds.get(c.id) ?? [],
      competencies: (competencies.get(c.id) ?? []).sort((a, b) => a - b),
    })),
    edges,
  };
}

/** Trilhas da plataforma com a quantidade de conteúdos (cartão do Mapa e legenda do drawer). */
export async function getMapTrails(): Promise<MapTrail[]> {
  const supabase = await createClient();
  const [trailsRes, linksRes] = await Promise.all([
    supabase.from("trails").select("id, slug, name").order("name"),
    supabase.from("trail_contents").select("trail_id"),
  ]);
  if (trailsRes.error || linksRes.error) throw new Error(LOAD_ERROR);

  const counts = new Map<string, number>();
  for (const l of linksRes.data ?? []) counts.set(l.trail_id, (counts.get(l.trail_id) ?? 0) + 1);
  return (trailsRes.data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    contentCount: counts.get(t.id) ?? 0,
  }));
}
