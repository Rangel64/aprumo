import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const OTHER = uuid(2);
const JOURNEY = uuid(10);
const C1 = uuid(101);
const C2 = uuid(102);
const C3 = uuid(103);

type Err = { message: string } | null;
type Call = { table: string; op: string; args: unknown[] };
let calls: Call[] = [];
let reads: Record<string, { data: unknown; error: Err }> = {};
let writeErrors: Record<string, Err> = {}; // chave: `${table}.${insert|delete}`
let currentUser: { id: string } | null = null;

// Store em memória opcional para schedule_sessions (simula o banco; filtros aplicados de verdade).
type Row = { id: string; user_id: string; journey_id: string; status: string; starts_at: string };
let store: Row[] | null = null;
let insertGate: ((n: number) => Promise<void>) | null = null; // permite intercalar execuções
let insertCount = 0;
let deleteCount: Record<string, number> = {};

function matches(row: Row, filters: { op: string; args: unknown[] }[]) {
  return filters.every(({ op, args }) => {
    const [col, a, b] = args as [keyof Row, unknown, unknown];
    if (op === "eq") return row[col] === a;
    if (op === "gt") return new Date(row[col]).getTime() > new Date(a as string).getTime();
    if (op === "in") return (a as string[]).includes(row[col]);
    if (op === "not" && a === "in") return !(b as string).slice(1, -1).split(",").includes(row[col]);
    return true;
  });
}

function builder(table: string) {
  let mode = "read";
  let inserted: Row[] = [];
  const filters: { op: string; args: unknown[] }[] = [];
  const b: Record<string, unknown> = {};
  const rec = (op: string) => (...args: unknown[]) => {
    calls.push({ table, op, args });
    if (op === "insert") {
      mode = op;
      inserted = args[0] as Row[];
    } else if (op === "delete") mode = op;
    else if (["eq", "in", "gt", "not"].includes(op)) filters.push({ op, args });
    return b;
  };
  for (const op of ["select", "eq", "in", "not", "gt", "order", "insert", "delete"]) b[op] = rec(op);
  b.maybeSingle = async () => {
    const r = reads[table] ?? { data: null, error: null };
    return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error };
  };
  const run = async () => {
    const useStore = store !== null && table === "schedule_sessions";
    if (mode === "read") {
      if (useStore) return { data: store!.filter((r) => matches(r, filters)).map((r) => ({ id: r.id })), error: null };
      return reads[table] ?? { data: [], error: null };
    }
    let n = 0;
    if (mode === "insert") {
      n = ++insertCount;
      if (insertGate) await insertGate(n);
    } else {
      deleteCount[table] = (deleteCount[table] ?? 0) + 1;
      n = deleteCount[table];
    }
    const error = writeErrors[`${table}.${mode}#${n}`] ?? writeErrors[`${table}.${mode}`] ?? null;
    if (!error && useStore) {
      if (mode === "insert") store!.push(...inserted);
      else store = store!.filter((r) => !matches(r, filters));
    }
    return { data: null, error };
  };
  b.then = (resolve: (r: unknown) => unknown, reject: (e: unknown) => unknown) => run().then(resolve, reject);
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from: (t: string) => {
      calls.push({ table: t, op: "from", args: [] });
      return builder(t);
    },
  }),
}));

import { generateSchedule, saveAvailability } from "../schedule";

const slot = (weekday: number, startTime: string, minutes = 30) => ({ weekday, startTime, minutes });
const writes = (table: string, op: string) => calls.filter((c) => c.table === table && c.op === op);

beforeEach(() => {
  vi.useFakeTimers();
  // 2099-03-10 (terça) 09:00 em Brasília
  vi.setSystemTime(new Date("2099-03-10T12:00:00Z"));
  calls = [];
  writeErrors = {};
  store = null;
  insertGate = null;
  insertCount = 0;
  deleteCount = {};
  currentUser = { id: USER };
  reads = {};
});

