import { z } from "zod";

/** Entradas e saídas das Server Actions (plano §3). Todas retornam `ActionResult<Saída>`. */

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Auth (faixa A). Regras de senha: D-030 em aberto; aqui só o mínimo do Supabase (6).
export const AuthInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  // bcrypt (Supabase) lê no máximo 72 BYTES; acentos e emojis ocupam mais de 1.
  password: z
    .string()
    .min(6)
    .max(72)
    .refine((v) => new TextEncoder().encode(v).length <= 72),
  displayName: z.string().trim().min(1).max(80).optional(),
});
export type AuthInput = z.infer<typeof AuthInputSchema>;

export const AuthResultSchema = z.object({ redirectTo: z.string().min(1) });
export type AuthResult = z.infer<typeof AuthResultSchema>;

// Jornada (faixa B)
export const JourneyBaseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("trail"), trailId: z.uuid() }),
  z.object({ type: z.literal("contents"), contentIds: z.array(z.uuid()).min(1) }),
]);

export const CreateJourneyInputSchema = z.object({
  base: JourneyBaseSchema,
  goalDescription: z.string().trim().min(3).max(200),
  /** Formato ISO (AAAA-MM-DD). "Depois de hoje": ver `createJourneyInputAfter`. */
  deadline: z.iso.date(),
  methodology: z.literal("none"),
});
export type CreateJourneyInput = z.infer<typeof CreateJourneyInputSchema>;

/**
 * Versão com a regra "prazo depois de hoje". `today` (AAAA-MM-DD, America/Sao_Paulo)
 * é injetado pelo chamador: o contrato não lê o relógio. A comparação de ISO date é lexicográfica.
 */
export function createJourneyInputAfter(today: string) {
  return CreateJourneyInputSchema.refine((i) => i.deadline > today, {
    path: ["deadline"],
    message: "O prazo precisa ser depois de hoje.",
  });
}

export const CreateJourneyResultSchema = z.object({ journeyId: z.uuid() });
export type CreateJourneyResult = z.infer<typeof CreateJourneyResultSchema>;

export const AddContentsToJourneyInputSchema = z.object({
  contentIds: z.array(z.uuid()).min(1),
  source: z.enum(["map", "essay_suggestion"]),
});
export type AddContentsToJourneyInput = z.infer<typeof AddContentsToJourneyInputSchema>;

export const AddContentsToJourneyResultSchema = z.object({
  journeyId: z.uuid(),
  added: z.number().int().min(0),
});
export type AddContentsToJourneyResult = z.infer<typeof AddContentsToJourneyResultSchema>;

// Cronograma (faixa B)
export const SaveAvailabilityInputSchema = z.object({
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(HH_MM),
        minutes: z.number().int().min(15).max(240),
      }),
    )
    .min(1),
});
export type SaveAvailabilityInput = z.infer<typeof SaveAvailabilityInputSchema>;

export const SaveAvailabilityResultSchema = z.object({ count: z.number().int().min(0) });
export type SaveAvailabilityResult = z.infer<typeof SaveAvailabilityResultSchema>;

export const GenerateScheduleInputSchema = z.object({ journeyId: z.uuid() });
export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>;

export const GenerateScheduleResultSchema = z.object({
  sessionsCount: z.number().int().min(0),
  deadlineAtRisk: z.boolean(),
});
export type GenerateScheduleResult = z.infer<typeof GenerateScheduleResultSchema>;

// Estudo (faixa C)
export const MarkStudyingInputSchema = z.object({ contentId: z.uuid() });
export type MarkStudyingInput = z.infer<typeof MarkStudyingInputSchema>;

export const MarkStudyingResultSchema = z.object({});
export type MarkStudyingResult = z.infer<typeof MarkStudyingResultSchema>;

export const SubmitQuizAttemptInputSchema = z.object({
  contentId: z.uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.uuid(),
        optionIndex: z.number().int().min(0),
      }),
    )
    .min(1),
});
export type SubmitQuizAttemptInput = z.infer<typeof SubmitQuizAttemptInputSchema>;
// Saída: `QuizResult` (views.ts).

export const FlashcardRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type FlashcardRating = z.infer<typeof FlashcardRatingSchema>;

export const ReviewFlashcardInputSchema = z.object({
  flashcardId: z.uuid(),
  rating: FlashcardRatingSchema,
});
export type ReviewFlashcardInput = z.infer<typeof ReviewFlashcardInputSchema>;

export const ReviewFlashcardResultSchema = z.object({ nextDueOn: z.iso.date() });
export type ReviewFlashcardResult = z.infer<typeof ReviewFlashcardResultSchema>;
