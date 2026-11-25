import type { SubmitQuizAttemptInput } from "@/contracts/actions";
import type { QuizResult, QuizView } from "@/contracts/views";

/** Respostas escolhidas: questionId -> índice da alternativa. É o único dado do aluno no estado do cliente. */
export type Selected = Readonly<Record<string, number>>;

export function selectOption(selected: Selected, questionId: string, optionIndex: number): Selected {
  return { ...selected, [questionId]: optionIndex };
}

export function unansweredCount(quiz: QuizView, selected: Selected): number {
  return quiz.questions.filter((q) => selected[q.id] === undefined).length;
}

export function isComplete(quiz: QuizView, selected: Selected): boolean {
  return quiz.questions.length > 0 && unansweredCount(quiz, selected) === 0;
}

/** Monta o payload na ordem das questões; null se faltar resposta. Não corrige nada: isso é do servidor. */
export function buildPayload(quiz: QuizView, selected: Selected): SubmitQuizAttemptInput | null {
  if (!isComplete(quiz, selected)) return null;
  return {
    contentId: quiz.contentId,
    answers: quiz.questions.map((q) => ({ questionId: q.id, optionIndex: selected[q.id] as number })),
  };
}

/** Índice da primeira questão sem resposta (ordem exibida); -1 se todas respondidas. */
export function firstUnansweredIndex(quiz: QuizView, selected: Selected): number {
  return quiz.questions.findIndex((q) => selected[q.id] === undefined);
}

export function missingMessage(left: number): string {
  return `${left === 1 ? "Falta 1 resposta" : `Faltam ${left} respostas`} para enviar.`;
}

/** Única frase anunciada pela região viva ao sair o resultado; o cartão fica fora dela. */
export function resultAnnouncement(result: QuizResult): string {
  const head = `Você acertou ${result.correct} de ${result.total}.`;
  return result.passed ? `${head} Conteúdo dominado.` : `${head} Veja as seções a rever.`;
}

export type SectionLink = { id: string; title: string; href: string };

/** Âncora `#secao-N` igual à da página de estudo (N = posição da seção, a partir de 1). Seção desconhecida cai no topo. */
export function reviewLinks(
  result: QuizResult,
  sectionIds: readonly string[],
  contentHref: string,
): SectionLink[] {
  return result.sectionsToReview.map((s) => {
    const i = sectionIds.indexOf(s.id);
    return { id: s.id, title: s.title, href: i >= 0 ? `${contentHref}#secao-${i + 1}` : contentHref };
  });
}
