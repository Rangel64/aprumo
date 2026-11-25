"use server";

import { ReviewFlashcardInputSchema, type ReviewFlashcardResult } from "@/contracts/actions";
import { fail, ok, type ActionResult } from "@/contracts/errors";
import { nextDueOn } from "@/domain/flashcard-scheduler";
import { createClient } from "@/lib/supabase/server";
import { getAppConfig } from "@/server/config";

const MSG = {
  validation: "Avaliação inválida. Recarregue o cartão e tente de novo.",
  unauthenticated: "Entre na sua conta para continuar.",
  internal: "Não foi possível registrar sua revisão agora.",
} as const;

/**
 * Registra a revisão de um flashcard: upsert em `flashcard_states` pelo cliente do aluno
 * (a RLS restringe à própria linha). Intervalos vêm de `app_config`. NUNCA escreve em
 * `content_progress` (RN-007: revisar cartão não conquista nem rebaixa domínio).
 */
export async function reviewFlashcard(
  input: unknown,
): Promise<ActionResult<ReviewFlashcardResult>> {
  const parsed = ReviewFlashcardInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", MSG.validation);
  const { flashcardId, rating } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    const config = await getAppConfig();
    const now = new Date();
    const dueOn = nextDueOn(rating, now, config.flashcard_intervals_days);

    const { error } = await supabase.from("flashcard_states").upsert(
      {
        user_id: user.id,
        flashcard_id: flashcardId,
        last_rating: rating,
        due_on: dueOn,
        reviewed_at: now.toISOString(),
      },
      { onConflict: "user_id,flashcard_id" },
    );
    if (error) return fail("INTERNAL", MSG.internal);

    return ok({ nextDueOn: dueOn });
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}
