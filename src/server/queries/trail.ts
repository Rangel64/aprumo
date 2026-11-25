import { notFound } from "next/navigation";
import type { TrailView } from "@/contracts/views";
import { createClient } from "@/lib/supabase/server";

/**
 * Trilha da plataforma por slug (somente leitura, client com sessão). Inexistente: notFound().
 * Não há criação de Trilha pelo aluno.
 */
export async function getTrail(slug: string): Promise<TrailView> {
  const supabase = await createClient();

  const { data: trail, error } = await supabase
    .from("trails")
    .select("id, slug, name, objective")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Falha ao carregar a Trilha.");
  if (!trail) notFound();

  const { data: links, error: linksError } = await supabase
    .from("trail_contents")
    .select("position, contents(id, slug, title)")
    .eq("trail_id", trail.id)
    .order("position");
  if (linksError) throw new Error("Falha ao carregar a Trilha.");

  const contents: TrailView["contents"] = [];
  for (const l of links ?? []) {
    const c = Array.isArray(l.contents) ? l.contents[0] : l.contents;
    if (c) contents.push({ id: c.id, slug: c.slug, title: c.title });
  }

  return {
    id: trail.id,
    slug: trail.slug,
    name: trail.name,
    objective: trail.objective,
    origin: "platform",
    contents,
  };
}
