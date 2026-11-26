"use server";

import {
  AddContentsToJourneyInputSchema,
  createJourneyInputAfter,
  type AddContentsToJourneyResult,
  type CreateJourneyResult,
} from "@/contracts/actions";
import { fail, ok, type ActionResult } from "@/contracts/errors";
import { brasiliaDateString } from "@/domain/flashcard-scheduler";
import { createClient } from "@/lib/supabase/server";

const MSG = {
  validation: "Confira os dados da Jornada e tente de novo.",
  unauthenticated: "Entre na sua conta para continuar.",
  trailNotFound: "Trilha não encontrada.",
  trailEmpty: "Esta Trilha não tem conteúdos.",
  contentNotFound: "Algum conteúdo escolhido não foi encontrado.",
  noActive: "Você não tem uma Jornada ativa. Crie uma para adicionar conteúdos.",
  internal: "Não foi possível salvar sua Jornada agora.",
} as const;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Remove repetidos preservando a ordem da primeira ocorrência. */
function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

/** Confere que todos os ids existem em `contents` (catálogo legível a autenticados). */
async function allContentsExist(supabase: Supabase, ids: string[]): Promise<boolean | null> {
  const { data, error } = await supabase.from("contents").select("id").in("id", ids);
  if (error) return null;
  const found = new Set((data ?? []).map((r) => r.id));
  return ids.every((id) => found.has(id));
}

/**
 * Cria a Jornada do aluno (RN-002: meta e prazo obrigatórios). Cliente do aluno (RLS):
 * `user_id` vem da sessão, nunca da entrada. Não há limite de Jornadas nem constraint de
 * unicidade de ativa no schema; cada criação gera uma nova Jornada `active`.
 * NUNCA escreve em `content_progress`.
 */
export async function createJourney(input: unknown): Promise<ActionResult<CreateJourneyResult>> {
  const today = brasiliaDateString(new Date());
  const parsed = createJourneyInputAfter(today).safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.length ? issue.path.join(".") : undefined;
    // Só meta e prazo têm mensagem pt-BR própria; o resto (ex.: uuid) usa a genérica.
    const specific = field === "deadline" || field === "goalDescription";
    return fail("VALIDATION", specific && issue ? issue.message : MSG.validation, field);
  }
  const { base, goalDescription, deadline, methodology } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    let trailId: string | null = null;
    let contentIds: string[];
    if (base.type === "trail") {
      const { data: trail, error: trailError } = await supabase
        .from("trails")
        .select("id")
        .eq("id", base.trailId)
        .maybeSingle();
      if (trailError) return fail("INTERNAL", MSG.internal);
      if (!trail) return fail("NOT_FOUND", MSG.trailNotFound, "base");
      const { data: links, error: linksError } = await supabase
        .from("trail_contents")
        .select("content_id, position")
        .eq("trail_id", base.trailId)
        .order("position");
      if (linksError) return fail("INTERNAL", MSG.internal);
      contentIds = unique((links ?? []).map((l) => l.content_id));
      if (contentIds.length === 0) return fail("NOT_FOUND", MSG.trailEmpty, "base");
      trailId = trail.id;
    } else {
      contentIds = unique(base.contentIds);
      const exist = await allContentsExist(supabase, contentIds);
      if (exist === null) return fail("INTERNAL", MSG.internal);
      if (!exist) return fail("NOT_FOUND", MSG.contentNotFound, "base");
    }

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .insert({
        user_id: user.id,
        base_type: base.type,
        trail_id: trailId,
        goal_description: goalDescription,
        deadline,
        methodology,
        status: "active",
      })
      .select("id")
      .single();
    if (journeyError || !journey) return fail("INTERNAL", MSG.internal);

    const { error: linkError } = await supabase.from("journey_contents").insert(
      contentIds.map((contentId, position) => ({
        journey_id: journey.id,
        content_id: contentId,
        position,
        added_from: "base" as const,
      })),
    );
    if (linkError) {
      // Sem transação no client: desfaz a Jornada órfã (a RLS permite apagar a própria).
      const { error: rollbackError } = await supabase.from("journeys").delete().eq("id", journey.id);
      // Mensagem genérica: sem user_id, e-mail ou ids de conteúdo.
      if (rollbackError) console.error("createJourney: falha ao desfazer Jornada órfã.");
      return fail("INTERNAL", MSG.internal);
    }

    return ok({ journeyId: journey.id });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}

/**
 * Acrescenta conteúdos à Jornada ativa (a mais recente, se houver mais de uma), na posição
 * seguinte, ignorando os que já estão nela. Sem Jornada ativa: NO_ACTIVE_JOURNEY (a UI leva
 * a `/jornada/nova`). NUNCA escreve em `content_progress`.
 */
export async function addContentsToJourney(
  input: unknown,
): Promise<ActionResult<AddContentsToJourneyResult>> {
  const parsed = AddContentsToJourneyInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", MSG.validation, "contentIds");
  const { source } = parsed.data;
  const contentIds = unique(parsed.data.contentIds);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (journeyError) return fail("INTERNAL", MSG.internal);
    if (!journey) return fail("NO_ACTIVE_JOURNEY", MSG.noActive);

    const exist = await allContentsExist(supabase, contentIds);
    if (exist === null) return fail("INTERNAL", MSG.internal);
    if (!exist) return fail("NOT_FOUND", MSG.contentNotFound, "contentIds");

    const { data: current, error: currentError } = await supabase
      .from("journey_contents")
      .select("content_id, position")
      .eq("journey_id", journey.id);
    if (currentError) return fail("INTERNAL", MSG.internal);

    const already = new Set((current ?? []).map((r) => r.content_id));
    const nextPosition = (current ?? []).reduce((max, r) => Math.max(max, r.position + 1), 0);
    const toAdd = contentIds.filter((id) => !already.has(id));

    if (toAdd.length > 0) {
      const { error: insertError } = await supabase.from("journey_contents").insert(
        toAdd.map((contentId, i) => ({
          journey_id: journey.id,
          content_id: contentId,
          position: nextPosition + i,
          added_from: source,
        })),
      );
      if (insertError) return fail("INTERNAL", MSG.internal);
    }

    return ok({ journeyId: journey.id, added: toAdd.length });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}
