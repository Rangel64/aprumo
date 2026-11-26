import { describe, expect, it } from "vitest";

import { buildSchedule, type ScheduleSlot } from "./schedule";

// Datas fixas no futuro (sem relógio real). 2099-03-10 é terça (weekday 2), 0 = domingo.
// 2099-03-10T12:00Z = 09:00 em Brasília (UTC-3 fixo).
const NOW = new Date("2099-03-10T12:00:00Z");
const TUE_8: ScheduleSlot = { weekday: 2, startTime: "08:00", minutes: 30 };
const TUE_19: ScheduleSlot = { weekday: 2, startTime: "19:00", minutes: 60 };
const THU_8: ScheduleSlot = { weekday: 4, startTime: "08:00", minutes: 45 };
const A = { id: "a" };
const B = { id: "b" };
const C = { id: "c" };

const starts = (r: ReturnType<typeof buildSchedule<{ id: string }>>) =>
  r.sessions.map((s) => `${s.content.id}@${s.startsAt}/${s.minutes}`);

describe("buildSchedule", () => {
  it("disponibilidade suficiente: 1 sessão por conteúdo, 08:00 de hoje já passou", () => {
    const r = buildSchedule({
      slots: [TUE_8, TUE_19, THU_8],
      pendingContents: [A, B, C],
      deadline: "2099-03-20",
      today: NOW,
    });
    // Ter 10 08:00 passou (09:00 agora): A = ter 10 19:00; B = qui 12 08:00; C = ter 17 08:00.
    expect(starts(r)).toEqual([
      "a@2099-03-10T19:00:00-03:00/60",
      "b@2099-03-12T08:00:00-03:00/45",
      "c@2099-03-17T08:00:00-03:00/30",
    ]);
    expect(r.deadlineAtRisk).toBe(false);
  });

  it("insuficiente: sessões saem mesmo as após o prazo e deadlineAtRisk é true", () => {
    const r = buildSchedule({
      slots: [TUE_19, THU_8],
      pendingContents: [A, B, C],
      deadline: "2099-03-12", // cobre ter 10 e qui 12: 2 horários para 3 conteúdos
      today: NOW,
    });
    expect(r.deadlineAtRisk).toBe(true);
    expect(r.sessions).toHaveLength(3);
    expect(r.sessions[2].startsAt).toBe("2099-03-17T19:00:00-03:00");
  });

  it("prazo hoje: o horário de hoje conta (inclusive)", () => {
    const one = buildSchedule({ slots: [TUE_19], pendingContents: [A], deadline: "2099-03-10", today: NOW });
    expect(one.deadlineAtRisk).toBe(false);
    const two = buildSchedule({ slots: [TUE_19], pendingContents: [A, B], deadline: "2099-03-10", today: NOW });
    expect(two.deadlineAtRisk).toBe(true);
  });

  it("prazo já vencido com pendentes: em risco, sessões saem", () => {
    const r = buildSchedule({ slots: [TUE_19], pendingContents: [A], deadline: "2099-03-01", today: NOW });
    expect(r.deadlineAtRisk).toBe(true);
    expect(r.sessions).toHaveLength(1);
  });

  it("sem conteúdo pendente: nada a gerar e sem risco", () => {
    expect(buildSchedule({ slots: [TUE_19], pendingContents: [], deadline: "2099-03-20", today: NOW })).toEqual({
      sessions: [],
      deadlineAtRisk: false,
    });
  });

  it("sem slots: nenhuma sessão e em risco quando há pendente", () => {
    expect(buildSchedule({ slots: [], pendingContents: [A], deadline: "2099-03-20", today: NOW })).toEqual({
      sessions: [],
      deadlineAtRisk: true,
    });
  });

  it("ordem estável: conteúdos na ordem recebida, horários em ordem cronológica", () => {
    const args = { pendingContents: [C, A, B], deadline: "2099-04-30", today: NOW };
    const r1 = buildSchedule({ ...args, slots: [THU_8, TUE_19, TUE_8] });
    const r2 = buildSchedule({ ...args, slots: [TUE_8, TUE_19, THU_8] });
    expect(r1).toEqual(r2);
    expect(r1.sessions.map((s) => s.content.id)).toEqual(["c", "a", "b"]);
    const times = r1.sessions.map((s) => s.startsAt);
    expect(times).toEqual([...times].sort());
  });

  it("slots duplicados (mesmo weekday e horário) contam uma vez", () => {
    const r = buildSchedule({ slots: [TUE_19, { ...TUE_19 }], pendingContents: [A, B], deadline: "2099-03-30", today: NOW });
    expect(r.sessions.map((s) => s.startsAt)).toEqual(["2099-03-10T19:00:00-03:00", "2099-03-17T19:00:00-03:00"]);
  });

  it("aceita startTime HH:mm:ss (coluna time do Postgres)", () => {
    const r = buildSchedule({
      slots: [{ weekday: 2, startTime: "19:00:00", minutes: 20 }],
      pendingContents: [A],
      deadline: "2099-03-20",
      today: NOW,
    });
    expect(r.sessions[0].startsAt).toBe("2099-03-10T19:00:00-03:00");
  });

  it("horário exatamente agora já passou", () => {
    const r = buildSchedule({
      slots: [{ weekday: 2, startTime: "09:00", minutes: 30 }],
      pendingContents: [A],
      deadline: "2099-03-20",
      today: NOW, // 09:00 em Brasília
    });
    expect(r.sessions[0].startsAt).toBe("2099-03-17T09:00:00-03:00");
  });

  it("virada de mês: ter 31/03 e depois ter 07/04", () => {
    const r = buildSchedule({
      slots: [TUE_19],
      pendingContents: [A, B],
      deadline: "2099-04-30",
      today: new Date("2099-03-31T12:00:00Z"),
    });
    expect(r.sessions.map((s) => s.startsAt)).toEqual(["2099-03-31T19:00:00-03:00", "2099-04-07T19:00:00-03:00"]);
  });

  it("virada de ano: qui 31/12/2099 22:00 e depois qui 07/01/2100", () => {
    const r = buildSchedule({
      slots: [{ weekday: 4, startTime: "22:00", minutes: 30 }],
      pendingContents: [A, B],
      deadline: "2100-01-31",
      today: new Date("2099-12-31T23:00:00Z"), // 20:00 em Brasília
    });
    expect(r.sessions.map((s) => s.startsAt)).toEqual(["2099-12-31T22:00:00-03:00", "2100-01-07T22:00:00-03:00"]);
    expect(r.deadlineAtRisk).toBe(false);
  });

  it("fuso: 23h30 de Brasília ainda é terça (UTC já é quarta); 23:00 já passou, 23:45 não", () => {
    const r = buildSchedule({
      slots: [
        { weekday: 2, startTime: "23:00", minutes: 30 },
        { weekday: 2, startTime: "23:45", minutes: 30 },
        { weekday: 3, startTime: "08:00", minutes: 30 },
      ],
      pendingContents: [A, B, C],
      deadline: "2099-03-31",
      today: new Date("2099-03-11T02:30:00Z"), // ter 10/03 23:30 em Brasília
    });
    expect(r.sessions.map((s) => s.startsAt)).toEqual([
      "2099-03-10T23:45:00-03:00",
      "2099-03-11T08:00:00-03:00",
      "2099-03-17T23:00:00-03:00",
    ]);
  });
});
