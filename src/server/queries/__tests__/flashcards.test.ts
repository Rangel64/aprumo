import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const C_STUDY = uuid(100);
const C_OTHER = uuid(101);
const C_MASTER = uuid(102);
// Hoje (relógio fixo) = 2099-03-10 em Brasília.
const TODAY = "2099-03-10";

type Card = { id: string; content_id: string; front: string; back: string; contents: { title: string } };
const card = (n: number, contentId: string): Card => ({
  id: uuid(500 + n),
  content_id: contentId,
  front: `frente ${n}`,
  back: `verso ${n}`,
  contents: { title: `Conteúdo ${contentId.slice(-3)}` },
});

let cards: Card[] = [];
let states: { flashcard_id: string; due_on: string }[] = [];
let progress: { content_id: string; status: string }[] = [];

function table(name: string) {
  let inF: { col: string; vals: unknown[] } | undefined;
  const rows = (): Record<string, unknown>[] =>
    (name === "flashcards" ? cards : name === "flashcard_states" ? states : progress) as unknown as Record<string, unknown>[];
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    in: (col: string, vals: unknown[]) => {
      inF = { col, vals };
      return b;
    },
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: rows().filter((r) => !inF || inF.vals.includes(r[inF.col])), error: null }),
  };
  return b;
}

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: table }) }));

import { getDueFlashcards } from "../flashcards";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2099-03-10T15:00:00Z"));
  cards = [
    card(1, C_STUDY), // sem estado, conteúdo em estudo -> entra
    card(2, C_STUDY), // estado vencido -> entra
    card(3, C_STUDY), // estado futuro -> fora
    card(4, C_OTHER), // sem estado, sem progresso -> fora
    card(5, C_MASTER), // sem estado, dominado -> entra
    card(6, C_OTHER), // estado com due_on = hoje -> entra
  ];
  states = [
    { flashcard_id: uuid(502), due_on: "2099-03-09" },
    { flashcard_id: uuid(503), due_on: "2099-03-11" },
    { flashcard_id: uuid(506), due_on: TODAY },
  ];
  progress = [
    { content_id: C_STUDY, status: "studying" },
    { content_id: C_MASTER, status: "mastered" },
  ];
});

describe("getDueFlashcards", () => {
  it("aplica a regra de fila D-043", async () => {
    const res = await getDueFlashcards(USER);
    // Entram os cartões 1, 2, 5 e 6; ordem por id.
    expect(res.map((c) => c.id)).toEqual([uuid(501), uuid(502), uuid(505), uuid(506)]);
  });

  it("inclui contentTitle e os campos do contrato", async () => {
    const [first] = await getDueFlashcards(USER);
    expect(first).toEqual({
      id: uuid(501),
      contentId: C_STUDY,
      contentTitle: "Conteúdo 100",
      front: "frente 1",
      back: "verso 1",
    });
  });

  it("sem estados nem progresso: fila vazia", async () => {
    states = [];
    progress = [];
    expect(await getDueFlashcards(USER)).toEqual([]);
  });
});
