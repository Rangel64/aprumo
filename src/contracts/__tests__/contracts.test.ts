import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AppConfigSchema,
  ContentJsonSchema,
  ContentViewSchema,
  DemoEssaysJsonSchema,
  ERROR_CODES,
  ERROR_HTTP_STATUS,
  ESSAY_ESTIMATE_DISCLAIMER,
  EssayFeedbackAISchema,
  EssayFeedbackSchema,
  EssayQuotaSchema,
  FlashcardViewSchema,
  MapViewSchema,
  QuizViewSchema,
  ROUTES,
  createJourneyInputAfter,
  essayFeedbackFixture,
  essayQuotaFixture,
  flashcardViewFixture,
  contentViewFixture,
  mapViewFixture,
  quizViewFixture,
} from "../index";

describe("fixtures validam nos schemas", () => {
  it("MapView", () => expect(MapViewSchema.parse(mapViewFixture)).toEqual(mapViewFixture));
  it("ContentView", () =>
    expect(ContentViewSchema.parse(contentViewFixture)).toEqual(contentViewFixture));
  it("QuizView (sem gabarito)", () => {
    expect(QuizViewSchema.parse(quizViewFixture)).toEqual(quizViewFixture);
    expect(JSON.stringify(quizViewFixture)).not.toContain("correctIndex");
  });
  it("EssayFeedback", () =>
    expect(EssayFeedbackSchema.parse(essayFeedbackFixture)).toEqual(essayFeedbackFixture));
  it("EssayQuota", () =>
    expect(EssayQuotaSchema.parse(essayQuotaFixture)).toEqual(essayQuotaFixture));
  it("FlashcardView", () =>
    expect(FlashcardViewSchema.parse(flashcardViewFixture)).toEqual(flashcardViewFixture));
});

describe("ESSAY_ESTIMATE_DISCLAIMER", () => {
  it("é o texto literal da RN-014", () => {
    expect(ESSAY_ESTIMATE_DISCLAIMER).toBe(
      "Esta nota é uma estimativa feita por inteligência artificial com base nas 5 competências do ENEM. Não é a nota oficial e pode diferir da correção de uma banca humana. Use como orientação de estudo.",
    );
  });

  it("EssayFeedback rejeita aviso diferente do literal", () => {
    const altered = { ...essayFeedbackFixture, disclaimer: "outro texto" };
    expect(EssayFeedbackSchema.safeParse(altered).success).toBe(false);
  });
});

/** Saída do modelo: as competências da fixture sem o `name` (derivado no servidor). */
function aiCompetencies() {
  return essayFeedbackFixture.competencies.map((c) => {
    const copy: Record<string, unknown> & { id: number } = { ...c };
    delete copy.name;
    return copy;
  });
}

describe("EssayFeedback", () => {
  it("totalEstimate da fixture é a soma das avaliáveis: 160 + 120 + 120 + 160 = 560", () => {
    expect(essayFeedbackFixture.totalEstimate).toBe(560);
  });

  it("rejeita totalEstimate que não bate com as competências", () => {
    const wrong = { ...essayFeedbackFixture, totalEstimate: 561 };
    expect(EssayFeedbackSchema.safeParse(wrong).success).toBe(false);
  });

  it("EssayFeedbackAI aceita a saída do modelo (só competências e resumo)", () => {
    const ai = {
      competencies: aiCompetencies(),
      summary: essayFeedbackFixture.summary,
    };
    expect(EssayFeedbackAISchema.safeParse(ai).success).toBe(true);
  });

  it("EssayFeedbackAI rejeita nota fora da escala ENEM e competência não avaliável com nota", () => {
    const base = aiCompetencies();
    const offScale = base.map((c) => (c.id === 1 ? { ...c, scoreEstimate: 100 } : c));
    const unassessableWithScore = base.map((c) => (c.id === 5 ? { ...c, scoreEstimate: 40 } : c));
    const summary = "ok";
    expect(EssayFeedbackAISchema.safeParse({ competencies: offScale, summary }).success).toBe(false);
    expect(
      EssayFeedbackAISchema.safeParse({ competencies: unassessableWithScore, summary }).success,
    ).toBe(false);
  });
});