describe("saveAvailability", () => {
  beforeEach(() => {
    reads.availability_slots = { data: [{ id: uuid(900) }], error: null };
  });

  it("não autenticado: UNAUTHENTICATED e nenhuma escrita", async () => {
    currentUser = null;
    const r = await saveAvailability({ slots: [slot(1, "08:00")] });
    expect(r).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(writes("availability_slots", "insert")).toHaveLength(0);
  });

  it.each([
    ["vazio", { slots: [] }],
    ["weekday 7", { slots: [slot(7, "08:00")] }],
    ["hora inválida", { slots: [slot(1, "8h")] }],
    ["minutes 10", { slots: [slot(1, "08:00", 10)] }],
    ["minutes 241", { slots: [slot(1, "08:00", 241)] }],
    ["duplicado", { slots: [slot(1, "08:00"), slot(1, "08:00", 60)] }],
  ])("rejeita %s", async (_n, input) => {
    expect(await saveAvailability(input)).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(calls).toHaveLength(0);
  });

  it("substitui: insere os novos com user_id da sessão e apaga só os antigos; retorna count", async () => {
    const r = await saveAvailability({ slots: [slot(1, "08:00"), slot(3, "19:00", 90)], user_id: OTHER });
    expect(r).toEqual({ ok: true, data: { count: 2 } });
    const rows = writes("availability_slots", "insert")[0].args[0] as { user_id: string }[];
    expect(rows).toHaveLength(2);
    expect(rows.every((x) => x.user_id === USER)).toBe(true);
    expect(JSON.stringify(calls)).not.toContain(OTHER);
    expect(writes("availability_slots", "in")[0].args).toEqual(["id", [uuid(900)]]);
    // Ordem segura: insere antes de apagar.
    expect(calls.findIndex((c) => c.op === "insert")).toBeLessThan(calls.findIndex((c) => c.op === "delete"));
  });

  it("insert falha: não apaga a disponibilidade antiga", async () => {
    writeErrors["availability_slots.insert"] = { message: "x" };
    expect(await saveAvailability({ slots: [slot(1, "08:00")] })).toMatchObject({
      ok: false,
      error: { code: "INTERNAL" },
    });
    expect(writes("availability_slots", "delete")).toHaveLength(0);
  });

  it("apagar antigos falha: desfaz os novos", async () => {
    writeErrors["availability_slots.delete"] = { message: "x" };
    const r = await saveAvailability({ slots: [slot(1, "08:00")] });
    expect(r).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(writes("availability_slots", "delete")).toHaveLength(2);
  });
});

