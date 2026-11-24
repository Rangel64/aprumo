import {
  ESSAY_COMPETENCY_NAMES,
  ESSAY_ESTIMATE_DISCLAIMER,
  type EssayFeedback,
} from "./essay";
import type {
  ContentView,
  EssayQuota,
  FlashcardView,
  MapView,
  QuizView,
} from "./views";

/**
 * Fixtures para as faixas montarem UI antes do backend real. Dados fictícios (RNF-017).
 * IDs são UUID v4 fixos e legíveis; datas fixas (nada relativo a "hoje").
 */

const ID = {
  trail: "00000000-0000-4000-8000-0000000000a1",
  contentTypology: "00000000-0000-4000-8000-0000000000c1",
  contentStructure: "00000000-0000-4000-8000-0000000000c2",
  contentThesis: "00000000-0000-4000-8000-0000000000c3",
  sectionIntro: "00000000-0000-4000-8000-0000000000e1",
  sectionExample: "00000000-0000-4000-8000-0000000000e2",
  question1: "00000000-0000-4000-8000-0000000000f1",
  question2: "00000000-0000-4000-8000-0000000000f2",
  flashcard: "00000000-0000-4000-8000-0000000000b1",
} as const;

export const mapViewFixture: MapView = {
  nodes: [
    {
      id: ID.contentTypology,
      slug: "tipologia-dissertativo-argumentativo",
      title: "Tipologia e gêneros: o texto dissertativo-argumentativo",
      status: "mastered",
      reviewedToday: true,
      position: { x: 0, y: 0 },
      trailIds: [ID.trail],
      competencies: [2],
    },
    {
      id: ID.contentStructure,
      slug: "estrutura-em-4-paragrafos",
      title: "Estrutura em 4 parágrafos",
      status: "studying",
      reviewedToday: false,
      position: { x: 280, y: 0 },
      trailIds: [ID.trail],
      competencies: [2],
    },
    {
      id: ID.contentThesis,
      slug: "tese-e-projeto-de-texto",
      title: "Tese e projeto de texto",
      status: "not_started",
      reviewedToday: false,
      position: { x: 560, y: 0 },
      trailIds: [ID.trail],
      competencies: [3],
    },
  ],
  edges: [
    { from: ID.contentTypology, to: ID.contentStructure, kind: "prerequisite" },
    { from: ID.contentStructure, to: ID.contentThesis, kind: "prerequisite" },
  ],
};

export const contentViewFixture: ContentView = {
  id: ID.contentStructure,
  slug: "estrutura-em-4-paragrafos",
  title: "Estrutura em 4 parágrafos",
  status: "studying",
  sections: [
    {
      id: ID.sectionIntro,
      kind: "text",
      title: "Por que 4 parágrafos?",
      bodyMd:
        "O texto dissertativo-argumentativo costuma ter **introdução**, dois parágrafos de desenvolvimento e **conclusão**.",
      sourceCitation: "Exemplo fictício para fixture (não use em produção).",
    },
    {
      id: ID.sectionExample,
      kind: "quick_question",
      title: "Confira se entendeu",
      bodyMd: "Qual parágrafo apresenta a proposta de intervenção?",
      quickQuestion: {
        prompt: "Qual parágrafo costuma trazer a proposta de intervenção?",
        options: ["Introdução", "Primeiro desenvolvimento", "Conclusão"],
        correctIndex: 2,
        explanation: "A proposta de intervenção fecha o texto, na conclusão.",
      },
      sourceCitation: "Exemplo fictício para fixture (não use em produção).",
      sourceUrl: "https://example.com/fonte-ficticia",
    },
  ],
};

/** Sem gabarito: o cliente nunca recebe `correct_index`. */
export const quizViewFixture: QuizView = {
  contentId: ID.contentStructure,
  questions: [
    {
      id: ID.question1,
      stem: "Quantos parágrafos tem a estrutura clássica do texto dissertativo-argumentativo?",
      options: ["2", "3", "4", "6"],
    },
    {
      id: ID.question2,
      stem: "Em qual parágrafo costuma aparecer a tese?",
      options: ["Introdução", "Desenvolvimento 1", "Desenvolvimento 2", "Conclusão"],
    },
  ],
};

export const essayQuotaFixture: EssayQuota = {
  used: 1,
  limit: 3,
  remaining: 2,
  globalAvailable: true,
};

export const flashcardViewFixture: FlashcardView = {
  id: ID.flashcard,
  contentId: ID.contentStructure,
  contentTitle: "Estrutura em 4 parágrafos",
  front: "Onde fica a proposta de intervenção?",
  back: "Na conclusão, com agente, ação, meio, finalidade e detalhamento.",
};

/**
 * Introdução: C5 não avaliável. Notas: C1 160 + C2 120 + C3 120 + C4 160 = 560.
 * Fracas (<= 120): C2 e C3 (empate na nota: menor id primeiro).
 */
export const essayFeedbackFixture: EssayFeedback = {
  isEstimate: true,
  disclaimer: ESSAY_ESTIMATE_DISCLAIMER,
  promptVersion: "essay-feedback@v1",
  modelKey: "fake-model",
  part: "introduction",
  competencies: [
    {
      id: 1,
      name: ESSAY_COMPETENCY_NAMES[1],
      assessable: true,
      scoreEstimate: 160,
      strengths: ["Poucos desvios de norma culta e boa pontuação."],
      improvements: ["Revise a concordância no segundo período."],
      evidence: ["A educação é um direito"],
    },
    {
      id: 2,
      name: ESSAY_COMPETENCY_NAMES[2],
      assessable: true,
      scoreEstimate: 120,
      strengths: ["Menciona o tema proposto."],
      improvements: ["Delimite melhor o recorte temático para não tangenciar."],
      evidence: [],
    },
    {
      id: 3,
      name: ESSAY_COMPETENCY_NAMES[3],
      assessable: true,
      scoreEstimate: 120,
      strengths: [],
      improvements: ["Explicite a tese de forma clara ao final da introdução."],
      evidence: [],
    },
    {
      id: 4,
      name: ESSAY_COMPETENCY_NAMES[4],
      assessable: true,
      scoreEstimate: 160,
      strengths: ["Uso adequado de conectivos entre os períodos."],
      improvements: [],
      evidence: [],
    },
    {
      id: 5,
      name: ESSAY_COMPETENCY_NAMES[5],
      assessable: false,
      scoreEstimate: null,
      strengths: [],
      improvements: [],
      evidence: [],
    },
  ],
  totalEstimate: 560,
  summary:
    "Introdução com boa norma culta; falta explicitar a tese e delimitar melhor o recorte do tema.",
  weakCompetencies: [2, 3],
  suggestions: [
    {
      competency: 3,
      contentId: ID.contentThesis,
      slug: "tese-e-projeto-de-texto",
      title: "Tese e projeto de texto",
    },
  ],
};
