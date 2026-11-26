import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSeedPlan, loadSeedPlan, type PlanResult } from "../lib/seed-plan";
import { runSeed, SeedValidationError, writeCatalog } from "../lib/seed-run";
import { FakeDb } from "./fake-supabase";
import { FAKE_ENV, makeBundle } from "./seed-fixtures";

// Relógio fixo: 2099-12-31 15:00 UTC = 12:00 em America/Sao_Paulo (mesmo dia).
const NOW = new Date("2099-12-31T15:00:00Z");

function okPlan(withDemo = true): PlanResult {
  return buildSeedPlan(makeBundle(withDemo));
}

function deps(db: FakeDb, overrides: Partial<Parameters<typeof runSeed>[0]> = {}) {
  const logs: string[] = [];
  const createClient = vi.fn(() => db.client());
  return {
    logs,
    createClient,
    args: {
      rootDir: "/nao-usado",
      env: FAKE_ENV,
      argv: [] as string[],
      createClient,
      loadPlan: () => okPlan(),
      log: (m: string) => logs.push(m),
      now: NOW,
      ...overrides,
    },
  };
}

const tmpDirs: string[] = [];
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

describe("buildSeedPlan", () => {
  it("aceita o bundle válido e avisa dos conteúdos pendentes da Trilha", () => {
    const r = okPlan();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.plan.contents).toHaveLength(4);
      expect(r.plan.notes.some((n) => n.includes("1 conteúdo(s) da Trilha"))).toBe(true);
    }
  });

  it("sem demo-essays.json: ok, demoEssays nulo e aviso claro", () => {
    const r = okPlan(false);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.plan.demoEssays).toBeNull();
      expect(r.plan.notes.join(" ")).toContain("demo-essays.json ainda não existe");
    }
  });

  it("reprova example_key repetida e topicSlug inexistente", () => {
    const b = makeBundle();
    const d = b.demoEssays as { fallbackExamples: Record<string, unknown>[] };
    d.fallbackExamples.push({ ...d.fallbackExamples[0] });
    expect(buildSeedPlan(b).ok).toBe(false);

    const b2 = makeBundle();
    (b2.demoEssays as { demoAccountEssays: { topicSlug: string }[] }).demoAccountEssays[0].topicSlug = "sem-tema";
    const r = buildSeedPlan(b2);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toContain("sem-tema");
  });

  it("reprova conteúdo fora do schema", () => {
    const b = makeBundle();
    (b.contents[0].data as { slug: string }).slug = "Slug Inválido";
    expect(buildSeedPlan(b).ok).toBe(false);
  });
});

describe("writeCatalog", () => {
  it("grava as contagens esperadas e liga a questão à seção", async () => {
    const db = new FakeDb();
    const r = okPlan();
    if (!r.ok) throw new Error("fixture inválida");
    const s = await writeCatalog(db.client(), r.plan);
    // 4 conteúdos; arestas c-um->c-dois->c-tres->c-quatro = 3; 2 seções x 4 = 8;
    // 5 questões x 4 = 20; 3 flashcards x 4 = 12; Trilha com 4 presentes (1 pendente);
    // 5 competências x 2 slugs = 10; 1 tema; 1 reserva.
    expect(s).toEqual({
      contents: 4,
      edges: 3,
      sections: 8,
      questions: 20,
      flashcards: 12,
      trailContents: 4,
      competencyContents: 10,
      topics: 1,
      fallbackExamples: 1,
    });
    const um = db.table("contents").find((c) => c.slug === "c-um")!;
    const sec2 = db.table("content_sections").find((x) => x.content_id === um.id && x.position === 2)!;
    const q1 = db.table("questions").find((q) => q.content_id === um.id && q.stem === "Pergunta 1 de c-um?")!;
    expect(q1.section_id).toBe(sec2.id);
    const reserve = db.table("essay_submissions")[0];
    expect(reserve.user_id).toBeNull();
    expect(reserve.is_example).toBe(true);
    expect(reserve.example_key).toBe("reserva-1");
    expect(db.count("essay_feedbacks")).toBe(1);
  });
});

