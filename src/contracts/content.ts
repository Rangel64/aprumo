import { z } from "zod";
import { EssayFeedbackSchema, EssayPartSchema } from "./essay";
import { CompetencyIdSchema, QuickQuestionSchema } from "./views";

/**
 * Formato dos JSON de `content/` (plano §5). O seed e o validador de conteúdo (faixa C)
 * leem por aqui. Regras entre arquivos (ciclos, >= 5 questões, competências cobertas)
 * ficam no validador da faixa C; aqui só a forma e as unicidades internas de cada arquivo.
 */

export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug em minúsculas, com hífens");

function uniqueBy<T>(items: T[], key: (item: T) => string): boolean {
  return new Set(items.map(key)).size === items.length;
}

// ---- content/<slug>.json (um por conteúdo) ----

export const ContentSectionJsonSchema = z
  .object({
    kind: z.enum(["text", "quick_question", "example", "summary"]),
    title: z.string().min(1),
    bodyMd: z.string().min(1),
    quickQuestion: QuickQuestionSchema.optional(),
    sourceCitation: z.string().min(1),
    sourceUrl: z.string().url().optional(),
  })
  .refine((s) => s.kind !== "quick_question" || s.quickQuestion !== undefined, {
    path: ["quickQuestion"],
    message: "seção do tipo quick_question exige quickQuestion",
  });
export type ContentSectionJson = z.infer<typeof ContentSectionJsonSchema>;

export const ContentQuestionJsonSchema = z
  .object({
    stem: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(5),
    correctIndex: z.number().int().min(0),
    explanation: z.string().min(1),
    origin: z.enum(["original", "public"]),
    sourceCitation: z.string().min(1),
    /** Posição (1-based, ordem do array) da seção a rever quando errar; opcional. */
    sectionPosition: z.number().int().min(1).optional(),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    path: ["correctIndex"],
    message: "correctIndex fora do intervalo de options",
  });
export type ContentQuestionJson = z.infer<typeof ContentQuestionJsonSchema>;

export const ContentFlashcardJsonSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
});

export const ContentJsonSchema = z
  .object({
    slug: SlugSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    subject: z.string().min(1),
    position: z.object({ x: z.number().int(), y: z.number().int() }),
    sort: z.number().int(),
    /** Slugs dos pré-requisitos (arestas `prerequisite`: pré-requisito -> este conteúdo). */
    prerequisites: z.array(SlugSchema).default([]),
    /** Slugs relacionados (arestas `related`). */
    related: z.array(SlugSchema).default([]),
    sections: z.array(ContentSectionJsonSchema).min(1),
    questions: z.array(ContentQuestionJsonSchema),
    flashcards: z.array(ContentFlashcardJsonSchema),
  })
  .superRefine((c, ctx) => {
    if (c.prerequisites.includes(c.slug) || c.related.includes(c.slug)) {
      ctx.addIssue({ code: "custom", path: ["prerequisites"], message: "conteúdo não referencia a si mesmo" });
    }
    if (!uniqueBy(c.prerequisites, (s) => s) || !uniqueBy(c.related, (s) => s)) {
      ctx.addIssue({ code: "custom", path: ["prerequisites"], message: "slugs repetidos nas arestas" });
    }
    c.questions.forEach((q, i) => {
      if (q.sectionPosition !== undefined && q.sectionPosition > c.sections.length) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", i, "sectionPosition"],
          message: "sectionPosition aponta para seção inexistente",
        });
      }
    });
    if (!uniqueBy(c.questions, (q) => q.stem)) {
      ctx.addIssue({ code: "custom", path: ["questions"], message: "enunciados repetidos" });
    }
    if (!uniqueBy(c.flashcards, (f) => f.front)) {
      ctx.addIssue({ code: "custom", path: ["flashcards"], message: "frentes de flashcard repetidas" });
    }
  });
export type ContentJson = z.infer<typeof ContentJsonSchema>;

// ---- content/trail.json ----

export const TrailJsonSchema = z
  .object({
    slug: SlugSchema,
    name: z.string().min(1),
    objective: z.string().min(1),
    origin: z.literal("platform"),
    color: z.string().min(1),
    /** Slugs dos conteúdos, em ordem. */
    contentSlugs: z.array(SlugSchema).min(1),
  })
  .refine((t) => uniqueBy(t.contentSlugs, (s) => s), {
    path: ["contentSlugs"],
    message: "slugs repetidos na trilha",
  });
