import { z } from "zod";

/**
 * Tipos de leitura (plano §3). Tudo aqui é o que a UI recebe: nunca inclui gabarito.
 * IDs são UUID (z.uuid); datas são ISO 8601.
 */

export const ContentStatusSchema = z.enum(["not_started", "studying", "mastered"]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const CompetencyIdSchema = z.number().int().min(1).max(5);
export type CompetencyId = z.infer<typeof CompetencyIdSchema>;

/** Pergunta rápida de uma seção (autoavaliação, não vale domínio). */
export const QuickQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(5),
    correctIndex: z.number().int().min(0),
    explanation: z.string().min(1),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    path: ["correctIndex"],
    message: "correctIndex fora do intervalo de options",
  });
export type QuickQuestion = z.infer<typeof QuickQuestionSchema>;

// Mapa
export const MapNodeSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  status: ContentStatusSchema,
  reviewedToday: z.boolean(),
  position: z.object({ x: z.number(), y: z.number() }),
  trailIds: z.array(z.uuid()),
  competencies: z.array(CompetencyIdSchema),
});
export type MapNode = z.infer<typeof MapNodeSchema>;

export const MapEdgeSchema = z.object({
  from: z.uuid(),
  to: z.uuid(),
  kind: z.enum(["prerequisite", "related"]),
});
export type MapEdge = z.infer<typeof MapEdgeSchema>;

export const MapViewSchema = z.object({
  nodes: z.array(MapNodeSchema),
  edges: z.array(MapEdgeSchema),
});
export type MapView = z.infer<typeof MapViewSchema>;

// Trilha
export const TrailViewSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  objective: z.string(),
  origin: z.literal("platform"),
  contents: z.array(
    z.object({ id: z.uuid(), slug: z.string().min(1), title: z.string().min(1) }),
  ),
});
export type TrailView = z.infer<typeof TrailViewSchema>;

// Jornada
export const JourneyViewSchema = z.object({
  id: z.uuid(),
  goalDescription: z.string().min(1),
  deadline: z.iso.date(),
  contents: z.array(
    z.object({
      id: z.uuid(),
      slug: z.string().min(1),
      title: z.string().min(1),
      status: ContentStatusSchema,
      position: z.number().int().min(0),
    }),
  ),
  nextContentSlug: z.string().nullable(),
  masteredCount: z.number().int().min(0),
  total: z.number().int().min(0),
});
export type JourneyView = z.infer<typeof JourneyViewSchema>;

// Conteúdo
export const SectionViewSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["text", "quick_question", "example", "summary"]),
  title: z.string().min(1),
  bodyMd: z.string(),
  quickQuestion: QuickQuestionSchema.optional(),
  sourceCitation: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});
export type SectionView = z.infer<typeof SectionViewSchema>;

export const ContentViewSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  sections: z.array(SectionViewSchema),
  status: ContentStatusSchema,
});
export type ContentView = z.infer<typeof ContentViewSchema>;

// Mini-simulado (sem gabarito)
export const QuizViewSchema = z.object({
  contentId: z.uuid(),
  questions: z.array(
    z.object({
      id: z.uuid(),
      stem: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
    }),
  ),
});
export type QuizView = z.infer<typeof QuizViewSchema>;

export const QuizResultSchema = z.object({
  correct: z.number().int().min(0),
  total: z.number().int().min(1),
  thresholdPct: z.number().int().min(0).max(100),
  passed: z.boolean(),
  mastered: z.boolean(),
  sectionsToReview: z.array(z.object({ id: z.uuid(), title: z.string().min(1) })),
});
export type QuizResult = z.infer<typeof QuizResultSchema>;

// Flashcards
export const FlashcardViewSchema = z.object({
  id: z.uuid(),
  contentId: z.uuid(),
  contentTitle: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
});
export type FlashcardView = z.infer<typeof FlashcardViewSchema>;

// Cronograma
export const ScheduleViewSchema = z.object({
  hasAvailability: z.boolean(),
  journeyId: z.uuid().optional(),
  sessions: z.array(
    z.object({
      id: z.uuid(),
      startsAt: z.iso.datetime({ offset: true }),
      minutes: z.number().int().min(1),
      contentSlug: z.string().min(1),
      contentTitle: z.string().min(1),
      status: z.enum(["planned", "done"]),
    }),
  ),
  deadlineAtRisk: z.boolean(),
});
export type ScheduleView = z.infer<typeof ScheduleViewSchema>;

// Cota de redação
export const EssayQuotaSchema = z.object({
  used: z.number().int().min(0),
  limit: z.number().int().min(0),
  remaining: z.number().int().min(0),
  globalAvailable: z.boolean(),
});
export type EssayQuota = z.infer<typeof EssayQuotaSchema>;
