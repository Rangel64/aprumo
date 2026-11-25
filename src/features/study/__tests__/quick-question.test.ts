import { describe, expect, it } from "vitest";
import { contentViewFixture } from "@/contracts/fixtures";
import type { QuickQuestion } from "@/contracts/views";
import { checkQuickQuestion, optionLetter } from "../quick-question";

// Fixture: 3 alternativas, correctIndex 2 (Conclusão).
const q = contentViewFixture.sections.find((s) => s.quickQuestion)!.quickQuestion as QuickQuestion;

describe("pergunta rápida", () => {
  it("letras A, B, C", () => {
    expect([0, 1, 2].map(optionLetter)).toEqual(["A", "B", "C"]);
  });

  it("acerto na alternativa correta (índice 2) traz a explicação", () => {
    expect(checkQuickQuestion(q, 2)).toEqual({
      state: "correct",
      message: `Correto. ${q.explanation}`,
    });
  });

  it("erro em outra alternativa indica a letra correta (C)", () => {
    expect(checkQuickQuestion(q, 0)).toEqual({
      state: "incorrect",
      message: `Não foi dessa vez. A resposta é a alternativa C. ${q.explanation}`,
    });
  });

  it("sem escolha ou índice fora do intervalo não conta como resposta", () => {
    for (const bad of [null, -1, 3, 1.5]) {
      expect(checkQuickQuestion(q, bad).state).toBe("unanswered");
    }
  });
});
