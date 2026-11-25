"use server";

import { z } from "zod";
import { SubmitQuizAttemptInputSchema } from "@/contracts/actions";
import { fail, ok, type ActionResult } from "@/contracts/errors";
import type { QuizResult } from "@/contracts/views";
import { evaluateMastery } from "@/domain/mastery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppConfig } from "@/server/config";

const MSG = {
  validation: "Respostas inválidas. Recarregue o mini-simulado e tente de novo.",
  unauthenticated: "Entre na sua conta para continuar.",
  notFound: "Mini-simulado não encontrado.",
  internal: "Não foi possível corrigir seu mini-simulado agora.",
} as const;

const OptionsSchema = z.array(z.unknown()).min(2);

/**
 * Corrige o mini-simulado no servidor. O gabarito (`question_keys`) só é lido com a
 * service role, depois de `getUser()`, e nunca volta na resposta. O conjunto de questões
 * e o total vêm do banco e de `app_config` (as mesmas N primeiras por `id` de `getQuizView`),
 * jamais do cliente. Aprovado: `content_progress` vira `mastered` (um upsert, só se ainda não dominado); reprovação não toca nele.
 */
export async function submitQuizAttempt(input: unknown): Promise<ActionResult<QuizResult>> {
  const parsed = SubmitQuizAttemptInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", MSG.validation);
  const { contentId, answers } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    const admin = createAdminClient();
    const config = await getAppConfig();

    const { data: questions, error: questionsError } = await admin
      .from("questions")
      .select("id, section_id, options")
      .eq("content_id", contentId)
      .order("id")
      .limit(config.quiz_question_count + 1);
    if (questionsError) return fail("INTERNAL", MSG.internal);
    // Decisão: o conteúdo deve ter EXATAMENTE quiz_question_count questões (hoje, 5). Menos ou
    // mais é conteúdo mal formado: NOT_FOUND, igual a getQuizView (sem simulado parcial/truncado).
    if (!questions || questions.length !== config.quiz_question_count) {
      return fail("NOT_FOUND", MSG.notFound);
    }

    // Total: o que o banco entrega (limitado por app_config), nunca o que o cliente enviou.
    const total = questions.length;
    const byId = new Map(questions.map((q) => [q.id, q]));

    // Exatamente o conjunto do simulado: sem repetidas, sem alheias, sem faltar.
    const answered = new Map<string, number>();
    for (const a of answers) {
      if (answered.has(a.questionId)) return fail("VALIDATION", MSG.validation);
      const question = byId.get(a.questionId);
      if (!question) return fail("VALIDATION", MSG.validation);
      const options = OptionsSchema.safeParse(question.options);
      if (!options.success || a.optionIndex >= options.data.length) {
        return fail("VALIDATION", MSG.validation);
      }
      answered.set(a.questionId, a.optionIndex);
    }
    if (answered.size !== total) return fail("VALIDATION", MSG.validation);

    const { data: keys, error: keysError } = await admin
      .from("question_keys")
      .select("question_id, correct_index")
      .in("question_id", [...byId.keys()]);
    if (keysError || !keys || keys.length !== total) return fail("INTERNAL", MSG.internal);
    const correctByQuestion = new Map(keys.map((k) => [k.question_id, k.correct_index]));

    let correct = 0;
    const wrongSectionIds = new Set<string>();
    for (const q of questions) {
      if (answered.get(q.id) === correctByQuestion.get(q.id)) {
        correct += 1;
      } else if (q.section_id) {
        wrongSectionIds.add(q.section_id);
      }
    }

    const result = evaluateMastery({
      correct,
      total,
      thresholdPct: config.quiz_pass_threshold_pct,
    });

    let sectionsToReview: QuizResult["sectionsToReview"] = [];
    if (wrongSectionIds.size > 0) {
      const { data: sections, error: sectionsError } = await admin
        .from("content_sections")
        .select("id, title")
        .eq("content_id", contentId)
        .in("id", [...wrongSectionIds])
        .order("position");
      if (sectionsError) return fail("INTERNAL", MSG.internal);
      sectionsToReview = (sections ?? []).map((s) => ({ id: s.id, title: s.title }));
    }

    const { error: attemptError } = await admin.from("quiz_attempts").insert({
      user_id: user.id,
      content_id: contentId,
      answers: answers.map((a) => ({ questionId: a.questionId, optionIndex: a.optionIndex })),
      correct,
      total,
      threshold_pct: config.quiz_pass_threshold_pct,
      passed: result.passed,
    });
    if (attemptError) return fail("INTERNAL", MSG.internal);

    // Estado anterior: já dominado nunca é reescrito (mastered_at original preservado).
    const { data: existing, error: progressError } = await admin
      .from("content_progress")
      .select("status")
      .eq("user_id", user.id)
      .eq("content_id", contentId)
      .maybeSingle();
    if (progressError) return fail("INTERNAL", MSG.internal);
    const alreadyMastered = existing?.status === "mastered";

    if (result.passed && !alreadyMastered) {
      // UM único upsert (atômico no Postgres) cobre linha ausente e `studying`. Sem corrida
      // de duas escritas; se duas aprovações simultâneas chegarem, ambas gravam mastered e
      // o último mastered_at vence (aceito: nenhuma delas rebaixa nada). Se o upsert falhar
      // depois de gravar quiz_attempts, a resposta é erro genérico e a próxima tentativa
      // converge: o progresso continua não-mastered e o upsert é refeito.
      const { error: promoteError } = await admin.from("content_progress").upsert(
        {
          user_id: user.id,
          content_id: contentId,
          status: "mastered",
          mastered_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" },
      );
      if (promoteError) return fail("INTERNAL", MSG.internal);
    }

    return ok({
      correct,
      total,
      thresholdPct: config.quiz_pass_threshold_pct,
      passed: result.passed,
      // Estado final: aprovado agora OU já dominado antes. `passed` é só desta tentativa.
      mastered: result.passed || alreadyMastered,
      sectionsToReview,
    });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}
