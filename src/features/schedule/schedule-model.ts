import type { ScheduleView } from "@/contracts/views";

/**
 * Lógica pura do Cronograma (US-016): agrupar sessões por dia em America/Sao_Paulo, formatar e
 * validar o formulário de disponibilidade. Brasília é UTC-3 fixo (sem horário de verão desde
 * 2019; mesmo critério de `domain/schedule.ts` e `features/map/reviewed-today.ts`).
 */

export type ScheduleSession = ScheduleView["sessions"][number];

const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export type BrasiliaParts = { date: string; time: string; weekday: number };

/** Data (YYYY-MM-DD), horário (HH:mm) e dia da semana (0 = domingo) de um instante, em Brasília. */
export function brasiliaParts(iso: string): BrasiliaParts {
  const d = new Date(Date.parse(iso) + BRASILIA_OFFSET_MS);
  return {
    date: `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    weekday: d.getUTCDay(),
  };
}

function dateFromString(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Dia da semana (0 = domingo) de uma data YYYY-MM-DD. */
export function weekdayOf(date: string): number {
  return dateFromString(date).getUTCDay();
}

/** Soma `days` a uma data YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(dateFromString(date).getTime() + days * DAY_MS);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** "28 de maio" */
export function formatDayMonth(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]}`;
}

/** "Quarta-feira, 26 de novembro" */
export function formatDayHeading(date: string): string {
  return `${WEEKDAY_LABELS[weekdayOf(date)]}, ${formatDayMonth(date)}`;
}

/** "45 min" */
export function formatMinutes(minutes: number): string {
  return `${minutes} min`;
}

export type ScheduleItem = ScheduleSession & { date: string; time: string };

export type DayGroup = { date: string; sessions: ScheduleItem[] };

/** Sessões em ordem cronológica, com data e horário de Brasília. */
export function toItems(sessions: ScheduleSession[]): ScheduleItem[] {
  return sessions
    .map((s) => ({ ...s, ...brasiliaParts(s.startsAt) }))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/** Os 7 dias a partir de `today` (YYYY-MM-DD), cada um com suas sessões (dia sem sessão = lista vazia). */
export function groupWeek(sessions: ScheduleSession[], today: string): DayGroup[] {
  const items = toItems(sessions);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i);
    return { date, sessions: items.filter((s) => s.date === date) };
  });
}

/** Sessões de um dia. */
export function sessionsOfDay(sessions: ScheduleSession[], date: string): ScheduleItem[] {
  return toItems(sessions).filter((s) => s.date === date);
}

/** Feitas e total do dia, para "1 de 3 sessões". */
export function dayProgress(items: ScheduleItem[]): { done: number; total: number } {
  return { done: items.filter((s) => s.status === "done").length, total: items.length };
}

/** "1 de 3 sessões" / "0 de 1 sessão" */
export function progressLabel({ done, total }: { done: number; total: number }): string {
  return `${done} de ${total} ${total === 1 ? "sessão" : "sessões"}`;
}

/** Resultado do "Regerar cronograma", em texto para a região role=status. */
export function generationMessage(r: { sessionsCount: number; deadlineAtRisk: boolean }): string {
  if (r.sessionsCount === 0) {
    return "Cronograma atualizado: não há conteúdos pendentes para agendar.";
  }
  const base = `Cronograma gerado com ${r.sessionsCount} ${r.sessionsCount === 1 ? "sessão" : "sessões"}.`;
  return r.deadlineAtRisk ? `${base} Atenção: o prazo da Jornada está em risco.` : base;
}

/** A geração pede a disponibilidade quando devolve VALIDATION com field "slots". */
export function needsAvailability(error: { code: string; field?: string }): boolean {
  return error.code === "VALIDATION" && error.field === "slots";
}

// ---------- Formulário de disponibilidade ----------

export const MINUTES_MIN = 15;
export const MINUTES_MAX = 240;

export type SlotDraft = {
  /** Identificador local da linha (não vai para o servidor). */
  id: string;
  weekday: number;
  startTime: string;
  /** Texto do campo; vira número só no envio. */
  minutes: string;
};

export type SlotRowErrors = { startTime?: string; minutes?: string };

export type SlotsValidation = {
  rows: Record<string, SlotRowErrors>;
  /** Erro do formulário (ex.: nenhum horário). */
  general?: string;
  valid: boolean;
};

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function emptyDraft(id: string): SlotDraft {
  return { id, weekday: 1, startTime: "", minutes: "" };
}

export function validateSlots(drafts: SlotDraft[]): SlotsValidation {
  const rows: Record<string, SlotRowErrors> = {};
  if (drafts.length === 0) {
    return { rows, general: "Adicione ao menos um horário.", valid: false };
  }
  const seen = new Set<string>();
  for (const d of drafts) {
    const e: SlotRowErrors = {};
    if (!HH_MM.test(d.startTime)) {
      e.startTime = "Informe o horário no formato HH:mm, por exemplo 19:30.";
    } else {
      const key = `${d.weekday}|${d.startTime}`;
      if (seen.has(key)) e.startTime = "Este dia e horário já foram informados.";
      seen.add(key);
    }
    const minutes = d.minutes.trim();
    const n = Number(minutes);
    if (!/^\d+$/.test(minutes) || n < MINUTES_MIN || n > MINUTES_MAX) {
      e.minutes = `A duração deve ser um número inteiro de ${MINUTES_MIN} a ${MINUTES_MAX} minutos.`;
    }
    if (e.startTime || e.minutes) rows[d.id] = e;
  }
  return { rows, valid: Object.keys(rows).length === 0 };
}

/** Entrada de `saveAvailability`. Chamar só com `validateSlots(...).valid`. */
export function buildSaveInput(drafts: SlotDraft[]) {
  return {
    slots: drafts.map((d) => ({
      weekday: d.weekday,
      startTime: d.startTime,
      minutes: Number(d.minutes.trim()),
    })),
  };
}
