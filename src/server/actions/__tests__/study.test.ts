import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Banco em memória: só o necessário para observar o que a action grava.
type Row = { user_id: string; content_id: string; status: string };
let rows: Row[] = [];
let currentUser: { id: string } | null = null;
let fkError = false;

const admin = {
  from: () => ({
    upsert: async (row: Row, opts: { ignoreDuplicates?: boolean }) => {
      if (fkError) return { error: { code: "23503" } };
      const exists = rows.some((r) => r.user_id === row.user_id && r.content_id === row.content_id);
      // ignoreDuplicates: não toca na linha existente.
      if (!exists || !opts.ignoreDuplicates) rows.push(row);
      return { error: null };
    },
    update: (patch: { status: string }) => ({
      eq: (_c1: string, user: string) => ({
        eq: (_c2: string, content: string) => ({
          eq: async (_c3: string, onlyFrom: string) => {
            for (const r of rows) {
              if (r.user_id === user && r.content_id === content && r.status === onlyFrom) {
                r.status = patch.status;
              }
            }
            return { error: null };
          },
        }),
      }),
    }),
  }),
};

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => admin }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: currentUser } }) } }),
}));

import { markStudying } from "../study";

const CONTENT = "00000000-0000-4000-8000-0000000000c2";
const USER = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  rows = [];
  currentUser = { id: USER };
  fkError = false;
});

describe("markStudying", () => {
  it("rejeita contentId que não é UUID", async () => {
    const r = await markStudying({ contentId: "abc" });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("exige usuário autenticado e não grava nada sem ele", async () => {
    currentUser = null;
    const r = await markStudying({ contentId: CONTENT });
    expect(r).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(rows).toEqual([]);
  });

  it("cria a linha como studying quando não há progresso", async () => {
    const r = await markStudying({ contentId: CONTENT });
    expect(r).toEqual({ ok: true, data: {} });
    expect(rows).toEqual([{ user_id: USER, content_id: CONTENT, status: "studying" }]);
  });

  it("não altera uma linha studying já existente (idempotente)", async () => {
    rows = [{ user_id: USER, content_id: CONTENT, status: "studying" }];
    await markStudying({ contentId: CONTENT });
    expect(rows).toEqual([{ user_id: USER, content_id: CONTENT, status: "studying" }]);
  });

  it("NUNCA rebaixa mastered (RN-007)", async () => {
    rows = [{ user_id: USER, content_id: CONTENT, status: "mastered" }];
    const r = await markStudying({ contentId: CONTENT });
    expect(r.ok).toBe(true);
    expect(rows).toEqual([{ user_id: USER, content_id: CONTENT, status: "mastered" }]);
  });

  it("conteúdo inexistente (violação de FK) vira NOT_FOUND", async () => {
    fkError = true;
    const r = await markStudying({ contentId: CONTENT });
    expect(r).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
