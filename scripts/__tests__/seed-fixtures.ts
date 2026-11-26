/** Fixtures em memória do seed (nada de content/ real; tudo fictício). */
import { ESSAY_COMPETENCY_NAMES, ESSAY_ESTIMATE_DISCLAIMER, type EssayFeedback } from "../../src/contracts/essay";
import type { ContentBundle } from "../../src/domain/content/validate";

export function makeContent(slug: string, prerequisites: string[] = [], sort = 0) {
  return {
    slug,
    title: `Conteúdo ${slug}`,
    summary: "Resumo fictício.",
    subject: "Português",
    position: { x: sort * 100, y: 50 },
    sort,
    prerequisites,
    related: [],
    sections: [
      { kind: "text", title: "Texto", bodyMd: "Corpo fictício.", sourceCitation: "Fonte fictícia, p. 1" },
      { kind: "summary", title: "Resumo", bodyMd: "Resumo fictício.", sourceCitation: "Fonte fictícia, p. 2" },
    ],
    questions: [1, 2, 3, 4, 5].map((n) => ({
      stem: `Pergunta ${n} de ${slug}?`,
      options: ["A", "B", "C"],
      correctIndex: 1,
      explanation: "Explicação fictícia.",
      origin: "original",
      sourceCitation: "Autoria própria",
      ...(n === 1 ? { sectionPosition: 2 } : {}),
    })),
    flashcards: [1, 2, 3].map((n) => ({ front: `Frente ${n} de ${slug}`, back: `Verso ${n}` })),
  };
}

export function makeFeedback(part: "introduction" | "development" | "conclusion"): EssayFeedback {
  const scores = [120, 160, 120, 160, 80] as const;
  return {
    isEstimate: true,
    disclaimer: ESSAY_ESTIMATE_DISCLAIMER,
    promptVersion: "essay-feedback@v1",
    modelKey: "fake-model",
    part,
    competencies: scores.map((s, i) => ({
      id: i + 1,
      name: ESSAY_COMPETENCY_NAMES[(i + 1) as 1 | 2 | 3 | 4 | 5],
      assessable: true,
      scoreEstimate: s,
      strengths: ["Ponto forte fictício."],
      improvements: ["Melhoria fictícia."],
      evidence: [],
    })),
    // 120 + 160 + 120 + 160 + 80 = 640
    totalEstimate: 640,
    summary: "Resumo fictício do retorno.",
    weakCompetencies: [5],
    suggestions: [],
  };
}

export const TRAIL_SLUGS = ["c-um", "c-dois", "c-tres", "c-quatro", "c-pendente"];

/** 4 conteúdos com arquivo (o 5º slug da Trilha está pendente), 1 tema, 1 reserva e 1 redação da demo. */
export function makeBundle(withDemoEssays = true): ContentBundle {
  const contents = [
    makeContent("c-um", [], 1),
    makeContent("c-dois", ["c-um"], 2),
    makeContent("c-tres", ["c-dois"], 3),
    makeContent("c-quatro", ["c-tres"], 4),
  ];
  return {
    contents: contents.map((c) => ({ file: `content/${c.slug}.json`, data: c })),
    trail: {
      slug: "trilha-ficticia",
      name: "Trilha fictícia",
      objective: "Objetivo fictício.",
      origin: "platform",
      color: "#7b5cff",
      contentSlugs: TRAIL_SLUGS,
    },
    competencyMap: {
      competencies: [1, 2, 3, 4, 5].map((n) => ({ competency: n, contentSlugs: ["c-um", "c-dois"] })),
    },
    essayTopics: {
      topics: [{ slug: "tema-um", title: "Tema fictício", motivatingText: "Texto motivador fictício." }],
    },
    demoEssays: withDemoEssays
      ? {
          demoAccountEssays: [
            { topicSlug: "tema-um", part: "introduction", body: "Texto fictício da demo.", feedback: makeFeedback("introduction") },
          ],
          fallbackExamples: [
            {
              topicSlug: "tema-um",
              part: "conclusion",
              body: "Texto fictício da reserva.",
              feedback: makeFeedback("conclusion"),
              example_key: "reserva-1",
            },
          ],
        }
      : undefined,
  };
}

/** Ambiente fictício; nenhum valor é real. */
export const FAKE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY: "chave-ficticia-de-teste",
  DEMO_USER_EMAIL: "demo@example.com",
  DEMO_USER_PASSWORD: "senha-ficticia-de-teste",
};
