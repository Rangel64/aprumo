import { describe, expect, it } from "vitest";
import {
  addDays,
  brasiliaParts,
  buildSaveInput,
  dayProgress,
  formatDayHeading,
  formatDayMonth,
  generationMessage,
  groupWeek,
  needsAvailability,
  progressLabel,
  sessionsOfDay,
  validateSlots,
  weekdayOf,
  type ScheduleSession,
  type SlotDraft,
} from "../schedule-model";

// 2026-11-26 é uma quinta-feira (1º de nov/2026 é domingo). Datas fixas, sem relógio real.
const TODAY = "2026-11-26";

function session(id: string, startsAt: string, status: "planned" | "done" = "planned"): ScheduleSession {
  return {
    id,
    startsAt,
    minutes: 45,
    contentSlug: `conteudo-${id}`,
    contentTitle: `Conteúdo ${id}`,
    status,
  };
}

describe("brasiliaParts", () => {
  it("converte UTC para Brasília (UTC-3)", () => {
    expect(brasiliaParts("2026-11-26T22:00:00.000Z")).toEqual({
      date: "2026-11-26",
      time: "19:00",
      weekday: 4,
    });
  });

  it("02:30 UTC ainda é o dia anterior em Brasília; 03:00 UTC já é o dia seguinte", () => {
    expect(brasiliaParts("2026-11-27T02:30:00.000Z")).toEqual({
      date: "2026-11-26",
      time: "23:30",
      weekday: 4,
    });
    expect(brasiliaParts("2026-11-27T03:00:00.000Z").date).toBe("2026-11-27");
  });

  it("entende ISO com offset de Brasília", () => {
    expect(brasiliaParts("2026-11-26T08:15:00-03:00").time).toBe("08:15");
  });
});

describe("datas", () => {
  it("weekdayOf e addDays atravessam mês e ano", () => {
    expect(weekdayOf(TODAY)).toBe(4);
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays(TODAY, 0)).toBe(TODAY);
  });

  it("formata dia e mês por extenso", () => {
    expect(formatDayMonth("2026-11-05")).toBe("5 de novembro");
    expect(formatDayHeading(TODAY)).toBe("Quinta-feira, 26 de novembro");
  });
});

describe("agrupamento", () => {
  const sessions = [
    session("c", "2026-11-28T10:00:00-03:00"),
    session("a", "2026-11-26T09:00:00-03:00", "done"),
    session("b", "2026-11-26T19:00:00-03:00"),
    // 02:30 UTC de 27/11 ainda é 26/11 à noite em Brasília.
    session("n", "2026-11-27T02:30:00.000Z"),
  ];

  it("groupWeek devolve 7 dias a partir de hoje, com dia vazio incluído", () => {
    const week = groupWeek(sessions, TODAY);
    expect(week).toHaveLength(7);
    expect(week[0].date).toBe("2026-11-26");
    expect(week[6].date).toBe("2026-12-02");
    // 26/11: a (09:00), b (19:00), n (23:30), nesta ordem cronológica.
    expect(week[0].sessions.map((s) => s.id)).toEqual(["a", "b", "n"]);
    expect(week[1].sessions).toEqual([]); // 27/11 sem sessões
    expect(week[2].sessions.map((s) => s.id)).toEqual(["c"]); // 28/11
  });

  it("sessionsOfDay filtra por data de Brasília", () => {
    expect(sessionsOfDay(sessions, "2026-11-26")).toHaveLength(3);
    expect(sessionsOfDay(sessions, "2026-11-27")).toEqual([]);
  });

  it("dayProgress e progressLabel: 1 feita de 3 do dia", () => {
    const day = sessionsOfDay(sessions, "2026-11-26");
    expect(dayProgress(day)).toEqual({ done: 1, total: 3 });
    expect(progressLabel({ done: 1, total: 3 })).toBe("1 de 3 sessões");
    expect(progressLabel({ done: 0, total: 1 })).toBe("0 de 1 sessão");
  });
});

describe("mensagens da geração", () => {
  it("anuncia a contagem e o risco de prazo", () => {
    expect(generationMessage({ sessionsCount: 3, deadlineAtRisk: false })).toBe(
      "Cronograma gerado com 3 sessões.",
    );
    expect(generationMessage({ sessionsCount: 1, deadlineAtRisk: true })).toBe(
      "Cronograma gerado com 1 sessão. Atenção: o prazo da Jornada está em risco.",
    );
    expect(generationMessage({ sessionsCount: 0, deadlineAtRisk: false })).toContain("não há conteúdos");
  });

  it("só VALIDATION com field slots leva ao formulário", () => {
    expect(needsAvailability({ code: "VALIDATION", field: "slots" })).toBe(true);
    expect(needsAvailability({ code: "VALIDATION", field: "journeyId" })).toBe(false);
    expect(needsAvailability({ code: "INTERNAL" })).toBe(false);
  });
});

describe("validateSlots", () => {
  const row = (id: string, over: Partial<SlotDraft> = {}): SlotDraft => ({
    id,
    weekday: 1,
    startTime: "19:30",
    minutes: "45",
    ...over,
  });

  it("aceita linha válida e limites 15 e 240", () => {
    expect(validateSlots([row("a")]).valid).toBe(true);
    expect(validateSlots([row("a", { minutes: "15" }), row("b", { weekday: 2, minutes: "240" })]).valid).toBe(true);
  });

  it("exige ao menos um horário", () => {
    const v = validateSlots([]);
    expect(v.valid).toBe(false);
    expect(v.general).toBe("Adicione ao menos um horário.");
  });

  it("rejeita horário vazio ou fora de HH:mm", () => {
    for (const t of ["", "7:30", "24:00", "19:60", "19h"]) {
      expect(validateSlots([row("a", { startTime: t })]).rows.a?.startTime).toBeTruthy();
    }
  });

  it("rejeita duração fora de 15 a 240, vazia ou não inteira", () => {
    for (const m of ["", "14", "241", "30.5", "abc", "-20"]) {
      expect(validateSlots([row("a", { minutes: m })]).rows.a?.minutes).toBeTruthy();
    }
  });

  it("marca a repetição (mesmo dia e horário) só na segunda linha", () => {
    const v = validateSlots([row("a"), row("b"), row("c", { weekday: 2 })]);
    expect(v.valid).toBe(false);
    expect(v.rows.a).toBeUndefined();
    expect(v.rows.b?.startTime).toContain("já foram informados");
    expect(v.rows.c).toBeUndefined();
  });

  it("buildSaveInput converte a duração em número", () => {
    expect(buildSaveInput([row("a", { minutes: " 45 " })])).toEqual({
      slots: [{ weekday: 1, startTime: "19:30", minutes: 45 }],
    });
  });
});
