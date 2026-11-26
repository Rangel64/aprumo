import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: unknown };
let tables: Record<string, Result> = {};
let calls: { table: string; op: string; args: unknown[] }[] = [];

// Só leitura existe no builder: qualquer escrita lançaria TypeError.
function builder(table: string) {
  const b: Record<string, unknown> = {};
  for (const op of ["select", "eq", "gte", "lt", "order", "limit"]) {
    b[op] = (...args: unknown[]) => {
      calls.push({ table, op, args });
      return b;
    };
  }
  b.maybeSingle = async () => {
    const r = tables[table] ?? { data: null, error: null };
    return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error };
  };
  b.then = (resolve: (r: Result) => unknown) => resolve(tables[table] ?? { data: [], error: null });
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: (t: string) => builder(t) }),
}));

import { getScheduleView } from "../schedule";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const JOURNEY = uuid(10);
const A = uuid(101);
const B = uuid(102);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2099-03-10T12:00:00Z")); // ter 09:00 em Brasília
  calls = [];
  tables = {
    availability_slots: { data: [{ weekday: 2, start_time: "19:00:00", minutes: 60 }], error: null },
    journeys: { data: { id: JOURNEY, deadline: "2099-03-31" }, error: null },
    schedule_sessions: {
      data: [
        { id: uuid(802), starts_at: "2099-03-17T22:00:00+00:00", minutes: 60, status: "planned", contents: { slug: "b", title: "B" } },
        { id: uuid(801), starts_at: "2099-03-10T22:00:00+00:00", minutes: 60, status: "done", contents: [{ slug: "a", title: "A" }] },
      ],
      error: null,
    },
    journey_contents: { data: [{ content_id: A, position: 0 }, { content_id: B, position: 1 }], error: null },
    content_progress: { data: [], error: null },
  };
});

describe("getScheduleView", () => {
  it("sem Jornada: sem sessões, sem risco, journeyId ausente; hasAvailability reflete os horários", async () => {
    tables.journeys = { data: null, error: null };
    const v = await getScheduleView(USER);
    expect(v).toEqual({ hasAvailability: true, sessions: [], deadlineAtRisk: false });
    expect(calls.map((c) => c.table)).not.toContain("schedule_sessions");
  });

  it("sem disponibilidade: hasAvailability false e sem risco calculado", async () => {
    tables.availability_slots = { data: [], error: null };
    const v = await getScheduleView(USER);
    expect(v.hasAvailability).toBe(false);
    expect(v.deadlineAtRisk).toBe(false);
    expect(v.journeyId).toBe(JOURNEY);
  });

  it("devolve sessões ordenadas, com conteúdo, em ISO UTC; e filtra por usuário e Jornada ativa", async () => {
    const v = await getScheduleView(USER);
    expect(v.sessions.map((s) => [s.id, s.startsAt, s.contentSlug, s.contentTitle, s.status])).toEqual([
      [uuid(801), "2099-03-10T22:00:00.000Z", "a", "A", "done"],
      [uuid(802), "2099-03-17T22:00:00.000Z", "b", "B", "planned"],
    ]);
    expect(calls).toContainEqual({ table: "journeys", op: "eq", args: ["user_id", USER] });
    expect(calls).toContainEqual({ table: "journeys", op: "eq", args: ["status", "active"] });
    expect(calls).toContainEqual({ table: "schedule_sessions", op: "eq", args: ["user_id", USER] });
    expect(calls).toContainEqual({ table: "schedule_sessions", op: "eq", args: ["journey_id", JOURNEY] });
    expect(calls).toContainEqual({ table: "availability_slots", op: "eq", args: ["user_id", USER] });
    // Janela: da meia-noite de hoje em Brasília (03:00Z) por 7 dias.
    expect(calls).toContainEqual({ table: "schedule_sessions", op: "gte", args: ["starts_at", "2099-03-10T03:00:00.000Z"] });
    expect(calls).toContainEqual({ table: "schedule_sessions", op: "lt", args: ["starts_at", "2099-03-17T03:00:00.000Z"] });
    expect(v.deadlineAtRisk).toBe(false);
  });

  it("prazo em risco é recalculado com os pendentes e a disponibilidade", async () => {
    tables.journeys = { data: { id: JOURNEY, deadline: "2099-03-10" }, error: null };
    expect((await getScheduleView(USER)).deadlineAtRisk).toBe(true); // 1 horário até o prazo, 2 pendentes
    tables.content_progress = { data: [{ content_id: B }], error: null };
    expect((await getScheduleView(USER)).deadlineAtRisk).toBe(false); // B dominado: 1 pendente
  });

  it("erro de leitura lança", async () => {
    tables.availability_slots = { data: null, error: { message: "x" } };
    await expect(getScheduleView(USER)).rejects.toThrow();
  });
});
