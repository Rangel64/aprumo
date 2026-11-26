"use server";

import { randomUUID } from "node:crypto";

import {
  GenerateScheduleInputSchema,
  SaveAvailabilityInputSchema,
  type GenerateScheduleResult,
  type SaveAvailabilityResult,
} from "@/contracts/actions";
import { fail, ok, type ActionResult } from "@/contracts/errors";
import { buildSchedule } from "@/domain/schedule";
import { createClient } from "@/lib/supabase/server";


const MSG = {
  validation: "Confira os horários de disponibilidade e tente de novo.",
  duplicate: "Há horários repetidos (mesmo dia e hora).",
  unauthenticated: "Entre na sua conta para continuar.",
  journeyNotFound: "Jornada não encontrada.",
  noActive: "Você não tem uma Jornada ativa. Crie uma para gerar o cronograma.",
  noAvailability: "Informe sua disponibilidade para gerar o cronograma.",
  saveInternal: "Não foi possível salvar sua disponibilidade agora.",
  generateInternal: "Não foi possível gerar o cronograma agora.",
} as const;

/**
 * Substitui a disponibilidade do aluno. Cliente do aluno (RLS), `user_id` da sessão.
 * Sem transação no client: insere os novos horários primeiro e só depois apaga os antigos (pelos
 * ids lidos antes); se algo falhar, desfaz os novos e a disponibilidade anterior permanece.
 * Salvamentos simultâneos podem deixar horários repetidos, mas `buildSchedule` deduplica
 * (mesmo dia e hora), então não gera sessões duplicadas; sem varredura extra aqui.
 */
export async function saveAvailability(input: unknown): Promise<ActionResult<SaveAvailabilityResult>> {
  const parsed = SaveAvailabilityInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", MSG.validation, "slots");
  const { slots } = parsed.data;
  const keys = new Set(slots.map((s) => `${s.weekday}|${s.startTime}`));
  if (keys.size !== slots.length) return fail("VALIDATION", MSG.duplicate, "slots");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    const { data: old, error: oldError } = await supabase
      .from("availability_slots")
      .select("id")
      .eq("user_id", user.id);
    if (oldError) return fail("INTERNAL", MSG.saveInternal);
    const oldIds = (old ?? []).map((r) => r.id);

    const rows = slots.map((s) => ({
      id: randomUUID(),
      user_id: user.id,
      weekday: s.weekday,
      start_time: s.startTime,
      minutes: s.minutes,
    }));
    const { error: insertError } = await supabase.from("availability_slots").insert(rows);
    if (insertError) return fail("INTERNAL", MSG.saveInternal);

    if (oldIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("availability_slots")
        .delete()
        .eq("user_id", user.id)
        .in("id", oldIds);
      if (deleteError) {
        const { error: undoError } = await supabase
          .from("availability_slots")
          .delete()
          .eq("user_id", user.id)
          .in("id", rows.map((r) => r.id));
        if (undoError) console.error("saveAvailability: falha ao desfazer horários novos.");
        return fail("INTERNAL", MSG.saveInternal);
      }
    }
    return ok({ count: rows.length });
  } catch {
    return fail("INTERNAL", MSG.saveInternal);
  }
}

/**
 * Gera o cronograma da Jornada ATIVA do aluno e substitui as sessões `planned` FUTURAS dela
 * (concluídas `done` e sessões passadas ficam). Pendentes = conteúdos da Jornada sem `mastered`
 * em `content_progress`, em ordem de posição. NUNCA escreve em `content_progress`.
 * Sem disponibilidade: VALIDATION com field "slots" (a UI leva ao formulário).
 * Jornada de outro aluno ou inexistente: NOT_FOUND; Jornada do aluno não ativa: NO_ACTIVE_JOURNEY.
 * Sem transação: insere as novas (ids gerados aqui) e só depois apaga as antigas; se apagar
 * falhar, remove as novas. Risco residual: se o desfazer também falhar, há sessões duplicadas.
 * Invariante: o novo conjunto é inserido ANTES de apagar, e só se apagam os `oldIds` lidos no
 * início; nunca sobra zero sessões por causa de uma regeração concorrente.
 * Risco residual: duas regerações realmente simultâneas leem os mesmos oldIds e inserem dois
 * conjuntos; os dois deletes removem os mesmos oldIds, então podem coexistir DUAS cópias das
 * sessões (duplicadas, nada se perde) até a próxima regeração, que as apaga como oldIds.
 * Não varremos "o que não é meu": duas execuções se apagariam mutuamente e sobraria zero.
 */
