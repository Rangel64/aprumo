import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const CARD = uuid(500);

const config = { flashcard_intervals_days: { "1": 1, "2": 2, "3": 4, "4": 7 } };
let currentUser: { id: string } | null = null;
let upserts: { table: string; row: Record<string, unknown>; opts: unknown }[] = [];
let touched: string[] = [];
let upsertError: { message: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from: (name: string) => {
      touched.push(name);
      return {
        upsert: async (row: Record<string, unknown>, opts: unknown) => {
          upserts.push({ table: name, row, opts });
          return { error: upsertError };
        },
      };
    },
  }),
}));
vi.mock("@/server/config", () => ({ getAppConfig: async () => config }));

import { reviewFlashcard } from "../flashcards";

beforeEach(() => {
  currentUser = { id: USER };
  upserts = [];
  touched = [];
  upsertError = null;
  vi.useRealTimers();
});

describe("reviewFlashcard", () => {
  it("grava o estado e devolve nextDueOn pelos intervalos de app_config", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-03-10T15:00:00Z")); // 10/03 em Brasília
    const res = await reviewFlashcard({ flashcardId: CARD, rating: 3 });
    expect(res).toEqual({ ok: true, data: { nextDueOn: "2099-03-14" } }); // 10 + 4
    expect(upserts).toHaveLength(1);
    expect(upserts[0].table).toBe("flashcard_states");
    expect(upserts[0].row).toMatchObject({
      user_id: USER,
      flashcard_id: CARD,
      last_rating: 3,
      due_on: "2099-03-14",
      reviewed_at: "2099-03-10T15:00:00.000Z",
    });
  });

  it("nunca escreve em content_progress (RN-007)", async () => {
    await reviewFlashcard({ flashcardId: CARD, rating: 4 });
    expect(touched).not.toContain("content_progress");
    expect(upserts.every((u) => u.table === "flashcard_states")).toBe(true);
  });

  it("rejeita rating fora de 1..4 e id inválido", async () => {
    for (const bad of [{ flashcardId: CARD, rating: 0 }, { flashcardId: CARD, rating: 5 }, { flashcardId: "x", rating: 1 }, null]) {
      const res = await reviewFlashcard(bad);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe("VALIDATION");
    }
    expect(upserts).toHaveLength(0);
  });

  it("sem sessão: UNAUTHENTICATED e nada gravado", async () => {
    currentUser = null;
    const res = await reviewFlashcard({ flashcardId: CARD, rating: 1 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNAUTHENTICATED");
    expect(upserts).toHaveLength(0);
  });

  it("erro do banco vira INTERNAL sem vazar a mensagem", async () => {
    upsertError = { message: "detalhe-interno" };
    const res = await reviewFlashcard({ flashcardId: CARD, rating: 2 });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("INTERNAL");
      expect(JSON.stringify(res)).not.toContain("detalhe-interno");
    }
  });
});