describe("generateSchedule", () => {
  beforeEach(() => {
    reads.journeys = { data: { id: JOURNEY, status: "active", deadline: "2099-03-31" }, error: null };
    reads.journey_contents = {
      data: [
        { content_id: C2, position: 1 },
        { content_id: C1, position: 0 },
        { content_id: C3, position: 2 },
      ],
      error: null,
    };
    reads.content_progress = { data: [{ content_id: C3 }], error: null }; // C3 dominado
    reads.availability_slots = {
      data: [{ weekday: 2, start_time: "19:00:00", minutes: 60 }],
      error: null,
    };
    reads.schedule_sessions = { data: [{ id: uuid(800) }], error: null };
  });

  it("valida a entrada e a sessão", async () => {
    expect(await generateSchedule({ journeyId: "x" })).toMatchObject({ error: { code: "VALIDATION" } });
    currentUser = null;
    expect(await generateSchedule({ journeyId: JOURNEY })).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("Jornada de outro aluno ou inexistente: NOT_FOUND, sem escrita (filtra por user_id da sessão)", async () => {
    reads.journeys = { data: null, error: null };
    expect(await generateSchedule({ journeyId: JOURNEY, userId: OTHER })).toMatchObject({
      error: { code: "NOT_FOUND" },
    });
    expect(calls.filter((c) => c.op === "insert" || c.op === "delete")).toHaveLength(0);
    expect(calls).toContainEqual({ table: "journeys", op: "eq", args: ["user_id", USER] });
  });

  it("Jornada arquivada: NO_ACTIVE_JOURNEY", async () => {
    reads.journeys = { data: { id: JOURNEY, status: "archived", deadline: "2099-03-31" }, error: null };
    expect(await generateSchedule({ journeyId: JOURNEY })).toMatchObject({
      error: { code: "NO_ACTIVE_JOURNEY" },
    });
  });

  it("sem disponibilidade: VALIDATION no campo slots, sem escrita", async () => {
    reads.availability_slots = { data: [], error: null };
    const r = await generateSchedule({ journeyId: JOURNEY });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION", field: "slots" } });
    expect(calls.filter((c) => c.op === "insert" || c.op === "delete")).toHaveLength(0);
  });

  it("gera 1 sessão por pendente na ordem da Jornada, sem dominados; substitui só planned futuras", async () => {
    const r = await generateSchedule({ journeyId: JOURNEY });
    // Pendentes: C1 (pos 0), C2 (pos 1); C3 dominado. Ter 10 19:00 e ter 17 19:00; prazo 31/03.
    expect(r).toEqual({ ok: true, data: { sessionsCount: 2, deadlineAtRisk: false } });
    const rows = writes("schedule_sessions", "insert")[0].args[0] as Record<string, unknown>[];
    expect(rows.map((x) => [x.content_id, x.starts_at, x.minutes, x.status])).toEqual([
      [C1, "2099-03-10T19:00:00-03:00", 60, "planned"],
      [C2, "2099-03-17T19:00:00-03:00", 60, "planned"],
    ]);
    expect(rows.every((x) => x.user_id === USER && x.journey_id === JOURNEY)).toBe(true);
    // Só planejadas futuras da Jornada do aluno.
    expect(calls).toContainEqual({ table: "schedule_sessions", op: "eq", args: ["status", "planned"] });
    expect(calls).toContainEqual({ table: "schedule_sessions", op: "eq", args: ["journey_id", JOURNEY] });
    expect(calls).toContainEqual({
      table: "schedule_sessions",
      op: "gt",
      args: ["starts_at", "2099-03-10T12:00:00.000Z"],
    });
    expect(writes("schedule_sessions", "in")[0].args).toEqual(["id", [uuid(800)]]);
    expect(calls.findIndex((c) => c.op === "insert")).toBeLessThan(calls.findIndex((c) => c.op === "delete"));
  });

  it("nunca escreve em content_progress", async () => {
    await generateSchedule({ journeyId: JOURNEY });
    expect(calls.filter((c) => c.table === "content_progress" && ["insert", "delete", "update", "upsert"].includes(c.op))).toHaveLength(0);
  });

  it("prazo curto: deadlineAtRisk true e sessões geradas", async () => {
    reads.journeys = { data: { id: JOURNEY, status: "active", deadline: "2099-03-10" }, error: null };
    expect(await generateSchedule({ journeyId: JOURNEY })).toEqual({
      ok: true,
      data: { sessionsCount: 2, deadlineAtRisk: true },
    });
  });

  it("insert falha: não apaga as antigas", async () => {
    writeErrors["schedule_sessions.insert"] = { message: "x" };
    expect(await generateSchedule({ journeyId: JOURNEY })).toMatchObject({ error: { code: "INTERNAL" } });
    expect(writes("schedule_sessions", "delete")).toHaveLength(0);
  });

  it("apagar antigas falha: remove as novas e reporta erro", async () => {
    writeErrors["schedule_sessions.delete"] = { message: "x" };
    expect(await generateSchedule({ journeyId: JOURNEY })).toMatchObject({ error: { code: "INTERNAL" } });
    expect(writes("schedule_sessions", "delete")).toHaveLength(2);
  });

  it("tudo dominado: apaga futuras e retorna 0 sem risco", async () => {
    reads.content_progress = { data: [{ content_id: C1 }, { content_id: C2 }, { content_id: C3 }], error: null };
    expect(await generateSchedule({ journeyId: JOURNEY })).toEqual({
      ok: true,
      data: { sessionsCount: 0, deadlineAtRisk: false },
    });
    expect(writes("schedule_sessions", "insert")).toHaveLength(0);
    expect(writes("schedule_sessions", "delete")).toHaveLength(1); // só as antigas
    expect(writes("schedule_sessions", "in")[0].args).toEqual(["id", [uuid(800)]]);
  });

  describe("com banco em memória", () => {
    const row = (n: number, o: Partial<Row> = {}): Row => ({
      id: uuid(n),
      user_id: USER,
      journey_id: JOURNEY,
      status: "planned",
      starts_at: "2099-04-01T22:00:00Z", // futuro em relação a 2099-03-10
      ...o,
    });
    const ids = () => store!.map((r) => r.id);

    it("nunca atinge done, passadas, de outra Jornada ou de outro aluno", async () => {
      const keep = [
        row(701, { status: "done" }), // concluída futura
        row(702, { starts_at: "2099-03-01T22:00:00Z" }), // passada
        row(703, { journey_id: uuid(11) }), // outra Jornada
        row(704, { user_id: OTHER }), // outro aluno
      ];
      store = [row(800), row(801), ...keep];
      expect(await generateSchedule({ journeyId: JOURNEY })).toMatchObject({ ok: true });
      for (const k of keep) expect(ids()).toContain(k.id);
      expect(ids()).not.toContain(uuid(800));
      expect(ids()).not.toContain(uuid(801));
      // 4 preservadas + 2 novas (C1, C2).
      expect(store).toHaveLength(6);
    });

    it("duas regerações intercaladas: nunca zero sessões (podem sobrar duas cópias); protegidas intactas", async () => {
      const keep = [
        row(701, { status: "done" }),
        row(702, { starts_at: "2099-03-01T22:00:00Z" }),
        row(703, { journey_id: uuid(11) }),
        row(704, { user_id: OTHER }),
      ];
      store = [row(800), ...keep];
      // B só insere depois de A terminar tudo (B leu os mesmos oldIds antes).
      let releaseB!: () => void;
      const bGo = new Promise<void>((res) => (releaseB = res));
      insertGate = async (n) => {
        if (n === 2) await bGo;
      };
      const a = generateSchedule({ journeyId: JOURNEY });
      const b = generateSchedule({ journeyId: JOURNEY });
      expect(await a).toMatchObject({ ok: true });
      const mine = () =>
        store!.filter((r) => r.status === "planned" && r.user_id === USER && r.journey_id === JOURNEY && r.starts_at > "2099-03-10T12");
      expect(mine()).toHaveLength(2); // conjunto de A (C1, C2); o antigo 800 saiu
      releaseB();
      expect(await b).toMatchObject({ ok: true });
      // Os dois deletes removem só o oldId 800: 2 conjuntos x 2 sessões = 4 cópias, nunca zero.
      expect(mine()).toHaveLength(4);
      expect(ids()).not.toContain(uuid(800));
      for (const k of keep) expect(ids()).toContain(k.id);
      // A próxima regeração apaga as cópias como oldIds: volta a um conjunto.
      expect(await generateSchedule({ journeyId: JOURNEY })).toMatchObject({ ok: true });
      expect(mine()).toHaveLength(2);
      for (const k of keep) expect(ids()).toContain(k.id);
    });
  });
});
