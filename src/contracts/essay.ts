import { z } from "zod";
import { CompetencyIdSchema, EssayQuotaSchema } from "./views";

/** Texto literal da RN-014 / D-007. Vem do servidor, nunca do modelo. */
export const ESSAY_ESTIMATE_DISCLAIMER =
  "Esta nota é uma estimativa feita por inteligência artificial com base nas 5 competências do ENEM. Não é a nota oficial e pode diferir da correção de uma banca humana. Use como orientação de estudo.";

export const ESSAY_PROMPT_VERSION_PATTERN = /^essay-feedback@v\d+$/;

/** Nomes oficiais das competências (Cartilha do Participante, INEP). Constante do servidor. */
export const ESSAY_COMPETENCY_NAMES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Demonstrar domínio da modalidade escrita formal da língua portuguesa.",
  2: "Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema, dentro dos limites estruturais do texto dissertativo-argumentativo.",
  3: "Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.",
  4: "Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.",
  5: "Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.",
};

export const ESSAY_PARTS = ["introduction", "development", "conclusion"] as const;
export const EssayPartSchema = z.enum(ESSAY_PARTS);
export type EssayPart = z.infer<typeof EssayPartSchema>;

/** Escala ENEM por competência. */
export const ESSAY_SCORES = [0, 40, 80, 120, 160, 200] as const;
export const EssayScoreSchema = z.union([
  z.literal(0),
  z.literal(40),
  z.literal(80),
  z.literal(120),
  z.literal(160),
  z.literal(200),
]);

export const EssayFeedbackRequestSchema = z.object({
  topicId: z.uuid(),
  part: EssayPartSchema,
  text: z.string(),
});
export type EssayFeedbackRequest = z.infer<typeof EssayFeedbackRequestSchema>;

// ---- Saída do modelo (EssayFeedbackAI): só competências e resumo ----

export const ESSAY_LIMITS = {
  listItems: 3,
  strengthChars: 280,
  improvementChars: 280,
  evidenceChars: 120,
  summaryChars: 400,
} as const;

const strengths = z
  .array(z.string().min(1).max(ESSAY_LIMITS.strengthChars))
  .max(ESSAY_LIMITS.listItems);
const improvements = z
  .array(z.string().min(1).max(ESSAY_LIMITS.improvementChars))
  .max(ESSAY_LIMITS.listItems);
/** Trechos LITERAIS do aluno; a pós-validação (servidor) confere a substring. */
const evidence = z
  .array(z.string().min(1).max(ESSAY_LIMITS.evidenceChars))
  .max(ESSAY_LIMITS.listItems);

export const EssayCompetencyAISchema = z
  .object({
    id: CompetencyIdSchema,
    assessable: z.boolean(),
    scoreEstimate: EssayScoreSchema.nullable(),
    strengths,
    improvements,
    evidence,
  })
  .refine((c) => (c.assessable ? c.scoreEstimate !== null : c.scoreEstimate === null), {
    path: ["scoreEstimate"],
    message: "scoreEstimate deve ser null se, e somente se, assessable for false",
  });
export type EssayCompetencyAI = z.infer<typeof EssayCompetencyAISchema>;

function hasCompetenciesInOrder(list: { id: number }[]): boolean {
  return list.length === 5 && list.every((c, i) => c.id === i + 1);
}

export const EssayFeedbackAISchema = z.object({
  competencies: z
    .array(EssayCompetencyAISchema)
    .length(5)
    .refine(hasCompetenciesInOrder, { message: "competencies deve ter ids 1..5 nesta ordem" }),
  summary: z.string().min(1).max(ESSAY_LIMITS.summaryChars),
});
export type EssayFeedbackAI = z.infer<typeof EssayFeedbackAISchema>;

// ---- Retorno completo (EssayFeedback): campos derivados no servidor ----

export const EssayCompetencySchema = z
  .object({
    id: CompetencyIdSchema,
    name: z.string().min(1),
    assessable: z.boolean(),
    scoreEstimate: EssayScoreSchema.nullable(),
    strengths,
    improvements,
    evidence,
  })
  .refine((c) => (c.assessable ? c.scoreEstimate !== null : c.scoreEstimate === null), {
    path: ["scoreEstimate"],
    message: "scoreEstimate deve ser null se, e somente se, assessable for false",
  });
export type EssayCompetency = z.infer<typeof EssayCompetencySchema>;

export const EssaySuggestionSchema = z.object({
  competency: CompetencyIdSchema,
  contentId: z.uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
});
export type EssaySuggestion = z.infer<typeof EssaySuggestionSchema>;

/** Payload persistido em `essay_feedbacks.payload`. */
export const EssayFeedbackSchema = z
  .object({
    isEstimate: z.literal(true),
    disclaimer: z.literal(ESSAY_ESTIMATE_DISCLAIMER),
    promptVersion: z.string().regex(ESSAY_PROMPT_VERSION_PATTERN),
    modelKey: z.string().min(1),
    part: EssayPartSchema,
    competencies: z
      .array(EssayCompetencySchema)
      .length(5)
      .refine(hasCompetenciesInOrder, { message: "competencies deve ter ids 1..5 nesta ordem" }),
    /** Soma das competências avaliáveis, calculada no servidor; null se nenhuma for avaliável. */
    totalEstimate: z.number().int().min(0).max(1000).nullable(),
    summary: z.string().min(1).max(ESSAY_LIMITS.summaryChars),
    /** Avaliáveis com nota <= essay_weak_score_threshold, a menor primeiro. */
    weakCompetencies: z.array(CompetencyIdSchema),
    suggestions: z.array(EssaySuggestionSchema),
  })
  .superRefine((f, ctx) => {
    const scores = f.competencies.flatMap((c) =>
      c.assessable && c.scoreEstimate !== null ? [c.scoreEstimate] : [],
    );
    const expected = scores.length === 0 ? null : scores.reduce<number>((a, b) => a + b, 0);
    if (f.totalEstimate !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["totalEstimate"],
        message: "totalEstimate deve ser a soma das competências avaliáveis (ou null)",
      });
    }
  });
export type EssayFeedback = z.infer<typeof EssayFeedbackSchema>;

export const EssayFeedbackResponseSchema = z.object({
  submissionId: z.uuid(),
  feedback: EssayFeedbackSchema,
  quota: EssayQuotaSchema,
});
export type EssayFeedbackResponse = z.infer<typeof EssayFeedbackResponseSchema>;
