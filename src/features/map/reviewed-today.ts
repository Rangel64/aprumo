/**
 * "Revisado hoje" é por dia civil de Brasília. O Brasil não tem horário de verão desde 2019,
 * então o fuso é fixo em UTC-3 (documentado aqui, sem depender do fuso do servidor).
 */
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Início (inclusive) e fim (exclusive) do dia de Brasília que contém `now`, em UTC. */
export function brasiliaDayRange(now: Date): { start: Date; end: Date } {
  // Deslocado, os campos UTC de `shifted` leem o relógio de parede de Brasília.
  const shifted = new Date(now.getTime() + BRASILIA_OFFSET_MS);
  const wallMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  const start = new Date(wallMidnight - BRASILIA_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** `reviewedAt` (ISO, timestamptz) cai no dia de Brasília de `now`? Nulo ou inválido: não. */
export function isReviewedToday(reviewedAt: string | null | undefined, now: Date): boolean {
  if (!reviewedAt) return false;
  const t = new Date(reviewedAt).getTime();
  if (Number.isNaN(t)) return false;
  const { start, end } = brasiliaDayRange(now);
  return t >= start.getTime() && t < end.getTime();
}
