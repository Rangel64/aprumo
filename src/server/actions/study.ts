"use server";

import { MarkStudyingInputSchema, type MarkStudyingResult } from "@/contracts/actions";
import { fail, ok, type ActionResult } from "@/contracts/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MSG = {
  validation: "Conteúdo inválido.",
  unauthenticated: "Entre na sua conta para continuar.",
  notFound: "Conteúdo não encontrado.",
  internal: "Não foi possível registrar seu estudo agora.",
} as const;

/**
 * Marca o conteúdo como "em estudo" para o usuário logado. Escrita feita pelo servidor
 * (service role) depois de `getUser()`. NUNCA rebaixa `mastered`: o insert usa
 * ON CONFLICT DO NOTHING, então uma linha existente (studying ou mastered) fica como está.
 */
export async function markStudying(input: unknown): Promise<ActionResult<MarkStudyingResult>> {
  const parsed = MarkStudyingInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", MSG.validation, "contentId");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("UNAUTHENTICATED", MSG.unauthenticated);

    const admin = createAdminClient();
    const { error } = await admin
      .from("content_progress")
      .upsert(
        { user_id: user.id, content_id: parsed.data.contentId, status: "studying" },
        { onConflict: "user_id,content_id", ignoreDuplicates: true },
      );
    if (error) {
      // 23503: violação de FK (conteúdo inexistente).
      return error.code === "23503"
        ? fail("NOT_FOUND", MSG.notFound)
        : fail("INTERNAL", MSG.internal);
    }
    return ok({});
  } catch {
    return fail("INTERNAL", MSG.internal);
  }
}
