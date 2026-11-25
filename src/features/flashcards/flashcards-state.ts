import type { FlashcardRating } from "@/contracts/actions";

/** Níveis de confiança (US-018). Protótipo mostra "SABIA!" e "REVER"; "Errei" e "Quase" são proposta. */
export const RATINGS: ReadonlyArray<{ value: FlashcardRating; label: string; hint: string }> = [
  { value: 1, label: "Errei", hint: "Não lembrei" },
  { value: 2, label: "Rever", hint: "Lembrei pouco" },
  { value: 3, label: "Quase", hint: "Lembrei com esforço" },
  { value: 4, label: "Sabia!", hint: "Lembrei bem" },
];

export function ratingLabel(value: FlashcardRating): string {
  return RATINGS.find((r) => r.value === value)?.label ?? "";
}

/** "n de N cartas": n é a posição da carta atual (1-based), limitada a N. */
export function progressLabel(index: number, total: number): string {
  const n = Math.min(Math.max(index + 1, 1), Math.max(total, 1));
  return `${n} de ${total} ${total === 1 ? "carta" : "cartas"}`;
}

/** Cartas já concluídas (para a barra): em sessão = index; ao fim = total. */
export function doneCount(index: number, total: number): number {
  return Math.min(Math.max(index, 0), total);
}

/** Espaço vira a carta, exceto com foco em campo de texto ou controle que já trata Espaço. */
export function shouldFlipOnSpace(
  key: string,
  target: { tagName?: string; isContentEditable?: boolean } | null,
  flipped: boolean,
  busy: boolean,
): boolean {
  if (key !== " " || flipped || busy) return false;
  if (target?.isContentEditable) return false;
  const tag = (target?.tagName ?? "").toUpperCase();
  return !["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tag);
}

/** Data de hoje (yyyy-mm-dd) em America/Sao_Paulo, mesma referência do agendador. */
export function todayInSaoPaulo(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Texto da próxima revisão a partir da data devolvida pela action (sem intervalos fixos). */
export function nextDueText(nextDueOn: string, today: string): string {
  const diff = dayNumber(nextDueOn) - dayNumber(today);
  if (!Number.isFinite(diff)) return "em breve";
  if (diff <= 0) return "hoje";
  if (diff === 1) return "amanhã";
  return `em ${diff} dias`;
}

export function reviewAnnouncement(label: string, nextDueOn: string, today: string): string {
  return `Avaliado como ${label}. Próxima revisão ${nextDueText(nextDueOn, today)}.`;
}

export const FLIP_ANNOUNCEMENT = "Resposta mostrada. Avalie sua confiança.";
export const REVIEW_ERROR = "Não foi possível registrar sua revisão agora. Tente de novo.";

export function cardAnnouncement(index: number, total: number): string {
  return `Carta ${progressLabel(index, total)}.`;
}
