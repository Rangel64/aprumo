import { describe, expect, it } from "vitest";
import type { QuizResult, QuizView } from "@/contracts/views";
import {
  buildPayload,
  firstUnansweredIndex,
  isComplete,
  missingMessage,
  resultAnnouncement,
  reviewLinks,
  selectOption,
  unansweredCount,
} from "../quiz-state";

const Q = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const quiz: QuizView = {
  contentId: "11111111-1111-4111-8111-111111111111",
  questions: [1, 2, 3].map((n) => ({ id: Q(n), stem: `Q${n}`, options: ["a", "b", "c"] })),
};

describe("quiz-state", () => {
  it("conta as questões sem resposta (3 questões, 1 respondida = 2)", () => {
    expect(unansweredCount(quiz, selectOption({}, Q(1), 0))).toBe(2);
  });

  it("não monta payload incompleto", () => {
    expect(isComplete(quiz, { [Q(1)]: 0 })).toBe(false);
    expect(buildPayload(quiz, { [Q(1)]: 0 })).toBeNull();
  });

  it("monta o payload na ordem das questões, aceitando o índice 0", () => {
    // Q3 -> 0, Q1 -> 1, Q2 -> 2 (índice no reduce = opção escolhida).
    const sel = [Q(3), Q(1), Q(2)].reduce<Record<string, number>>(
      (s, id, i) => ({ ...s, [id]: i }),
      {},
    );
    expect(buildPayload(quiz, sel)).toEqual({
      contentId: quiz.contentId,
      answers: [
        { questionId: Q(1), optionIndex: 1 },
        { questionId: Q(2), optionIndex: 2 },
        { questionId: Q(3), optionIndex: 0 },
      ],
    });
  });

  it("trocar a resposta não altera o objeto anterior", () => {
    const a = selectOption({}, Q(1), 0);
    selectOption(a, Q(1), 2);
    expect(a[Q(1)]).toBe(0);
  });

  it("sem questões: não está completo", () => {
    expect(isComplete({ ...quiz, questions: [] }, {})).toBe(false);
  });

  it("acha a primeira questão sem resposta (Q1 respondida, Q2 e Q3 não = índice 1)", () => {
    expect(firstUnansweredIndex(quiz, { [Q(1)]: 0 })).toBe(1);
    expect(firstUnansweredIndex(quiz, { [Q(1)]: 0, [Q(2)]: 0, [Q(3)]: 0 })).toBe(-1);
  });

  it("mensagem de respostas faltantes no singular e no plural", () => {
    expect(missingMessage(1)).toBe("Falta 1 resposta para enviar.");
    expect(missingMessage(2)).toBe("Faltam 2 respostas para enviar.");
  });

  it("anuncia uma frase curta por resultado", () => {
    const base = { total: 5, thresholdPct: 80, sectionsToReview: [] };
    expect(resultAnnouncement({ ...base, correct: 4, passed: true, mastered: true })).toBe(
      "Você acertou 4 de 5. Conteúdo dominado.",
    );
    expect(resultAnnouncement({ ...base, correct: 3, passed: false, mastered: false })).toBe(
      "Você acertou 3 de 5. Veja as seções a rever.",
    );
  });

  it("links de revisão usam a posição da seção (a partir de 1); desconhecida cai no topo", () => {
    const result: QuizResult = {
      correct: 3,
      total: 5,
      thresholdPct: 80,
      passed: false,
      mastered: false,
      sectionsToReview: [
        { id: "s2", title: "B" },
        { id: "zz", title: "?" },
      ],
    };
    expect(reviewLinks(result, ["s1", "s2"], "/conteudos/x")).toEqual([
      { id: "s2", title: "B", href: "/conteudos/x#secao-2" },
      { id: "zz", title: "?", href: "/conteudos/x" },
    ]);
  });
});