describe("erros", () => {
  it("tem os 14 códigos do plano e um status HTTP para cada", () => {
    expect(ERROR_CODES).toHaveLength(14);
    for (const code of ERROR_CODES) expect(ERROR_HTTP_STATUS[code]).toBeGreaterThanOrEqual(400);
  });
});

describe("config", () => {
  const raw: unknown = JSON.parse(
    readFileSync(resolve(process.cwd(), "content", "config.json"), "utf8"),
  );

  it("schema aceita content/config.json", () => {
    expect(AppConfigSchema.safeParse(raw).success).toBe(true);
  });

  it("rejeita essay_min_chars >= essay_max_chars", () => {
    const bad = { ...(raw as Record<string, unknown>), essay_min_chars: 500, essay_max_chars: 500 };
    expect(AppConfigSchema.safeParse(bad).success).toBe(false);
  });

  it("rejeita chave faltando", () => {
    const rest = { ...(raw as Record<string, unknown>) };
    delete rest.ai_enabled;
    expect(AppConfigSchema.safeParse(rest).success).toBe(false);
  });
});

describe("content", () => {
  const section = { kind: "text", title: "T", bodyMd: "corpo", sourceCitation: "fonte" };
  const content = {
    slug: "exemplo-ficticio",
    title: "Exemplo",
    summary: "Resumo",
    subject: "Português/Redação",
    position: { x: 0, y: 0 },
    sort: 1,
    sections: [section],
    questions: [
      {
        stem: "Pergunta?",
        options: ["a", "b"],
        correctIndex: 1,
        explanation: "porque sim",
        origin: "original",
        sourceCitation: "fonte",
        sectionPosition: 1,
      },
    ],
    flashcards: [{ front: "frente", back: "verso" }],
  };

  it("aceita um conteúdo mínimo e aplica defaults de arestas", () => {
    const parsed = ContentJsonSchema.parse(content);
    expect(parsed.prerequisites).toEqual([]);
  });

  it("rejeita seção sem fonte, correctIndex fora do intervalo e sectionPosition inexistente", () => {
    const noSource = { ...content, sections: [{ ...section, sourceCitation: "" }] };
    const badIndex = { ...content, questions: [{ ...content.questions[0], correctIndex: 2 }] };
    const badSection = { ...content, questions: [{ ...content.questions[0], sectionPosition: 2 }] };
    expect(ContentJsonSchema.safeParse(noSource).success).toBe(false);
    expect(ContentJsonSchema.safeParse(badIndex).success).toBe(false);
    expect(ContentJsonSchema.safeParse(badSection).success).toBe(false);
  });

  it("demo-essays: aceita o formato e rejeita example_key e topicSlug+part repetidos", () => {
    const account = { topicSlug: "tema-um", part: "introduction", body: "texto", feedback: essayFeedbackFixture };
    const fallback = { ...account, example_key: "reserva-1" };
    const ok = { demoAccountEssays: [account], fallbackExamples: [fallback] };
    expect(DemoEssaysJsonSchema.safeParse(ok).success).toBe(true);

    const dupAccount = { ...ok, demoAccountEssays: [account, account] };
    const dupKey = { ...ok, fallbackExamples: [fallback, fallback] };
    expect(DemoEssaysJsonSchema.safeParse(dupAccount).success).toBe(false);
    expect(DemoEssaysJsonSchema.safeParse(dupKey).success).toBe(false);
  });
});

describe("actions e rotas", () => {
  const input = {
    base: { type: "contents", contentIds: [mapViewFixture.nodes[0].id] },
    goalDescription: "Dominar a estrutura do texto",
    deadline: "2099-12-31",
    methodology: "none",
  };

  it("prazo precisa ser depois de hoje (relógio injetado)", () => {
    expect(createJourneyInputAfter("2098-01-01").safeParse(input).success).toBe(true);
    expect(createJourneyInputAfter("2099-12-31").safeParse(input).success).toBe(false);
  });

  it("monta rotas", () => {
    expect(ROUTES.map("dominado")).toBe("/mapa?estado=dominado");
    expect(ROUTES.map("todos")).toBe("/mapa");
    expect(ROUTES.newJourney({ conteudos: ["a", "b"] })).toBe("/jornada/nova?conteudos=a,b");
    expect(ROUTES.quiz("estrutura")).toBe("/conteudos/estrutura/mini-simulado");
  });
});
