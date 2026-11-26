import { describe, expect, it } from "vitest";
import { FakeDb } from "../../../scripts/__tests__/fake-supabase";
import { makeFeedback } from "../../../scripts/__tests__/seed-fixtures";
import { addDaysIso, ensureDemoUser, localDateIso, resetDemoBaseState } from "../demo-reset";

// 2099-12-31 15:00 UTC = 12:00 em America/Sao_Paulo; hoje = 2099-12-31; prazo = +30 dias = 2100-01-30.
const NOW = new Date("2099-12-31T15:00:00Z");
const USER = "demo-user-id";

/** Catálogo mínimo: 1 Trilha, 4 conteúdos em ordem, 2 flashcards por conteúdo. */
function catalog(): FakeDb {
  const db = new FakeDb();
  db.seed("trails", [{ id: "t1", slug: "trilha-ficticia" }]);
  db.seed(
    "trail_contents",
    ["a", "b", "c", "d"].map((id, i) => ({ trail_id: "t1", content_id: id, position: i + 1 })),
  );
  db.seed(
    "flashcards",
    ["a", "b", "c", "d"].flatMap((c) => [1, 2].map((n) => ({ id: `${c}${n}`, content_id: c }))),
  );
  return db;
}

const essay = {
  topicSlug: "tema-um",
  part: "introduction" as const,
  body: "Texto fictício.",
  feedback: makeFeedback("introduction"),
};

describe("datas", () => {
  it("usa o dia de America/Sao_Paulo e soma dias sem depender de hoje", () => {
    expect(localDateIso(new Date("2099-12-31T02:00:00Z"))).toBe("2099-12-30"); // 23:00 em SP
    expect(localDateIso(NOW)).toBe("2099-12-31");
    expect(addDaysIso("2099-12-31", 30)).toBe("2100-01-30");
  });
});

describe("resetDemoBaseState", () => {
  it("repõe 3 dominados, 1 Jornada ativa (+30 dias) e flashcards vencidos hoje", async () => {
    const db = catalog();
    const s = await resetDemoBaseState(db.client(), { userId: USER, demoEssays: [essay], now: NOW });
    expect(s).toEqual({
      masteredContents: 3,
      journeyContents: 4,
      flashcardStates: 6, // 3 conteúdos dominados x 2 flashcards
      essays: 1,
      deadline: "2100-01-30",
    });
    expect(db.table("content_progress").map((r) => r.content_id)).toEqual(["a", "b", "c"]);
    expect(db.table("content_progress").every((r) => r.status === "mastered" && r.mastered_at)).toBe(true);
    expect(db.table("journeys")).toHaveLength(1);
    expect(db.table("journeys")[0]).toMatchObject({ status: "active", deadline: "2100-01-30", user_id: USER });
    expect(db.table("flashcard_states").every((r) => r.due_on === "2099-12-31")).toBe(true);
  });

  it("é idempotente e preserva dados de outros usuários", async () => {
    const db = catalog();
    db.seed("journeys", [{ id: "j-outro", user_id: "outro", status: "active" }]);
    db.seed("content_progress", [
      { user_id: USER, content_id: "d", status: "mastered" },
      { user_id: "outro", content_id: "a", status: "mastered" },
    ]);
    const client = db.client();
    await resetDemoBaseState(client, { userId: USER, demoEssays: [essay], now: NOW });
    const first = Object.fromEntries([...db.tables].map(([k, v]) => [k, v.size]));
    await resetDemoBaseState(client, { userId: USER, demoEssays: [essay], now: NOW });
    const second = Object.fromEntries([...db.tables].map(([k, v]) => [k, v.size]));
    expect(second).toEqual(first);
    // Dominado extra da demo ("d") foi removido; o do outro usuário ficou: 3 da demo + 1 do outro.
    expect(first.content_progress).toBe(4);
    expect(first.journeys).toBe(2); // 1 da demo + 1 do outro
  });

  it("chama a função SQL transacional com as redações e nunca toca em ai_usage", async () => {
    const db = catalog();
    await resetDemoBaseState(db.client(), { userId: USER, demoEssays: [essay], now: NOW });
    expect(db.rpcCalls).toHaveLength(1);
    const { name, args } = db.rpcCalls[0];
    expect(name).toBe("demo_replace_essays");
    expect(args.p_user_id).toBe(USER);
    const sent = args.p_essays as Record<string, unknown>[];
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      topic_slug: "tema-um",
      part: "introduction",
      model_key: "fake-model",
      prompt_version: "essay-feedback@v1",
      total_estimate: 640, // 120 + 160 + 120 + 160 + 80
    });
    expect(db.calls.some((c) => c.table === "ai_usage" || c.table === "essay_submissions")).toBe(false);
  });

  it("sem demoEssays não toca nas redações (arquivo da T18 ainda inexistente)", async () => {
    const db = catalog();
    const s = await resetDemoBaseState(db.client(), { userId: USER, demoEssays: null, now: NOW });
    expect(s.essays).toBeNull();
    expect(db.rpcCalls).toHaveLength(0);
  });

  it("falha com mensagem clara se a Trilha não existe", async () => {
    await expect(resetDemoBaseState(new FakeDb().client(), { userId: USER, now: NOW })).rejects.toThrow(/Trilha/);
  });
});

describe("ensureDemoUser", () => {
  it("cria a conta e marca o perfil como demo", async () => {
    const db = new FakeDb();
    const id = await ensureDemoUser(db.client(), { email: "Demo@Example.com", password: "senha-ficticia" });
    expect(id).toBe(USER);
    expect(db.authCalls).toEqual(["createUser"]);
    expect(db.table("profiles")[0]).toMatchObject({ id: USER, is_demo: true, display_name: "Aluno Demo" });
  });

  it("se já existe, acha pelo e-mail e atualiza a senha (sem duplicar)", async () => {
    const db = new FakeDb();
    const client = db.client();
    await ensureDemoUser(client, { email: "demo@example.com", password: "senha-ficticia" });
    await ensureDemoUser(client, { email: "demo@example.com", password: "outra-senha-ficticia" });
    expect(db.authCalls).toEqual(["createUser", "createUser", "listUsers", "updateUserById"]);
    expect(db.users).toHaveLength(1);
    expect(db.count("profiles")).toBe(1);
  });

  it("falha de criação que não é 'já existe' é reportada, sem listUsers nem vazar e-mail/senha", async () => {
    const db = new FakeDb();
    const real = db.client();
    const client = {
      ...real,
      auth: {
        admin: {
          ...real.auth.admin,
          createUser: () => {
            db.authCalls.push("createUser");
            return Promise.resolve({
              data: { user: null },
              error: { message: "Password too weak for demo@example.com / senha-fraca", code: "weak_password" },
            });
          },
        },
      },
    } as unknown as typeof real;
    const err = await ensureDemoUser(client, { email: "demo@example.com", password: "senha-fraca" }).catch(
      (e: Error) => e,
    );
    expect(err).toBeInstanceOf(Error);
    const msg = (err as Error).message;
    expect(msg).toContain("Password too weak");
    expect(msg).not.toContain("demo@example.com");
    expect(msg).not.toContain("senha-fraca");
    expect(db.authCalls).toEqual(["createUser"]);
  });
});
