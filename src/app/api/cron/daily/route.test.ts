import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let dbError: unknown = null;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ limit: () => Promise.resolve({ data: [], error: dbError }) }),
    }),
  }),
}));

import { GET } from "./route";

const SECRET = "segredo-descartavel-de-teste";
const call = (auth?: string) =>
  GET(
    new NextRequest("http://localhost/api/cron/daily", {
      headers: auth ? { authorization: auth } : {},
    }),
  );

beforeEach(() => {
  dbError = null;
  process.env.CRON_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/daily", () => {
  it("401 sem Authorization", async () => {
    const res = await call();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("401 com segredo errado, de outro tamanho ou sem o esquema Bearer", async () => {
    expect((await call("Bearer errado")).status).toBe(401);
    expect((await call(`Bearer ${SECRET}x`)).status).toBe(401);
    expect((await call(SECRET)).status).toBe(401);
  });

  it("500 genérico quando CRON_SECRET não está definido, mesmo com 'Bearer undefined'", async () => {
    delete process.env.CRON_SECRET;
    const res = await call("Bearer undefined");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
  });

  it("200 com o segredo certo, keep-alive e demoReset skipped", async () => {
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", keepAlive: "ok", demoReset: "skipped" });
  });

  it("500 sem vazar detalhe quando o banco falha", async () => {
    dbError = { message: "detalhe interno" };
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
  });
});
