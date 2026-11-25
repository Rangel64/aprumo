import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco de mentira: cada tabela devolve as linhas configuradas; só leitura existe no builder
// (qualquer insert/update/upsert/delete lançaria TypeError e derrubaria o teste).
type Result = { data: unknown; error: unknown };
let tables: Record<string, Result> = {};
let calls: { table: string; op: string; args: unknown[] }[] = [];

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
  b.then = (resolve: (r: Result) => unknown) =>
    resolve(tables[table] ?? { data: [], error: null });
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: (t: string) => builder(t) }),
}));
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

import { getMapTrails, getMapView } from "../map";
import { getTrail } from "../trail";

const USER = "00000000-0000-4000-8000-000000000001";
const TRAIL = "00000000-0000-4000-8000-0000000000a1";
const A = "00000000-0000-4000-8000-0000000000c1";
const B = "00000000-0000-4000-8000-0000000000c2";
// 2099-06-15T02:30Z = 14/06 23:30 em Brasília: o dia vai de 14/06 03:00Z a 15/06 03:00Z.
const NOW = new Date("2099-06-15T02:30:00Z");

beforeEach(() => {
  calls = [];
  notFound.mockClear();
  tables = {
    contents: {
      data: [
        { id: A, slug: "a", title: "A", pos_x: 0, pos_y: 5, sort: 1 },
        { id: B, slug: "b", title: "B", pos_x: 280, pos_y: -5, sort: 2 },
      ],
      error: null,
    },
    content_edges: {
      data: [
        { from_id: A, to_id: B, kind: "prerequisite" },
        { from_id: B, to_id: A, kind: "related" },
        { from_id: A, to_id: B, kind: "outro" },
      ],
      error: null,
    },
    content_progress: { data: [{ content_id: A, status: "mastered" }], error: null },
    trail_contents: {
      data: [
        { trail_id: TRAIL, content_id: A },
        { trail_id: TRAIL, content_id: B },
      ],
      error: null,
    },
    competency_contents: {
      data: [
        { competency: 3, content_id: A },
        { competency: 2, content_id: A },
      ],
      error: null,
    },
    flashcard_states: { data: [{ flashcards: { content_id: A } }], error: null },
    trails: { data: [{ id: TRAIL, slug: "enem-redacao", name: "ENEM: Redação" }], error: null },
  };
});

describe("getMapView", () => {
  it("monta nós (estado, posição, Trilhas, competências, reviewedToday) e arestas válidas", async () => {
    const view = await getMapView(USER, NOW);
    expect(view.nodes).toEqual([
      {
        id: A,
        slug: "a",
        title: "A",
        status: "mastered",
        reviewedToday: true,
        position: { x: 0, y: 5 },
        trailIds: [TRAIL],
        competencies: [2, 3],
      },
      {
        id: B,
        slug: "b",
        title: "B",
        status: "not_started",
        reviewedToday: false,
        position: { x: 280, y: -5 },
        trailIds: [TRAIL],
        competencies: [],
      },
    ]);
    // A terceira aresta tem kind desconhecido e é descartada.
    expect(view.edges).toEqual([
      { from: A, to: B, kind: "prerequisite" },
      { from: B, to: A, kind: "related" },
    ]);
  });

  it("filtra progresso e revisão pelo usuário e a revisão pelo dia de Brasília", async () => {
    await getMapView(USER, NOW);
    expect(calls).toContainEqual({ table: "content_progress", op: "eq", args: ["user_id", USER] });
    expect(calls).toContainEqual({ table: "flashcard_states", op: "eq", args: ["user_id", USER] });
    expect(calls).toContainEqual({
      table: "flashcard_states",
      op: "gte",
      args: ["reviewed_at", "2099-06-14T03:00:00.000Z"],
    });
    expect(calls).toContainEqual({
      table: "flashcard_states",
      op: "lt",
      args: ["reviewed_at", "2099-06-15T03:00:00.000Z"],
    });
  });

  it("aceita flashcards como lista (embed) e ignora status desconhecido", async () => {
    tables.flashcard_states = { data: [{ flashcards: [{ content_id: B }] }], error: null };
    tables.content_progress = { data: [{ content_id: A, status: "xyz" }], error: null };
    const view = await getMapView(USER, NOW);
    expect(view.nodes.map((n) => [n.status, n.reviewedToday])).toEqual([
      ["not_started", false],
      ["not_started", true],
    ]);
  });

  it("erro de leitura lança sem vazar detalhes", async () => {
    tables.content_edges = { data: null, error: { message: "segredo interno" } };
    await expect(getMapView(USER, NOW)).rejects.toThrow("Falha ao carregar o Mapa.");
  });
});

describe("getMapTrails", () => {
  it("conta os conteúdos de cada Trilha", async () => {
    expect(await getMapTrails()).toEqual([
      { id: TRAIL, slug: "enem-redacao", name: "ENEM: Redação", contentCount: 2 },
    ]);
  });
});

describe("getTrail", () => {
  it("devolve a Trilha da plataforma com os conteúdos em ordem", async () => {
    tables.trails = {
      data: [{ id: TRAIL, slug: "enem-redacao", name: "ENEM: Redação", objective: "Objetivo." }],
      error: null,
    };
    tables.trail_contents = {
      data: [
        { position: 0, contents: { id: A, slug: "a", title: "A" } },
        { position: 1, contents: [{ id: B, slug: "b", title: "B" }] },
        { position: 2, contents: null },
      ],
      error: null,
    };
    const trail = await getTrail("enem-redacao");
    expect(trail).toEqual({
      id: TRAIL,
      slug: "enem-redacao",
      name: "ENEM: Redação",
      objective: "Objetivo.",
      origin: "platform",
      contents: [
        { id: A, slug: "a", title: "A" },
        { id: B, slug: "b", title: "B" },
      ],
    });
  });

  it("slug inexistente chama notFound()", async () => {
    tables.trails = { data: null, error: null };
    await expect(getTrail("nao-existe")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("erro de leitura lança", async () => {
    tables.trails = { data: null, error: { message: "x" } };
    await expect(getTrail("x")).rejects.toThrow("Falha ao carregar a Trilha.");
  });
});
