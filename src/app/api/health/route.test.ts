import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Result = { data: unknown; error: unknown };
let configResult: Result;
let usageRows: { cost_usd: unknown }[];
let usageError: unknown;
let ranges: [number, number][];
let orFilters: string[];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "app_config") {
        return { select: () => ({ in: () => Promise.resolve(configResult) }) };
      }
      // ai_usage: select().or().order().range() paginado.
      const chain = {
        select: () => chain,
        or: (f: string) => {
          orFilters.push(f);
          return chain;
        },
        order: () => chain,
        range: (from: number, to: number) => {
          ranges.push([from, to]);
          if (usageError) return Promise.resolve({ data: null, error: usageError });
          return Promise.resolve({ data: usageRows.slice(from, to + 1), error: null });
        },
      };
      return chain;
    },
  }),
}));

import { GET } from "./route";

const config = (ai_enabled: unknown, budget: unknown) => ({
  data: [
    { key: "ai_enabled", value: ai_enabled },
    ...(budget === undefined ? [] : [{ key: "ai_global_budget_usd", value: budget }]),
  ],
  error: null,
});

beforeEach(() => {
  configResult = config(true, 10);
  usageRows = [{ cost_usd: 1.5 }, { cost_usd: "0.25" }];
  usageError = null;
  ranges = [];
  orFilters = [];
  process.env.VERCEL_GIT_COMMIT_SHA = "abc123";
});

describe("GET /api/health", () => {
  it("retorna 200 com status, db, ai e commit", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["ai", "commit", "db", "status"]);
    expect(body.db).toBe("ok");
    expect(body.commit).toBe("abc123");
    expect(body.ai.enabled).toBe(true);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("calcula o orçamento restante: 10 - (1.5 + 0.25) = 8.25", async () => {
    const body = await (await GET()).json();
    expect(body.ai.budgetRemainingUsd).toBe(8.25);
  });

  it("ignora 'reserved' com mais de 3 min no filtro da consulta", async () => {
    await GET();
    expect(orFilters).toHaveLength(1);
    expect(orFilters[0]).toMatch(/^status\.neq\.reserved,created_at\.gt\.\d{4}-\d{2}-\d{2}T/);
  });

  it("pagina ai_usage: 2500 linhas de 0.001 em 3 páginas; 10 - 2.5 = 7.5", async () => {
    usageRows = Array.from({ length: 2500 }, () => ({ cost_usd: 0.001 }));
    const body = await (await GET()).json();
    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
    expect(body.ai.budgetRemainingUsd).toBe(7.5);
  });

  it("com exatamente 1000 linhas pede uma página extra (vazia) e soma tudo", async () => {
    usageRows = Array.from({ length: 1000 }, () => ({ cost_usd: 0.002 }));
    const body = await (await GET()).json();
    expect(ranges).toHaveLength(2);
    // 10 - 1000 * 0.002 = 8
    expect(body.ai.budgetRemainingUsd).toBe(8);
  });

  it("ai_enabled=false aparece como enabled=false (200)", async () => {
    configResult = config(false, 10);
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).ai.enabled).toBe(false);
  });

  it("retorna 503 e db=error sem vazar a mensagem quando app_config falha", async () => {
    configResult = { data: null, error: { message: "senha secreta do banco" } };
    const res = await GET();
    expect(res.status).toBe(503);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('"db":"error"');
    expect(text).not.toContain("secreta");
  });

  it("retorna 503 quando a leitura de ai_usage falha", async () => {
    usageError = { message: "detalhe interno" };
    const res = await GET();
    expect(res.status).toBe(503);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('"db":"error"');
    expect(text).not.toContain("detalhe");
  });

  it("retorna 503 com orçamento ausente ou inválido (sem NaN/null)", async () => {
    for (const budget of [undefined, "abc", null, {}]) {
      configResult = config(true, budget);
      const res = await GET();
      expect(res.status).toBe(503);
      expect((await res.json()).db).toBe("error");
    }
  });

  it("retorna 503 quando cost_usd é inválido", async () => {
    usageRows = [{ cost_usd: "xyz" }];
    expect((await GET()).status).toBe(503);
  });
});
