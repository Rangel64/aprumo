import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { FakeEssayModel } from "../../src/server/ai/fake-essay-model";
import type { EssayFeedbackModel } from "../../src/server/ai/types";
import {
  buildCases,
  estimateMaxCostUsd,
  HARD_CALL_LIMIT,
  main,
  parseArgs,
  percentile,
  renderResults,
  replaceResultsBlock,
  RESULTS_END,
  RESULTS_START,
  runEval,
  summarize,
  type EvalCase,
  type MainDeps,
} from "../eval-essay";

const readReal = (p: string): unknown =>
  JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8")) as unknown;
const corpusRaw = readReal("content/essays/corpus-d010.json") as {
  cases: { id: string; topicSlug: string; text: string }[];
};
const topicsRaw = readReal("content/essay-topics.json") as { topics: { slug: string }[] };

// Doc de fixture (NÃO o docs/arquitetura/avaliacao-modelos.md vivo).
const DOC_FIXTURE = `# fixture\n\n${RESULTS_START}\n\nvazio\n\n${RESULTS_END}\n\nrodapé`;

function makeDeps(overrides: Partial<MainDeps> = {}) {
  const logs: string[] = [];
  const writeText = vi.fn();
  const createModel = vi.fn((): EssayFeedbackModel => new FakeEssayModel());
  const deps: MainDeps = {
    readJson: readReal,
    readText: () => DOC_FIXTURE,
    writeText,
    createModel,
    log: (l) => logs.push(l),
    now: () => new Date("2099-12-31T00:00:00.000Z"),
    ...overrides,
  };
  return { deps, logs, writeText, createModel };
}

const KEYS = { ANTHROPIC_API_KEY: "test-key-a", GOOGLE_GENERATIVE_AI_API_KEY: "test-key-g" };
const REAL_ENV = {
  ...KEYS,
  AI_PROVIDER: "ai-sdk",
  EVAL_CONFIRM_SPEND: "yes-eval-spend",
};

describe("corpus D-010", () => {
  it("tem 5 casos válidos, assinados pelo Aluno Demo, com topicSlug existente nos temas oficiais", () => {
    const cases = buildCases(corpusRaw, topicsRaw);
    expect(cases).toHaveLength(5);
    const slugs = new Set(topicsRaw.topics.map((t) => t.slug));
    for (const c of corpusRaw.cases) expect(slugs.has(c.topicSlug)).toBe(true);
    expect(new Set(corpusRaw.cases.map((c) => c.id)).size).toBe(5);
  });

  it("inclui o caso de injeção", () => {
    const injected = corpusRaw.cases.filter((c) => /ignore as instru/i.test(c.text));
    expect(injected).toHaveLength(1);
    expect(injected[0].text).toMatch(/reescreva/i);
  });

  it("rejeita topicSlug inexistente, número de casos errado e autor diferente", () => {
    const bad = { cases: corpusRaw.cases.map((c, i) => ({ ...c, author: "Aluno Demo", part: "development", expected: "x", topicSlug: i === 0 ? "nao-existe" : c.topicSlug })) };
    expect(() => buildCases(bad, topicsRaw)).toThrow(/topicSlug inexistente/);
    expect(() => buildCases({ cases: [] }, topicsRaw)).toThrow(/inválido/);
  });
});