export type TrailJson = z.infer<typeof TrailJsonSchema>;

// ---- content/competency-map.json ----

export const CompetencyMapJsonSchema = z
  .object({
    competencies: z.array(
      z.object({
        competency: CompetencyIdSchema,
        /** Slugs sugeridos, em ordem de prioridade. */
        contentSlugs: z.array(SlugSchema).min(1),
      }),
    ),
  })
  .refine((m) => uniqueBy(m.competencies, (c) => String(c.competency)), {
    path: ["competencies"],
    message: "competência repetida",
  });
export type CompetencyMapJson = z.infer<typeof CompetencyMapJsonSchema>;

// ---- content/essay-topics.json ----

export const EssayTopicJsonSchema = z.object({
  slug: SlugSchema,
  title: z.string().min(1),
  motivatingText: z.string().min(1),
  sourceCitation: z.string().min(1).optional(),
});

export const EssayTopicsJsonSchema = z
  .object({ topics: z.array(EssayTopicJsonSchema).min(1) })
  .refine((t) => uniqueBy(t.topics, (x) => x.slug), {
    path: ["topics"],
    message: "slugs de tema repetidos",
  });
export type EssayTopicsJson = z.infer<typeof EssayTopicsJsonSchema>;

// ---- content/config.json (valores de `app_config`, uma linha por chave) ----

export const AppConfigSchema = z
  .object({
    quiz_question_count: z.number().int().min(1),
    quiz_pass_threshold_pct: z.number().int().min(1).max(100),
    essay_daily_limit_per_user: z.number().int().min(0),
    essay_daily_limit_demo: z.number().int().min(0),
    ai_global_budget_usd: z.number().min(0),
    ai_enabled: z.boolean(),
    essay_min_chars: z.number().int().min(1),
    essay_max_chars: z.number().int().min(1),
    essay_weak_score_threshold: z.number().int().min(0).max(200),
    /** Nota de confiança (1..4) -> dias até a próxima revisão. */
    flashcard_intervals_days: z.object({
      "1": z.number().int().min(0),
      "2": z.number().int().min(0),
      "3": z.number().int().min(0),
      "4": z.number().int().min(0),
    }),
  })
  .refine((c) => c.essay_min_chars < c.essay_max_chars, {
    path: ["essay_min_chars"],
    message: "essay_min_chars deve ser menor que essay_max_chars",
  });
export type AppConfig = z.infer<typeof AppConfigSchema>;

// ---- content/essays/demo-essays.json ----

const DemoEssayBaseSchema = z.object({
  topicSlug: SlugSchema,
  part: EssayPartSchema,
  body: z.string().min(1),
  feedback: EssayFeedbackSchema,
});

/** As redações da conta demo: `topicSlug` + `part` únicos (chave natural da reposição). */
export const DemoAccountEssayJsonSchema = DemoEssayBaseSchema;

/** Linhas de reserva (`is_example=true`, `user_id` nulo): `example_key` único. */
export const FallbackExampleJsonSchema = DemoEssayBaseSchema.extend({
  example_key: z.string().min(1),
});

export const DemoEssaysJsonSchema = z
  .object({
    demoAccountEssays: z.array(DemoAccountEssayJsonSchema).min(1),
    fallbackExamples: z.array(FallbackExampleJsonSchema).min(1),
  })
  .superRefine((d, ctx) => {
    if (!uniqueBy(d.demoAccountEssays, (e) => `${e.topicSlug}|${e.part}`)) {
      ctx.addIssue({
        code: "custom",
        path: ["demoAccountEssays"],
        message: "topicSlug + part repetidos em demoAccountEssays",
      });
    }
    if (!uniqueBy(d.fallbackExamples, (e) => e.example_key)) {
      ctx.addIssue({
        code: "custom",
        path: ["fallbackExamples"],
        message: "example_key repetida em fallbackExamples",
      });
    }
  });
export type DemoEssaysJson = z.infer<typeof DemoEssaysJsonSchema>;
