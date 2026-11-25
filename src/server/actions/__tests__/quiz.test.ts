import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Q = { id: string; content_id: string; section_id: string | null; options: unknown };
type Progress = { user_id: string; content_id: string; status: string; mastered_at: string | null };

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const USER = uuid(1);
const CONTENT = uuid(100);
const OTHER_CONTENT = uuid(101);
const SECTION_A = uuid(200);
const SECTION_B = uuid(201);
const Q_IDS = [uuid(300), uuid(301), uuid(302), uuid(303), uuid(304)];
const FOREIGN_Q = uuid(399);

let config = { quiz_question_count: 5, quiz_pass_threshold_pct: 80 };
let questions: Q[] = [];
let keys: { question_id: string; correct_index: number; explanation: string }[] = [];
let progressWrites = 0;
const EXPLANATION = "EXPLICACAO-SECRETA-XYZ";
let sections: { id: string; content_id: string; title: string; position: number }[] = [];
let progress: Progress[] = [];
let attempts: Record<string, unknown>[] = [];
let currentUser: { id: string } | null = null;

type Filter = { col: string; val: unknown };

function table(name: string) {
  const filters: Filter[] = [];
  let limitN: number | undefined;
  let orderCol: string | undefined;
  let inFilter: { col: string; vals: unknown[] } | undefined;
  let mode: "select" | "update" = "select";
  let patch: Record<string, unknown> = {};

  const rowsOf = (): Record<string, unknown>[] => {
    switch (name) {
      case "questions": return questions;
      case "question_keys": return keys;
      case "content_sections": return sections;
      case "content_progress": return progress;
      default: return [];
    }
  };
  const run = () => {
    let rows = rowsOf().filter(
      (r) =>
        filters.every((f) => r[f.col] === f.val) &&
        (!inFilter || inFilter.vals.includes(r[inFilter.col])),
    );
    if (mode === "update") {
      rows.forEach((r) => Object.assign(r, patch));
      return { data: null, error: null };
    }
    if (orderCol) {
      const c = orderCol;
      rows = [...rows].sort((a, b) => String(a[c]).localeCompare(String(b[c]), "en", { numeric: true }));
    }
    if (limitN !== undefined) rows = rows.slice(0, limitN);
    return { data: rows, error: null };
  };

  const builder: Record<string, unknown> = {
    select: () => builder,
    update: (p: Record<string, unknown>) => {
      mode = "update";
      patch = p;
      return builder;
    },
    eq: (col: string, val: unknown) => {
      filters.push({ col, val });
      return builder;
    },
    in: (col: string, vals: unknown[]) => {
      inFilter = { col, vals };
      return builder;
    },
    order: (col: string) => {
      orderCol = col;
      return builder;
    },
    limit: (n: number) => {
      limitN = n;
      return builder;
    },
    maybeSingle: async () => ({ data: (run().data as Record<string, unknown>[])[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => void) => resolve(run()),
    insert: async (row: Record<string, unknown>) => {
      if (name === "quiz_attempts") attempts.push(row);
      return { error: null };
    },
    upsert: async (row: Progress) => {
      progressWrites += 1;
      const existing = progress.find((r) => r.user_id === row.user_id && r.content_id === row.content_id);
      if (!existing) progress.push(row);
      else Object.assign(existing, row);
      return { error: null };
    },
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: table }) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: currentUser } }) } }),
}));
vi.mock("@/server/config", () => ({ getAppConfig: async () => config }));

import { submitQuizAttempt } from "../quiz";

/** Gabarito do fixture: a opção correta da questão i é i % 3 (todas têm 3 opções). */
const correctOf = (i: number) => i % 3;
const wrongOf = (i: number) => (i + 1) % 3;

function answersWith(wrongIdx: number[]) {
  return Q_IDS.map((id, i) => ({
    questionId: id,
    optionIndex: wrongIdx.includes(i) ? wrongOf(i) : correctOf(i),
  }));
}

