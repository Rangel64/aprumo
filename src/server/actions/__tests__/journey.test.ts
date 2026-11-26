import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const JOURNEY = uuid(10);
const TRAIL = uuid(20);
const CREATED = "2099-03-10T15:00:00.123456+00:00";
const C1 = uuid(101);
const C2 = uuid(102);
const C3 = uuid(103);
const C4 = uuid(104);

type Err = { message: string } | null;
// Resposta por tabela: `list` (await direto), `one` (maybeSingle/single).
type Table = { list?: unknown[]; one?: unknown; error?: Err };
let tables: Record<string, Table> = {};
let currentUser: { id: string } | null = null;
let inserts: { table: string; rows: unknown }[] = [];
let deletes: { table: string; args: unknown[] }[] = [];
let touched: string[] = [];
let insertErrors: Record<string, Err> = {};
let deleteErrors: Record<string, Err> = {};
let updateErrors: Record<string, Err> = {};
let updates: { table: string; values: unknown; filters: unknown[][] }[] = [];

function builder(table: string) {
  const t = () => tables[table] ?? {};
  let mode: "read" | "insert" | "delete" | "update" = "read";
  const b: Record<string, unknown> = {};
  for (const op of ["select", "eq", "in", "order", "limit"]) b[op] = () => b;
  b.update = (values: unknown) => {
    mode = "update";
    updates.push({ table, values, filters: [] });
    return b;
  };
  for (const op of ["neq", "lt"]) {
    b[op] = (...args: unknown[]) => {
      updates.at(-1)?.filters.push([op, ...args]);
      return b;
    };
  }
  b.insert = (rows: unknown) => {
    mode = "insert";
    inserts.push({ table, rows });
    return b;
  };
  b.delete = () => {
    mode = "delete";
    return b;
  };
  const eqOriginal = b.eq as () => unknown;
  b.eq = (...args: unknown[]) => {
    if (mode === "delete") deletes.push({ table, args });
    if (mode === "update") updates.at(-1)?.filters.push(["eq", ...args]);
    return eqOriginal();
  };
  b.maybeSingle = async () => ({ data: t().one ?? null, error: t().error ?? null });
  b.single = async () => ({
    data: t().one ?? null,
    error: insertErrors[table] ?? t().error ?? null,
  });
  b.then = (resolve: (r: unknown) => unknown) =>
    resolve(
      mode === "insert"
        ? { data: null, error: insertErrors[table] ?? null }
        : mode === "delete"
          ? { data: null, error: deleteErrors[table] ?? null }
          : mode === "update"
            ? { data: null, error: updateErrors[table] ?? null }
            : { data: t().list ?? [], error: t().error ?? null },
    );
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from: (name: string) => {
      touched.push(name);
      return builder(name);
    },
  }),
}));

import { addContentsToJourney, createJourney } from "../journey";

// Relógio fixo: 2099-03-10 15:00Z = 10/03/2099 em Brasília.
const NOW = new Date("2099-03-10T15:00:00Z");
const valid = {
  base: { type: "contents", contentIds: [C1, C2] },
  goalDescription: "Dominar a coesão textual",
  deadline: "2099-03-11",
  methodology: "none",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  currentUser = { id: USER };
  inserts = [];
  deletes = [];
  touched = [];
  insertErrors = {};
  deleteErrors = {};
  updateErrors = {};
  updates = [];
  tables = {
    contents: { list: [{ id: C1 }, { id: C2 }, { id: C3 }, { id: C4 }] },
    journeys: { one: { id: JOURNEY, created_at: CREATED } },
    trails: { one: { id: TRAIL } },
    trail_contents: { list: [] },
    journey_contents: { list: [] },
  };
});