describe("funções puras do eval", () => {
  it("percentile por posto mais próximo", () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([10, 20, 30, 40], 50)).toBe(20); // ceil(0,5*4)=2º
    expect(percentile([10, 20, 30, 40], 95)).toBe(40); // ceil(0,95*4)=4º
    expect(percentile([5], 95)).toBe(5);
  });

  it("summarize: %válidas, p50/p95 só das válidas e custo médio", () => {
    const s = summarize({
      modelKey: "m",
      spec: null,
      calls: [
        { caseId: "a", round: 1, valid: true, latencyMs: 100, costUsd: 0.01 },
        { caseId: "a", round: 2, valid: true, latencyMs: 300, costUsd: 0.03 },
        { caseId: "a", round: 3, valid: false, errorCode: "TIMEOUT", latencyMs: null, costUsd: null },
        { caseId: "b", round: 1, valid: true, latencyMs: 200, costUsd: 0.02 },
      ],
    });
    expect(s.calls).toBe(4);
    expect(s.validPct).toBe(75); // 3 de 4
    expect(s.p50Ms).toBe(200); // [100,200,300] -> 2º
    expect(s.p95Ms).toBe(300);
    expect(s.avgCostUsd).toBeCloseTo(0.02, 9); // (0,01+0,03+0,02)/3
  });

  it("estimateMaxCostUsd: preço de entrada 0 e saída 1 => rodadas*casos*teto de saída/1e6", () => {
    const one: EvalCase[] = buildCases(corpusRaw, topicsRaw).slice(0, 1);
    // 3 rodadas * 1 caso * 4096 tokens * US$ 1/1e6 = 0,012288
    expect(estimateMaxCostUsd([{ usdPerMTokIn: 0, usdPerMTokOut: 1 }], one, 3)).toBeCloseTo(0.012288, 9);
  });

  it("estimateMaxCostUsd aceita data e escolhe a tarifa vigente (mudança em 2027-01-01)", () => {
    const one: EvalCase[] = buildCases(corpusRaw, topicsRaw).slice(0, 1);
    const spec = {
      usdPerMTokIn: 0,
      usdPerMTokOut: 1,
      rateChanges: [{ effectiveFrom: "2027-01-01", usdPerMTokIn: 0, usdPerMTokOut: 2 }],
    };
    // 3 * 4096 * US$ 1/1e6 = 0,012288 antes; dobra (US$ 2/1e6) a partir de 2027-01-01.
    expect(estimateMaxCostUsd([spec], one, 3, new Date("2026-12-31T12:00:00Z"))).toBeCloseTo(0.012288, 9);
    expect(estimateMaxCostUsd([spec], one, 3, new Date("2027-01-01T00:00:00Z"))).toBeCloseTo(0.024576, 9);
  });

  it("replaceResultsBlock troca só o bloco e exige os marcadores", () => {
    const out = replaceResultsBlock(DOC_FIXTURE, "NOVO");
    expect(out).toContain("NOVO");
    expect(out).not.toContain("vazio");
    expect(out.startsWith("# fixture")).toBe(true);
    expect(out.endsWith("rodapé")).toBe(true);
    expect(() => replaceResultsBlock("sem marcadores", "x")).toThrow(/marcadores/);
  });

  it("parseArgs recusa argumento desconhecido", () => {
    expect(parseArgs(["--dry-run"])).toEqual({ dryRun: true, confirmSpend: false, fake: false, allowPartial: false });
    expect(() => parseArgs(["--vai"])).toThrow(/desconhecido/);
  });
});

describe("runEval", () => {
  it("5 casos x 3 rodadas x 2 modelos = 30 chamadas, sequencial e sem retentativa", async () => {
    const cases = buildCases(corpusRaw, topicsRaw);
    const model = new FakeEssayModel();
    const spy = vi.spyOn(model, "generate");
    const runs = await runEval({
      cases,
      rounds: 3,
      models: [
        { modelKey: "fake-a", spec: null, model },
        { modelKey: "fake-b", spec: null, model },
      ],
    });
    expect(spy).toHaveBeenCalledTimes(30);
    expect(runs.map((r) => r.calls.length)).toEqual([15, 15]);
    expect(runs.every((r) => summarize(r).validPct === 100)).toBe(true);
  });

  it("recusa plano acima do limite duro", async () => {
    const cases = buildCases(corpusRaw, topicsRaw);
    await expect(
      runEval({ cases, rounds: 4, models: [{ modelKey: "a", spec: null, model: new FakeEssayModel() }, { modelKey: "b", spec: null, model: new FakeEssayModel() }] }),
    ).rejects.toThrow(/limite duro/);
    expect(HARD_CALL_LIMIT).toBe(30);
  });

  it("falha do modelo vira registro com código, sem mensagem do provedor", async () => {
    const cases = buildCases(corpusRaw, topicsRaw).slice(0, 1);
    const boom: EssayFeedbackModel = {
      generate: () => Promise.reject(new Error("segredo test-key-vazou texto do aluno")),
    };
    const runs = await runEval({ cases, rounds: 1, models: [{ modelKey: "x", spec: null, model: boom }] });
    expect(runs[0].calls[0]).toMatchObject({ valid: false, errorCode: "UNAVAILABLE" });
    expect(JSON.stringify(runs)).not.toContain("test-key-vazou");
  });
});