describe("runSeed", () => {
  it("idempotência: a segunda execução não muda a contagem de nenhuma tabela", async () => {
    const db = new FakeDb();
    const d = deps(db);
    await runSeed(d.args);
    const first = Object.fromEntries([...db.tables].map(([k, v]) => [k, v.size]));
    await runSeed(d.args);
    const second = Object.fromEntries([...db.tables].map(([k, v]) => [k, v.size]));
    expect(second).toEqual(first);
    // Estado-base da demo: 3 dominados, 1 Jornada com 4 conteúdos, 9 flashcards (3 x 3).
    expect(first.content_progress).toBe(3);
    expect(first.journeys).toBe(1);
    expect(first.journey_contents).toBe(4);
    expect(first.flashcard_states).toBe(9);
    expect(first.contents).toBe(4);
    expect(first.questions).toBe(20);
  });

  it("repõe as redações da demo pela função SQL, sem ON CONFLICT e sem tocar em ai_usage", async () => {
    const db = new FakeDb();
    await runSeed(deps(db).args);
    expect(db.rpcCalls).toHaveLength(1);
    expect(db.rpcCalls[0].name).toBe("demo_replace_essays");
    expect((db.rpcCalls[0].args.p_essays as unknown[]).length).toBe(1);
    expect(db.rpcCalls[0].args.p_user_id).toBe("demo-user-id");
    expect(db.calls.some((c) => c.table === "ai_usage")).toBe(false);
    // Só a reserva (user_id nulo) é gravada por upsert direto em essay_submissions.
    expect(db.table("essay_submissions").every((r) => r.user_id === null)).toBe(true);
    expect(db.table("profiles")[0]).toMatchObject({ id: "demo-user-id", is_demo: true });
  });

  it("sem demo-essays.json termina sem erro, avisa, e não grava reservas nem redações", async () => {
    const db = new FakeDb();
    const d = deps(db, { loadPlan: () => okPlan(false) });
    await expect(runSeed(d.args)).resolves.toBeUndefined();
    expect(d.logs.join("\n")).toContain("demo-essays.json ainda não existe");
    expect(db.count("essay_submissions")).toBe(0);
    expect(db.rpcCalls).toHaveLength(0);
    expect(db.count("contents")).toBe(4);
  });

  it("conteúdo inválido aborta ANTES de criar o client: nenhuma escrita", async () => {
    const db = new FakeDb();
    const d = deps(db, { loadPlan: () => ({ ok: false, errors: ["content/x.json: erro"] }) });
    await expect(runSeed(d.args)).rejects.toBeInstanceOf(SeedValidationError);
    expect(d.createClient).not.toHaveBeenCalled();
    expect(db.calls).toHaveLength(0);
    expect(db.authCalls).toHaveLength(0);
  });

  it("validação real em disco (T12 + schemas): content/ inválido não escreve", async () => {
    const root = mkdtempSync(join(tmpdir(), "seed-test-"));
    tmpDirs.push(root);
    mkdirSync(join(root, "content"));
    writeFileSync(join(root, "content", "trail.json"), JSON.stringify({ slug: "Inválido" }));
    expect(loadSeedPlan(root).ok).toBe(false);

    const db = new FakeDb();
    const d = deps(db, { rootDir: root, loadPlan: loadSeedPlan });
    await expect(runSeed(d.args)).rejects.toBeInstanceOf(SeedValidationError);
    expect(d.createClient).not.toHaveBeenCalled();
    expect(db.writes).toHaveLength(0);
  });

  it("recusa destino de produção e remoto sem flag antes de qualquer client", async () => {
    const db = new FakeDb();
    const prod = deps(db, {
      env: { ...FAKE_ENV, NEXT_PUBLIC_SUPABASE_URL: "https://aprumo-prod.supabase.co" },
      argv: ["--allow-remote"],
    });
    await expect(runSeed(prod.args)).rejects.toThrow(/produção/);
    const remote = deps(db, { env: { ...FAKE_ENV, NEXT_PUBLIC_SUPABASE_URL: "https://dev-abc.supabase.co" } });
    await expect(runSeed(remote.args)).rejects.toThrow(/não é local/);
    expect(prod.createClient).not.toHaveBeenCalled();
    expect(remote.createClient).not.toHaveBeenCalled();
  });

  it("falha com mensagem clara sem variáveis e nunca loga segredos", async () => {
    const db = new FakeDb();
    const missing = deps(db, { env: { NEXT_PUBLIC_SUPABASE_URL: FAKE_ENV.NEXT_PUBLIC_SUPABASE_URL } });
    await expect(runSeed(missing.args)).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);

    const ok = deps(db);
    await runSeed(ok.args);
    const out = ok.logs.join("\n");
    for (const secret of [
      FAKE_ENV.SUPABASE_SERVICE_ROLE_KEY,
      FAKE_ENV.DEMO_USER_PASSWORD,
      FAKE_ENV.DEMO_USER_EMAIL,
      FAKE_ENV.NEXT_PUBLIC_SUPABASE_URL,
    ]) {
      expect(out).not.toContain(secret);
    }
  });
});
