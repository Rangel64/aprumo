import type { QuickQuestion } from "@/contracts/views";

export type QuickQuestionResult =
  | { state: "unanswered"; message: string }
  | { state: "correct" | "incorrect"; message: string };

/** Letra da alternativa (A, B, C...) para exibição. */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * Confere a resposta da pergunta rápida (autoavaliação: não vale domínio).
 * `selected` nulo ou fora do intervalo conta como "não respondida".
 */
export function checkQuickQuestion(
  question: QuickQuestion,
  selected: number | null,
): QuickQuestionResult {
  if (selected === null || !Number.isInteger(selected) || selected < 0 || selected >= question.options.length) {
    return { state: "unanswered", message: "Escolha uma alternativa antes de conferir." };
  }
  if (selected === question.correctIndex) {
    return { state: "correct", message: `Correto. ${question.explanation}` };
  }
  return {
    state: "incorrect",
    message: `Não foi dessa vez. A resposta é a alternativa ${optionLetter(question.correctIndex)}. ${question.explanation}`,
  };
}