describe("createJourney", () => {
  it("base contents: insere Jornada ativa e conteúdos na ordem dos ids, added_from base", async () => {
    // Repetido (C1 duas vezes) é colapsado: posições 0 e 1.
    const res = await createJourney({
      ...valid,
      base: { type: "contents", contentIds: [C2, C1, C2] },
    });
    expect(res).toEqual({ ok: true, data: { journeyId: JOURNEY } });
    expect(inserts[0]).toEqual({
      table: "journeys",
      rows: {
        user_id: USER,
        base_type: "contents",
        trail_id: null,
        goal_description: "Dominar a coesão textual",
        deadline: "2099-03-11",
        methodology: "none",
        status: "active",
      },
    });
    expect(inserts[1]).toEqual({
      table: "journey_contents",
      rows: [
        { journey_id: JOURNEY, content_id: C2, position: 0, added_from: "base" },
        { journey_id: JOURNEY, content_id: C1, position: 1, added_from: "base" },
      ],
    });
    expect(touched).not.toContain("content_progress");
  });

  it("base trail: posições seguem a ordem da Trilha e trail_id é gravado", async () => {
    tables.trail_contents = {
      list: [
        { content_id: C3, position: 0 },
        { content_id: C1, position: 1 },
      ],
    };
    const res = await createJourney({
      ...valid,
      base: { type: "trail", trailId: TRAIL },
    });
    expect(res.ok).toBe(true);
    expect(inserts[0].rows).toMatchObject({ base_type: "trail", trail_id: TRAIL });
    expect(inserts[1].rows).toEqual([
      { journey_id: JOURNEY, content_id: C3, position: 0, added_from: "base" },
      { journey_id: JOURNEY, content_id: C1, position: 1, added_from: "base" },
    ]);
  });

  it("meta curta (2 caracteres) falha em goalDescription sem tocar no banco", async () => {
    const res = await createJourney({ ...valid, goalDescription: "ab" });
    expect(res).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(touched).toEqual([]);
  });

  it("meta longa (201 caracteres) é recusada", async () => {
    const res = await createJourney({ ...valid, goalDescription: "x".repeat(201) });
    expect(res).toMatchObject({ ok: false, error: { code: "VALIDATION", field: "goalDescription" } });
  });

  it("prazo igual a hoje (Brasília) é recusado; no passado também", async () => {
    for (const deadline of ["2099-03-10", "2000-01-01"]) {
      const res = await createJourney({ ...valid, deadline });
      expect(res).toMatchObject({ ok: false, error: { code: "VALIDATION", field: "deadline" } });
    }
    expect(touched).toEqual([]);
  });

  it("usa o dia de Brasília: 11/03 02:00Z ainda é 10/03, então prazo 2099-03-11 vale", async () => {
    vi.setSystemTime(new Date("2099-03-11T02:00:00Z")); // 10/03 23:00 em Brasília
    expect((await createJourney(valid)).ok).toBe(true);
  });

  it("base inválida (trilha sem uuid, contents vazio, tipo desconhecido) é VALIDATION", async () => {
    for (const base of [
      { type: "trail", trailId: "abc" },
      { type: "contents", contentIds: [] },
      { type: "outra" },
    ]) {
      const res = await createJourney({ ...valid, base });
      expect(res).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    }
  });

  it("metodologia diferente de none é recusada", async () => {
    const res = await createJourney({ ...valid, methodology: "pomodoro" });
    expect(res).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("sem sessão: UNAUTHENTICATED e nada é inserido", async () => {
    currentUser = null;
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(inserts).toEqual([]);
  });

  it("Trilha inexistente ou vazia: NOT_FOUND", async () => {
    tables.trails = { one: null };
    const res = await createJourney({ ...valid, base: { type: "trail", trailId: TRAIL } });
    expect(res).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    tables.trails = { one: { id: TRAIL } };
    const empty = await createJourney({ ...valid, base: { type: "trail", trailId: TRAIL } });
    expect(empty).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(inserts).toEqual([]);
  });

  it("conteúdo inexistente: NOT_FOUND sem inserir", async () => {
    tables.contents = { list: [{ id: C1 }] }; // C2 não existe
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(inserts).toEqual([]);
  });

  it("falha ao inserir os conteúdos desfaz a Jornada e retorna INTERNAL", async () => {
    insertErrors.journey_contents = { message: "segredo interno" };
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(JSON.stringify(res)).not.toContain("segredo");
    expect(deletes).toContainEqual({ table: "journeys", args: ["id", JOURNEY] });
  });

  it("rollback também falhando: INTERNAL e console.error genérico sem dados do aluno", async () => {
    insertErrors.journey_contents = { message: "segredo interno" };
    deleteErrors.journeys = { message: "delete falhou" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(spy.mock.calls);
    for (const secret of [USER, JOURNEY, C1, C2, "segredo", "delete falhou"]) {
      expect(logged).not.toContain(secret);
    }
    spy.mockRestore();
  });

  it("D-060: arquiva as outras ativas do próprio aluno, excluindo a recém-criada", async () => {
    const res = await createJourney(valid);
    expect(res.ok).toBe(true);
    // Exatamente um UPDATE, em journeys, só status; filtros: user_id da sessão (não de outro
    // usuário), apenas ativas, a nova (JOURNEY) excluída e só as MAIS ANTIGAS que ela.
    expect(updates).toEqual([
      {
        table: "journeys",
        values: { status: "archived" },
        filters: [
          ["eq", "user_id", USER],
          ["eq", "status", "active"],
          ["neq", "id", JOURNEY],
          ["lt", "created_at", CREATED],
        ],
      },
    ]);
    expect(deletes).toEqual([]);
  });

  it("D-060: duas criações intercaladas: cada UPDATE só atinge created_at menor que o da própria nova", async () => {
    const OLDER = "2099-03-10T15:00:00.000001+00:00";
    const NEWER = "2099-03-10T15:00:00.000002+00:00";
    const A = uuid(11);
    const B = uuid(12);
    tables.journeys = { one: { id: A, created_at: OLDER } };
    await createJourney(valid);
    tables.journeys = { one: { id: B, created_at: NEWER } };
    await createJourney(valid);
    // Simula o banco: aplica cada UPDATE às duas ativas (A e B) e vê quem sobra.
    const rows = [
      { id: A, created_at: OLDER, status: "active" },
      { id: B, created_at: NEWER, status: "active" },
    ];
    for (const u of updates) {
      const neq = u.filters.find((f) => f[0] === "neq")![2] as string;
      const lt = u.filters.find((f) => f[0] === "lt")![2] as string;
      for (const r of rows) if (r.id !== neq && r.created_at < lt) r.status = "archived";
    }
    // A (mais antiga) é arquivada; B (mais nova) nunca é; sempre resta uma ativa.
    expect(rows.find((r) => r.id === A)!.status).toBe("archived");
    expect(rows.find((r) => r.id === B)!.status).toBe("active");
  });

  it("D-060: falha no arquivamento desfaz a Jornada nova e retorna INTERNAL sem dados pessoais", async () => {
    updateErrors.journeys = { message: "segredo interno" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(JSON.stringify(res)).not.toContain("segredo");
    expect(deletes).toContainEqual({ table: "journeys", args: ["id", JOURNEY] });
    expect(spy).not.toHaveBeenCalled(); // rollback ok: nada a logar
    expect(touched).not.toContain("content_progress");
    spy.mockRestore();
  });

  it("D-060: arquivamento e rollback falhando: log genérico sem dados do aluno", async () => {
    updateErrors.journeys = { message: "segredo interno" };
    deleteErrors.journeys = { message: "delete falhou" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(spy.mock.calls);
    for (const secret of [USER, JOURNEY, C1, C2, "segredo", "delete falhou"]) {
      expect(logged).not.toContain(secret);
    }
    spy.mockRestore();
  });

  it("falha na inserção dos conteúdos não arquiva nada", async () => {
    insertErrors.journey_contents = { message: "x" };
    await createJourney(valid);
    expect(updates).toEqual([]);
  });

  it("uuid inválido na base: VALIDATION com mensagem pt-BR genérica", async () => {
    const res = await createJourney({ ...valid, base: { type: "trail", trailId: "abc" } });
    expect(res).toEqual({
      ok: false,
      error: expect.objectContaining({
        code: "VALIDATION",
        message: "Confira os dados da Jornada e tente de novo.",
      }),
    });
  });

  it("Trilha sem conteúdos: NOT_FOUND com mensagem própria", async () => {
    const res = await createJourney({ ...valid, base: { type: "trail", trailId: TRAIL } });
    expect(res).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND", message: "Esta Trilha não tem conteúdos.", field: "base" },
    });
  });

  it("falha ao inserir a Jornada: INTERNAL sem inserir conteúdos", async () => {
    insertErrors.journeys = { message: "x" };
    const res = await createJourney(valid);
    expect(res).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(inserts.map((i) => i.table)).toEqual(["journeys"]);
  });
});

describe("addContentsToJourney", () => {
  it("acrescenta na posição seguinte com added_from = source e ignora repetidos", async () => {
    // Já na Jornada: C1 (posição 0) e C2 (posição 4). Próxima posição = 5.
    tables.journey_contents = {
      list: [
        { content_id: C1, position: 0 },
        { content_id: C2, position: 4 },
      ],
    };
    // C1 já existe (ignorado); C3 e C4 entram; C3 repetido na entrada conta uma vez.
    const res = await addContentsToJourney({
      contentIds: [C1, C3, C3, C4],
      source: "essay_suggestion",
    });
    expect(res).toEqual({ ok: true, data: { journeyId: JOURNEY, added: 2 } });
    expect(inserts).toEqual([
      {
        table: "journey_contents",
        rows: [
          { journey_id: JOURNEY, content_id: C3, position: 5, added_from: "essay_suggestion" },
          { journey_id: JOURNEY, content_id: C4, position: 6, added_from: "essay_suggestion" },
        ],
      },
    ]);
  });

  it("Jornada vazia começa em 0; source map", async () => {
    const res = await addContentsToJourney({ contentIds: [C3], source: "map" });
    expect(res).toEqual({ ok: true, data: { journeyId: JOURNEY, added: 1 } });
    expect(inserts[0].rows).toEqual([
      { journey_id: JOURNEY, content_id: C3, position: 0, added_from: "map" },
    ]);
  });

  it("só repetidos: added 0 e nenhuma escrita", async () => {
    tables.journey_contents = { list: [{ content_id: C1, position: 0 }] };
    const res = await addContentsToJourney({ contentIds: [C1], source: "map" });
    expect(res).toEqual({ ok: true, data: { journeyId: JOURNEY, added: 0 } });
    expect(inserts).toEqual([]);
  });

  it("sem Jornada ativa: NO_ACTIVE_JOURNEY e nada é escrito", async () => {
    tables.journeys = { one: null };
    const res = await addContentsToJourney({ contentIds: [C1], source: "map" });
    expect(res).toMatchObject({ ok: false, error: { code: "NO_ACTIVE_JOURNEY" } });
    expect(inserts).toEqual([]);
  });

  it("conteúdo inexistente: NOT_FOUND", async () => {
    tables.contents = { list: [{ id: C1 }] };
    const res = await addContentsToJourney({ contentIds: [C1, C3], source: "map" });
    expect(res).toMatchObject({ ok: false, error: { code: "NOT_FOUND", field: "contentIds" } });
    expect(inserts).toEqual([]);
  });

  it("entrada inválida (vazia, uuid ruim, source desconhecido): VALIDATION", async () => {
    for (const input of [
      { contentIds: [], source: "map" },
      { contentIds: ["x"], source: "map" },
      { contentIds: [C1], source: "base" },
    ]) {
      expect(await addContentsToJourney(input)).toMatchObject({
        ok: false,
        error: { code: "VALIDATION" },
      });
    }
    expect(touched).toEqual([]);
  });

  it("sem sessão: UNAUTHENTICATED", async () => {
    currentUser = null;
    const res = await addContentsToJourney({ contentIds: [C1], source: "map" });
    expect(res).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("nunca escreve em content_progress", async () => {
    await addContentsToJourney({ contentIds: [C3], source: "map" });
    await createJourney(valid);
    expect(touched).not.toContain("content_progress");
  });
});