beforeEach(() => {
  config = { quiz_question_count: 5, quiz_pass_threshold_pct: 80 };
  currentUser = { id: USER };
  questions = [
    ...Q_IDS.map((id, i) => ({
      id,
      content_id: CONTENT,
      // q0 e q1 na seção A; q2 na B; q3 e q4 sem seção.
      section_id: i < 2 ? SECTION_A : i === 2 ? SECTION_B : null,
      options: ["a", "b", "c"],
    })),
    { id: FOREIGN_Q, content_id: OTHER_CONTENT, section_id: null, options: ["a", "b", "c"] },
  ];
  keys = [...Q_IDS.map((id, i) => ({ question_id: id, correct_index: correctOf(i), explanation: EXPLANATION })), { question_id: FOREIGN_Q, correct_index: 0, explanation: EXPLANATION }];
  sections = [
    { id: SECTION_B, content_id: CONTENT, title: "Seção B", position: 2 },
    { id: SECTION_A, content_id: CONTENT, title: "Seção A", position: 1 },
  ];
  progress = [];
  progressWrites = 0;
  attempts = [];
});

describe("submitQuizAttempt", () => {
  it("aprova com 4 de 5 (400 >= 80*5), grava tentativa e marca mastered com mastered_at", async () => {
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([3]) });
    expect(r).toEqual({
      ok: true,
      data: { correct: 4, total: 5, thresholdPct: 80, passed: true, mastered: true, sectionsToReview: [] },
    });
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ user_id: USER, content_id: CONTENT, correct: 4, total: 5, threshold_pct: 80, passed: true });
    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({ user_id: USER, content_id: CONTENT, status: "mastered" });
    expect(progress[0].mastered_at).toEqual(expect.any(String));
  });

  it("promove studying para mastered", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "studying", mastered_at: null }];
    await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe("mastered");
    expect(progress[0].mastered_at).not.toBeNull();
  });

  it("reprova com 3 de 5 (errou q0 e q2), devolve seções a rever em ordem e não marca mastered", async () => {
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([0, 2]) });
    expect(r).toEqual({
      ok: true,
      data: {
        correct: 3,
        total: 5,
        thresholdPct: 80,
        passed: false,
        mastered: false,
        // q0 -> seção A (position 1), q2 -> seção B (position 2); q3/q4 sem seção.
        sectionsToReview: [
          { id: SECTION_A, title: "Seção A" },
          { id: SECTION_B, title: "Seção B" },
        ],
      },
    });
    expect(attempts[0]).toMatchObject({ correct: 3, passed: false });
    expect(progress).toEqual([]);
  });

  it("não vaza gabarito nem explicação na resposta", async () => {
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([0]) });
    const json = JSON.stringify(r);
    expect(json).not.toMatch(/correct_index|correctIndex|explanation/);
    // Valores: nem o texto da explicação nem o correct_index (chave ausente => nenhum campo numérico extra).
    expect(json).not.toContain(EXPLANATION);
    expect(Object.keys((r as { data: object }).data).sort()).toEqual(
      ["correct", "mastered", "passed", "sectionsToReview", "thresholdPct", "total"],
    );
  });

  it("já mastered e aprovado: não escreve em content_progress e mastered=true", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "mastered", mastered_at: "2020-01-01T00:00:00.000Z" }];
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(r).toMatchObject({ ok: true, data: { passed: true, mastered: true } });
    expect(progressWrites).toBe(0);
  });

  it("já mastered e reprovado: passed=false mas mastered=true, sem escrever", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "mastered", mastered_at: "2020-01-01T00:00:00.000Z" }];
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([0, 1, 2]) });
    expect(r).toMatchObject({ ok: true, data: { passed: false, mastered: true } });
    expect(progressWrites).toBe(0);
  });

  it("studying e linha ausente promovem com UM único upsert cada", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "studying", mastered_at: null }];
    await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(progressWrites).toBe(1);
    expect(progress[0].status).toBe("mastered");

    progress = [];
    progressWrites = 0;
    await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(progressWrites).toBe(1);
    expect(progress).toHaveLength(1);
    expect(progress[0].status).toBe("mastered");
  });

  it("reprovado com studying: não escreve e mastered=false", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "studying", mastered_at: null }];
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([0, 1, 2]) });
    expect(r).toMatchObject({ ok: true, data: { passed: false, mastered: false } });
    expect(progressWrites).toBe(0);
  });

  it("contagem exata: conteúdo com menos ou mais questões que quiz_question_count vira NOT_FOUND", async () => {
    // Menos: 4 questões com config 5.
    questions = questions.filter((q) => q.id !== Q_IDS[4]);
    const fewer = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]).slice(0, 4) });
    expect(fewer).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    // Mais: 6 questões com config 5.
    questions.push({ id: uuid(305), content_id: CONTENT, section_id: null, options: ["a", "b", "c"] });
    questions.push({ id: Q_IDS[4], content_id: CONTENT, section_id: null, options: ["a", "b", "c"] });
    const more = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(more).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(attempts).toEqual([]);
    expect(progressWrites).toBe(0);
  });

  it("reprovação posterior NÃO rebaixa mastered nem mexe no mastered_at", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "mastered", mastered_at: "2020-01-01T00:00:00.000Z" }];
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([0, 1, 2]) });
    expect(r).toMatchObject({ ok: true, data: { passed: false } });
    expect(progress).toEqual([
      { user_id: USER, content_id: CONTENT, status: "mastered", mastered_at: "2020-01-01T00:00:00.000Z" },
    ]);
  });

  it("nova aprovação mantém o mastered_at original", async () => {
    progress = [{ user_id: USER, content_id: CONTENT, status: "mastered", mastered_at: "2020-01-01T00:00:00.000Z" }];
    await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(progress[0].mastered_at).toBe("2020-01-01T00:00:00.000Z");
  });

  it("o total vem do banco/config, não do cliente: campo total forjado é ignorado", async () => {
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([0, 1, 2, 3]), total: 1 });
    // 1 acerto de 5 (total do banco), não 1 de 1.
    expect(r).toMatchObject({ ok: true, data: { correct: 1, total: 5, passed: false } });
    expect(attempts[0]).toMatchObject({ total: 5 });
  });

  it("usa app_config: 3 questões e 60% (2 de 3 passa; 120 >= 60*3 = 180 é falso, 200 >= 180 verdadeiro)", async () => {
    config = { quiz_question_count: 3, quiz_pass_threshold_pct: 60 };
    // O conteúdo precisa ter exatamente 3 questões (regra de contagem exata).
    questions = questions.filter((q) => q.content_id !== CONTENT || Q_IDS.slice(0, 3).includes(q.id));
    keys = keys.filter((k) => Q_IDS.slice(0, 3).includes(k.question_id));
    // Primeiras 3 por id: q0, q1, q2. Acerta q0 e q1, erra q2: 2*100=200 >= 60*3=180.
    const answers = answersWith([2]).slice(0, 3);
    const r = await submitQuizAttempt({ contentId: CONTENT, answers });
    expect(r).toMatchObject({ ok: true, data: { correct: 2, total: 3, thresholdPct: 60, passed: true } });
  });

  it("rejeita questão de outro conteúdo", async () => {
    const answers = [...answersWith([]).slice(0, 4), { questionId: FOREIGN_Q, optionIndex: 0 }];
    const r = await submitQuizAttempt({ contentId: CONTENT, answers });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(attempts).toEqual([]);
    expect(progress).toEqual([]);
  });

  it("rejeita questão repetida", async () => {
    const a = answersWith([]);
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: [a[0], a[0], a[1], a[2], a[3]] });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(attempts).toEqual([]);
  });

  it("rejeita optionIndex fora da faixa (3 opções: índice 3 inválido)", async () => {
    const a = answersWith([]);
    a[2] = { ...a[2], optionIndex: 3 };
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: a });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(attempts).toEqual([]);
  });

  it("rejeita optionIndex negativo", async () => {
    const a = answersWith([]);
    a[0] = { ...a[0], optionIndex: -1 };
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: a });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("rejeita quando falta questão (só 4 de 5 respondidas: não vira 4 de 4)", async () => {
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]).slice(0, 4) });
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(attempts).toEqual([]);
    expect(progress).toEqual([]);
  });

  it("rejeita lista vazia e contentId inválido", async () => {
    expect(await submitQuizAttempt({ contentId: CONTENT, answers: [] })).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(await submitQuizAttempt({ contentId: "x", answers: answersWith([]) })).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("exige usuário autenticado e não grava nada sem ele", async () => {
    currentUser = null;
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(r).toMatchObject({ ok: false, error: { code: "UNAUTHENTICATED" } });
    expect(attempts).toEqual([]);
    expect(progress).toEqual([]);
  });

  it("conteúdo sem questões vira NOT_FOUND", async () => {
    const r = await submitQuizAttempt({ contentId: uuid(555), answers: answersWith([]) });
    expect(r).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("gabarito ausente vira INTERNAL genérico, sem detalhe", async () => {
    keys = [];
    const r = await submitQuizAttempt({ contentId: CONTENT, answers: answersWith([]) });
    expect(r).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(JSON.stringify(r)).not.toMatch(/question_keys|correct/);
  });
});
