import { brasiliaDateString } from "@/domain/flashcard-scheduler";

/**
 * Cronograma (US-016). Função pura e determinística, fuso America/Sao_Paulo (UTC-3 fixo: o
 * Brasil não tem horário de verão desde 2019; ver reviewed-today.ts).
 *
 * Premissas (registradas na PR):
 * - 1 sessão por conteúdo pendente, na ordem recebida (ordem da Jornada), uma em cada horário
 *   disponível, em ordem cronológica a partir de hoje (Brasília). `minutes` vem do horário.
 * - Se o horário de hoje já passou (<= `today`), a contagem começa no próximo horário.
 * - `deadlineAtRisk`: os horários de hoje até o prazo (inclusive) não cobrem os pendentes.
 * - As sessões saem mesmo assim: as que ultrapassam o prazo também são geradas (todas as
 *   pendentes recebem horário); o aviso é só `deadlineAtRisk`.
 * - Sem horários, nenhuma sessão sai e há risco se houver pendente. Sem pendente, nunca há risco.
 * - Slots repetidos (mesmo weekday + startTime) contam uma vez.
 */

export type ScheduleSlot = { weekday: number; startTime: string; minutes: number };

export type PlannedSession<T> = {
  content: T;
  /** ISO com offset de Brasília, ex.: 2099-03-10T20:00:00-03:00. */
  startsAt: string;
  minutes: number;
};

const OFFSET_HOURS = 3; // Brasília = UTC-3
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** `slot.startTime` pode vir como HH:mm ou HH:mm:ss (coluna `time`). */
function parseTime(startTime: string): [number, number] {
  const [h, m] = startTime.split(":");
  return [Number(h), Number(m)];
}

export function buildSchedule<T>({
  slots,
  pendingContents,
  deadline,
  today,
}: {
  slots: ScheduleSlot[];
  pendingContents: T[];
  /** Dia do prazo, YYYY-MM-DD (inclusive). */
  deadline: string;
  /** Instante atual. */
  today: Date;
}): { sessions: PlannedSession<T>[]; deadlineAtRisk: boolean } {
  if (pendingContents.length === 0) return { sessions: [], deadlineAtRisk: false };

  // Dedup e ordem estável por horário do dia.
  const seen = new Set<string>();
  const byWeekday: ScheduleSlot[][] = [[], [], [], [], [], [], []];
  for (const s of slots) {
    const [h, m] = parseTime(s.startTime);
    const key = `${s.weekday}|${pad(h)}:${pad(m)}`;
    if (seen.has(key) || !byWeekday[s.weekday]) continue;
    seen.add(key);
    byWeekday[s.weekday].push({ weekday: s.weekday, startTime: `${pad(h)}:${pad(m)}`, minutes: s.minutes });
  }
  for (const list of byWeekday) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (seen.size === 0) return { sessions: [], deadlineAtRisk: true };

  const [y, mo, d] = brasiliaDateString(today).split("-").map(Number);
  const startDay = Date.UTC(y, mo - 1, d); // meia-noite "de parede" em UTC, só para somar dias
  const nowMs = today.getTime();

  const sessions: PlannedSession<T>[] = [];
  let coveredByDeadline = 0;
  // No máximo 7 dias por conteúdo (há ao menos um horário por semana).
  for (let i = 0; sessions.length < pendingContents.length; i++) {
    const day = new Date(startDay + i * DAY_MS);
    const dateStr = `${pad(day.getUTCFullYear(), 4)}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
    for (const slot of byWeekday[day.getUTCDay()]) {
      if (sessions.length >= pendingContents.length) break;
      const [h, m] = parseTime(slot.startTime);
      const instant = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h + OFFSET_HOURS, m);
      if (instant <= nowMs) continue; // horário de hoje já passou
      sessions.push({
        content: pendingContents[sessions.length],
        startsAt: `${dateStr}T${slot.startTime}:00-03:00`,
        minutes: slot.minutes,
      });
      if (dateStr <= deadline) coveredByDeadline++;
    }
  }

  return { sessions, deadlineAtRisk: coveredByDeadline < pendingContents.length };
}
