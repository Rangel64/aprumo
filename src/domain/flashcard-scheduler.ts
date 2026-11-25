import { brasiliaDayRange } from "@/features/map/reviewed-today";

export type FlashcardRatingValue = 1 | 2 | 3 | 4;

/** Nota (1..4) -> dias até a próxima revisão. Vem de `app_config.flashcard_intervals_days`. */
export type FlashcardIntervals = Record<"1" | "2" | "3" | "4", number>;

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** Dia civil de Brasília (UTC-3 fixo, ver reviewed-today.ts) que contém `now`, como YYYY-MM-DD. */
export function brasiliaDateString(now: Date): string {
  // `start` é a meia-noite de Brasília em UTC; somar 3h cai no mesmo dia civil lido em UTC.
  const wall = new Date(brasiliaDayRange(now).start.getTime() + 3 * 60 * 60 * 1000);
  return `${pad(wall.getUTCFullYear(), 4)}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
}

/**
 * Próxima revisão (YYYY-MM-DD) = dia de hoje em Brasília + `intervals[rating]` dias.
 * Função pura: os intervalos nunca são fixos aqui; o chamador os lê de `app_config`.
 */
export function nextDueOn(
  rating: FlashcardRatingValue,
  now: Date,
  intervals: FlashcardIntervals,
): string {
  const days = intervals[String(rating) as keyof FlashcardIntervals];
  const [y, m, d] = brasiliaDateString(now).split("-").map(Number);
  // Date.UTC normaliza virada de mês/ano.
  const due = new Date(Date.UTC(y, m - 1, d + days));
  return `${pad(due.getUTCFullYear(), 4)}-${pad(due.getUTCMonth() + 1)}-${pad(due.getUTCDate())}`;
}