describe("main", () => {
  it("--dry-run valida corpus, prompt e config SEM chamar provedor nem gravar", async () => {
    const { deps, logs, writeText, createModel } = makeDeps();
    const code = await main(["--dry-run"], {}, deps);
    expect(code).toBe(0);
    expect(createModel).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    const out = logs.join("\n");
    expect(out).toContain("essay-feedback@v1");
    expect(out).toContain("Chamadas planejadas: 30");
    expect(out).toMatch(/Custo MÁXIMO estimado: US\$ \d/);
    expect(out).toContain("ANTHROPIC_API_KEY"); // nomes das chaves ausentes, nunca valores
  });

  it("sem confirmação de gasto não roda e não cria modelo", async () => {
    for (const [argv, env] of [
      [[], REAL_ENV],
      [["--confirm-spend"], { ...REAL_ENV, EVAL_CONFIRM_SPEND: undefined }],
      [["--confirm-spend"], { ...REAL_ENV, EVAL_CONFIRM_SPEND: "yes" }],
    ] as const) {
      const { deps, logs, createModel, writeText } = makeDeps();
      expect(await main(argv, env, deps)).toBe(1);
      expect(logs.join("\n")).toMatch(/GASTA dinheiro/);
      expect(createModel).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
    }
  });

  it("exige AI_PROVIDER=ai-sdk e as duas chaves, falhando cedo", async () => {
    const a = makeDeps();
    expect(await main(["--confirm-spend"], { ...REAL_ENV, AI_PROVIDER: "fake" }, a.deps)).toBe(1);
    expect(a.logs.join("\n")).toMatch(/AI_PROVIDER/);
    expect(a.createModel).not.toHaveBeenCalled();

    const b = makeDeps();
    expect(await main(["--confirm-spend"], { ...REAL_ENV, GOOGLE_GENERATIVE_AI_API_KEY: undefined }, b.deps)).toBe(1);
    expect(b.logs.join("\n")).toContain("GOOGLE_GENERATIVE_AI_API_KEY");
    expect(b.createModel).not.toHaveBeenCalled();
  });

  it("execução confirmada (com modelo fake injetado): 30 chamadas e doc sem chave, sem texto do aluno", async () => {
    const { deps, logs, writeText, createModel } = makeDeps();
    const code = await main(["--confirm-spend"], REAL_ENV, deps);
    expect(code).toBe(0);
    expect(createModel).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenCalledTimes(1);
    const [path, content] = writeText.mock.calls[0] as [string, string];
    expect(path).toBe("docs/arquitetura/avaliacao-modelos.md");
    expect(content).toContain("Nota cega A");
    expect(content).toContain("RN-023");
    expect(content).toContain("2099-12-31");
    const progress = logs.filter((l) => / rodada \d: /.test(l));
    expect(progress).toHaveLength(30);
    // Sem texto do aluno (nem trecho) e sem chaves, no doc e nos logs.
    for (const c of corpusRaw.cases) {
      const snippet = c.text.slice(0, 40);
      expect(content).not.toContain(snippet);
      expect(logs.join("\n")).not.toContain(snippet);
    }
    for (const secret of ["test-key-a", "test-key-g"]) {
      expect(content).not.toContain(secret);
      expect(logs.join("\n")).not.toContain(secret);
    }
  });

  it("renderResults não contém texto completo do aluno", async () => {
    const cases = buildCases(corpusRaw, topicsRaw);
    const runs = await runEval({ cases, rounds: 1, models: [{ modelKey: "fake", spec: null, model: new FakeEssayModel() }] });
    const md = renderResults(runs, cases, "2099-12-31");
    for (const c of cases) expect(md).not.toContain(c.input.text);
  });
});
