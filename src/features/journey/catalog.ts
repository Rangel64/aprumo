import { createClient } from "@/lib/supabase/server";
import type { Catalog } from "./journey-model";

/**
 * Catálogo para o formulário de Jornada (somente leitura, client do aluno): Trilhas e conteúdos
 * em ordem. Serve para resolver slug -> id na página, no servidor.
 */
export async function getJourneyCatalog(): Promise<Catalog> {
  const supabase = await createClient();
  const [trailsRes, contentsRes] = await Promise.all([
    supabase.from("trails").select("id, slug, name, objective").order("name"),
    supabase.from("contents").select("id, slug, title, sort").order("sort"),
  ]);
  if (trailsRes.error || contentsRes.error) throw new Error("Falha ao carregar o catálogo.");
  return {
    trails: (trailsRes.data ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      objective: t.objective,
    })),
    contents: (contentsRes.data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
    })),
  };
}