export async function generateSchedule(input: unknown): Promise<ActionResult<GenerateScheduleResult>> {
  const parsed = GenerateScheduleInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", MSG.validation, "journeyId");
  const { journeyId } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id, status, deadline")
      .eq("id", journeyId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (journeyError) return fail("INTERNAL", MSG.generateInternal);
    if (!journey) return fail("NOT_FOUND", MSG.journeyNotFound, "journeyId");
    if (journey.status !== "active") return fail("NO_ACTIVE_JOURNEY", MSG.noActive);

    const [linksRes, masteredRes, slotsRes] = await Promise.all([
      supabase
        .from("journey_contents")
        .select("content_id, position")
        .eq("journey_id", journey.id)
        .order("position"),
      supabase.from("content_progress").select("content_id").eq("user_id", user.id).eq("status", "mastered"),
      supabase.from("availability_slots").select("weekday, start_time, minutes").eq("user_id", user.id),
    ]);
    if (linksRes.error || masteredRes.error || slotsRes.error) {
      return fail("INTERNAL", MSG.generateInternal);
    }
    const slots = (slotsRes.data ?? []).map((s) => ({
      weekday: s.weekday,
      startTime: s.start_time,
      minutes: s.minutes,
    }));
    if (slots.length === 0) return fail("VALIDATION", MSG.noAvailability, "slots");

    const mastered = new Set((masteredRes.data ?? []).map((r) => r.content_id));
    const pendingContents = [...(linksRes.data ?? [])]
      .sort((a, b) => a.position - b.position)
      .filter((l) => !mastered.has(l.content_id))
      .map((l) => ({ id: l.content_id }));

    const now = new Date();
    const { sessions, deadlineAtRisk } = buildSchedule({
      slots,
      pendingContents,
      deadline: journey.deadline,
      today: now,
    });

    const { data: oldRows, error: oldError } = await supabase
      .from("schedule_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("journey_id", journey.id)
      .eq("status", "planned")
      .gt("starts_at", now.toISOString());
    if (oldError) return fail("INTERNAL", MSG.generateInternal);
    const oldIds = (oldRows ?? []).map((r) => r.id);

    const rows = sessions.map((s) => ({
      id: randomUUID(),
      user_id: user.id,
      journey_id: journey.id,
      content_id: s.content.id,
      starts_at: s.startsAt,
      minutes: s.minutes,
      status: "planned" as const,
    }));
    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("schedule_sessions").insert(rows);
      if (insertError) return fail("INTERNAL", MSG.generateInternal);
    }

    if (oldIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("schedule_sessions")
        .delete()
        .eq("user_id", user.id)
        .in("id", oldIds);
      if (deleteError) {
        if (rows.length > 0) {
          const { error: undoError } = await supabase
            .from("schedule_sessions")
            .delete()
            .eq("user_id", user.id)
            .in("id", rows.map((r) => r.id));
          if (undoError) console.error("generateSchedule: falha ao desfazer sessões novas.");
        }
        return fail("INTERNAL", MSG.generateInternal);
      }
    }

    return ok({ sessionsCount: rows.length, deadlineAtRisk });
  } catch {
    return fail("INTERNAL", MSG.generateInternal);
  }
}
