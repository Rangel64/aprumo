import { beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: unknown };
let tables: Record<string, Result> = {};
let calls: { table: string; op: string; args: unknown[] }[] = [];

// Só leitura existe no builder: qualquer escrita lançaria TypeError.
function builder(table: string) {
  const b: Record<string, unknown> = {};
  for (const op of ["select", "eq", "order", "limit"]) {
    b[op] = (...args: unknown[]) => {
      calls.push({ table, op, args });
      return b;
    };
  }
  b.maybeSingle = async () => {
    const r = tables[table] ?? { data: null, error: null };
    return { data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data, error: r.error };
  };
  b.then = (resolve: (r: Result) => unknown) =>
    resolve(tables[table] ?? { data: [], error: null });
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: (t: string) => builder(t) }),
}));

import { getActiveJourney } from "../journey";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const JOURNEY = uuid(10);
const A = uuid(101);
const B = uuid(102);
const C = uuid(103);

beforeEach(() => {
  calls = [];
  tables = {
    journeys: {
      data: { id: JOURNEY, goal_description: "Dominar coesão", deadline: "2099-12-31" },
      error: null,
    },
    // Fora de ordem de propósito: a query ordena por posição.
    journey_contents: {
      data: [
        { position: 2, contents: { id: C, slug: "c", title: "C" } },
        { position: 0, contents: { id: A, slug: "a", title: "A" } },
        { position: 1, contents: [{ id: B, slug: "b", title: "B" }] },
      ],
      error: null,
    },
    content_progress: { data: [], error: null },
  };
});

describe("getActiveJourney", () => {
  it("sem Jornada ativa devolve null (e não lê conteúdos)", async () => {
    tables.journeys = { data: null, error: null };
    expect(await getActiveJourney(USER)).toBeNull();
    expect(calls.map((c) => c.table)).not.toContain("journey_contents");
  });

  it("filtra a Jornada pelo usuário e por status active", async () => {
    await getActiveJourney(USER);
    expect(calls).toContainEqual({ table: "journeys", op: "eq", args: ["user_id", USER] });
    expect(calls).toContainEqual({ table: "journeys", op: "eq", args: ["status", "active"] });
    expect(calls).toContainEqual({ table: "content_progress", op: "eq", args: ["user_id", USER] });
  });

  it("nada iniciado: todos not_started, próximo é o primeiro por posição", async () => {
    expect(await getActiveJourney(USER)).toEqual({
      id: JOURNEY,
      goalDescription: "Dominar coesão",
      deadline: "2099-12-31",
      contents: [
        { id: A, slug: "a", title: "A", status: "not_started", position: 0 },
        { id: B, slug: "b", title: "B", status: "not_started", position: 1 },
        { id: C, slug: "c", title: "C", status: "not_started", position: 2 },
      ],
      nextContentSlug: "a",
      masteredCount: 0,
      total: 3,
    });
  });

  it("estados mistos: A dominado, B estudando; próximo é B, masteredCount 1, total 3", async () => {
    tables.content_progress = {
      data: [
        { content_id: A, status: "mastered" },
        { content_id: B, status: "studying" },
      ],
      error: null,
    };
    const view = await getActiveJourney(USER);
    expect(view?.contents.map((c) => c.status)).toEqual(["mastered", "studying", "not_started"]);
    expect(view?.nextContentSlug).toBe("b");
    expect(view?.masteredCount).toBe(1);
    expect(view?.total).toBe(3);
  });

  it("o primeiro não dominado vale mesmo com um dominado depois dele", async () => {
    tables.content_progress = { data: [{ content_id: C, status: "mastered" }], error: null };
    const view = await getActiveJourney(USER);
    expect(view?.nextContentSlug).toBe("a");
    expect(view?.masteredCount).toBe(1);
  });

  it("tudo dominado: nextContentSlug null", async () => {
    tables.content_progress = {
      data: [A, B, C].map((id) => ({ content_id: id, status: "mastered" })),
      error: null,
    };
    const view = await getActiveJourney(USER);
    expect(view?.nextContentSlug).toBeNull();
    expect(view?.masteredCount).toBe(3);
  });

  it("Jornada sem conteúdos: total 0 e próximo null; status desconhecido vira not_started", async () => {
    tables.journey_contents = { data: [], error: null };
    expect(await getActiveJourney(USER)).toMatchObject({
      contents: [],
      nextContentSlug: null,
      masteredCount: 0,
      total: 0,
    });
    tables.journey_contents = {
      data: [{ position: 0, contents: { id: A, slug: "a", title: "A" } }],
      error: null,
    };
    tables.content_progress = { data: [{ content_id: A, status: "xyz" }], error: null };
    expect((await getActiveJourney(USER))?.contents[0].status).toBe("not_started");
  });

  it("erro de leitura lança sem vazar detalhes", async () => {
    tables.journey_contents = { data: null, error: { message: "segredo interno" } };
    await expect(getActiveJourney(USER)).rejects.toThrow("Falha ao carregar a Jornada.");
  });
});
