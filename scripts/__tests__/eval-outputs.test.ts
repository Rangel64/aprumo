import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { EssayFeedbackAI } from "../../src/contracts/essay";
import { FakeEssayModel } from "../../src/server/ai/fake-essay-model";
import {
  GRADES_END,
  GRADES_START,
  aggregateGrades,
  assignBlindLabels,
  computeRn023Flags,
  parseGradesCsv,
  recommend,
  renderGradesTemplate,
  type EvalKey,
} from "../lib/eval-outputs";
import { FAKE_BANNER } from "../lib/eval-fake";
import { main, parseArgs, RESULTS_END, RESULTS_START, type MainDeps } from "../eval-essay";

const readReal = (p: string): unknown =>
  JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8")) as unknown;

// Doc de fixture (NÃO o docs/arquitetura/avaliacao-modelos.md vivo).
const DOC_FIXTURE = `# fixture\n\n${RESULTS_START}\n\nRESULTADO REAL INTACTO\n\n${RESULTS_END}\n\n${GRADES_START}\n\nnotas reais intactas\n\n${GRADES_END}\n`;

function setup(randomSeed = 42) {
  const files = new Map<string, string>();
  const logs: string[] = [];
  const deps: MainDeps = {
    readJson: readReal,
    readText: (p) => files.get(p) ?? DOC_FIXTURE,
    writeText: (p, c) => void files.set(p, c),
    createModel: () => {
      throw new Error("provedor real não pode ser criado nestes testes");
    },
    log: (l) => logs.push(l),
    now: () => new Date("2099-12-31T00:00:00.000Z"),
    randomSeed: () => randomSeed,
    isGitIgnored: () => true,
    normalizeTimes: () => undefined,
  };
  return { files, logs, deps };
}

const DOC = "docs/arquitetura/avaliacao-modelos.md";

describe("rótulos cegos", () => {
  const ids = ["c1", "c2", "c3", "c4", "c5"];
  it("são reproduzíveis pela semente e balanceados (diferença <= 1)", () => {
    const a = assignBlindLabels(ids, ["m1", "m2"], 123);
    expect(assignBlindLabels(ids, ["m1", "m2"], 123)).toEqual(a);
    for (const seed of [1, 2, 3, 99, 2 ** 31]) {
      const r = assignBlindLabels(ids, ["m1", "m2"], seed);
      const xIsM1 = ids.filter((id) => r[id].X === "m1").length;
      // 5 casos: m1 fica com X em 2 ou 3 casos.
      expect([2, 3]).toContain(xIsM1);
      for (const id of ids) expect(new Set([r[id].X, r[id].Y])).toEqual(new Set(["m1", "m2"]));
    }
  });
});

describe("rn023Flags", () => {
  const student = "alfa beta gama delta epsilon zeta eta teta iota kappa lambda mi ni xi omicron pi rho sigma";
  const base: EssayFeedbackAI = {
    competencies: [1, 2, 3, 4, 5].map((id) => ({
      id,
      assessable: id === 1,
      scoreEstimate: id === 1 ? (120 as const) : null,
      strengths: id === 1 ? ["ok"] : [],
      improvements: id === 1 ? ["revise"] : [],
      evidence: [],
    })),
    summary: "resumo curto",
  };
  it("sinaliza cópia longa fora de evidence e não sinaliza orientação curta", () => {
    expect(computeRn023Flags(student, base).anyFlag).toBe(false);
    const copied = { ...base, summary: student.split(" ").slice(0, 14).join(" ") }; // 14 >= 12
    const f = computeRn023Flags(student, copied);
    expect(f.longCopy).toBe(true);
    expect(f.longestCopiedWords).toBe(14);
    // evidence (citação literal) não conta.
    const cited = {
      ...base,
      competencies: base.competencies.map((c) => ({ ...c, evidence: [student] })),
    };
    expect(computeRn023Flags(student, cited).longCopy).toBe(false);
  });
  it("sinaliza campo livre com extensão parecida com a do original", () => {
    const longText = "palavras diferentes ".repeat(20).trim(); // 399 chars
    const original = "x ".repeat(190).trim(); // 379 chars; 70% = 265 <= 399
    const f = computeRn023Flags(original, { ...base, summary: longText });
    expect(f.rewriteLikeLength).toBe(true);
    expect(f.longCopy).toBe(false);
  });
});

describe("planilha e --summarize-grades", () => {
  it("o modelo de planilha tem as colunas pedidas", () => {
    const csv = renderGradesTemplate([{ caseId: "c1", round: 1, label: "X" }]);
    expect(csv.split("\n")[0]).toBe(
      "caso,rodada,rotulo,nota_avaliador_1,nota_avaliador_2,violou_RN023_avaliador_1,violou_RN023_avaliador_2,observacao",
    );
  });

  const key: EvalKey = {
    note: "x",
    seed: 1,
    promptVersion: "v1",
    assignments: { c1: { X: "m1", Y: "m2" }, c2: { X: "m2", Y: "m1" } },
    rows: [
      { caseId: "c1", round: 1, label: "X" },
      { caseId: "c1", round: 1, label: "Y" },
      { caseId: "c2", round: 1, label: "X" },
      { caseId: "c2", round: 1, label: "Y" },
    ],
    metrics: {
      m1: { validPct: 100, p95Ms: 5000, avgCostUsd: 0.01 },
      m2: { validPct: 100, p95Ms: 6000, avgCostUsd: 0.005 },
    },
  };
  const sheet = [
    "caso,rodada,rotulo,nota_avaliador_1,nota_avaliador_2,violou_RN023_avaliador_1,violou_RN023_avaliador_2,observacao",
    "c1,1,X,4,5,,,",
    "c1,1,Y,4,4,,,",
    "c2,1,X,4,4,,,", // m2
    "c2,1,Y,5,4,,,", // m1
  ].join("\n");

  it("agrega por modelo: m1 = (4+5+5+4)/4 = 4.5; m2 = (4+4+4+4)/4 = 4", () => {
    const aggs = aggregateGrades(parseGradesCsv(sheet), key);
    expect(aggs.find((a) => a.modelKey === "m1")?.meanScore).toBe(4.5);
    expect(aggs.find((a) => a.modelKey === "m2")?.meanScore).toBe(4);
    expect(recommend(aggs).winner).toBe("m1");
  });

  it("elimina quem violou RN-023, quem tem < 100% válidas e quem passa do p95 ou do custo; empate vai ao mais barato", () => {
    const viol = sheet.replace("c1,1,X,4,5,,,", "c1,1,X,4,5,sim,,");
    expect(recommend(aggregateGrades(parseGradesCsv(viol), key)).winner).toBe("m2");
    const invalid = { ...key, metrics: { ...key.metrics, m1: { validPct: 96.7, p95Ms: 5000, avgCostUsd: 0.01 } } };
    expect(recommend(aggregateGrades(parseGradesCsv(sheet), invalid)).winner).toBe("m2");
    const slow = { ...key, metrics: { ...key.metrics, m1: { validPct: 100, p95Ms: 20_001, avgCostUsd: 0.01 } } };
    expect(recommend(aggregateGrades(parseGradesCsv(sheet), slow)).winner).toBe("m2");
    const dear = { ...key, metrics: { ...key.metrics, m1: { validPct: 100, p95Ms: 5000, avgCostUsd: 0.0201 } } };
    expect(recommend(aggregateGrades(parseGradesCsv(sheet), dear)).winner).toBe("m2");
    const tie = sheet.replace("c1,1,X,4,5,,,", "c1,1,X,4,4,,,").replace("c2,1,Y,5,4,,,", "c2,1,Y,4,4,,,");
    expect(recommend(aggregateGrades(parseGradesCsv(tie), key)).winner).toBe("m2"); // 4 = 4, m2 é mais barato
  });

  it("main --summarize-grades grava só agregações no doc (sem texto, sem respostas)", async () => {
    const { deps, files } = setup();
    files.set("k.json", JSON.stringify(key));
    files.set("s.csv", sheet.replace("c1,1,X,4,5,,,", "c1,1,X,4,5,,,comentário livre do avaliador"));
    expect(await main(["--summarize-grades", "s.csv", "k.json"], {}, deps)).toBe(0);
    const doc = files.get(DOC) ?? "";
    expect(doc).toContain("| m1 | 4 | 4.50 | 0 |");
    expect(doc).not.toContain("comentário livre");
    expect(doc).not.toContain("summary");
    expect(doc).toContain("RESULTADO REAL INTACTO");
  });
});

describe("--dry-run e parseArgs", () => {
  it("--dry-run não grava nada, mesmo com --save-outputs", async () => {
    const { deps, files } = setup();
    expect(await main(["--dry-run", "--save-outputs"], {}, deps)).toBe(0);
    expect(files.size).toBe(0);
  });
  it("--save-outputs usa o padrão eval-output e aceita diretório", () => {
    expect(parseArgs(["--save-outputs"]).saveOutputs).toBe("eval-output");
    expect(parseArgs(["--save-outputs", "x/y"]).saveOutputs).toBe("x/y");
    expect(parseArgs(["--fake"]).fake).toBe(true);
  });
});

describe("--fake", () => {
  it("roda 5 casos x 3 rodadas x 2 modelos, anonimiza, separa key.json e não toca o doc versionado", async () => {
    const { deps, files, logs } = setup();
    expect(await main(["--fake", "--save-outputs", "out"], {}, deps)).toBe(0);
    const blind = [...files.keys()].filter((k) => /^out\/case-.*-r\d-[XY]\.json$/.test(k));
    expect(blind).toHaveLength(30);
    for (const k of blind) {
      const body = files.get(k) ?? "";
      expect(body).not.toMatch(/fake-a|fake-b|usage|inputTokens|latency|apiKey|API_KEY/i);
      expect(Object.keys(JSON.parse(body))).toEqual(["caseId", "round", "label", "output", "rn023Flags"]);
    }
    const key = JSON.parse(files.get("out-key/key.json") ?? "") as EvalKey & { fake?: boolean };
    expect(key.fake).toBe(true);
    expect(Object.values(key.assignments)).toHaveLength(5);
    expect(Object.keys(key.metrics).sort()).toEqual(["fake-a", "fake-b"]);
    expect(key.metrics["fake-a"].validPct).toBe(100);
    const csv = files.get("out/notas-template.csv") ?? "";
    expect(csv.trim().split("\n")).toHaveLength(31);
    expect(csv).not.toMatch(/fake-/);
    const report = files.get("out-key/relatorio-fake.md") ?? "";
    expect(report).toContain(FAKE_BANNER);
    expect(report).toContain("| fake-a | 15 |");
    expect(report).toContain("| fake-b | 15 |");
    expect(files.has(DOC)).toBe(false);
    expect(logs.join("\n")).toContain("FAKE");
  });

  it("recusa combinar com provedor real", async () => {
    for (const [argv, env] of [
      [["--fake", "--confirm-spend"], {}],
      [["--fake"], { EVAL_CONFIRM_SPEND: "yes-eval-spend" }],
      [["--fake"], { AI_PROVIDER: "ai-sdk" }],
    ] as const) {
      const { deps, files } = setup();
      expect(await main(argv, env, deps)).toBe(1);
      expect(files.size).toBe(0);
    }
  });

  it("ensaia o fluxo: --summarize-grades com key fake vai para arquivo separado, não para o doc", async () => {
    const { deps, files } = setup();
    await main(["--fake", "--save-outputs", "out"], {}, deps);
    // Planilha de exemplo sintética: todos os retornos com nota 4 (avaliador 1) e 5 (avaliador 2).
    const rows = (files.get("out/notas-template.csv") ?? "")
      .trim()
      .split("\n")
      .map((l, i) => (i === 0 ? l : l.replace(/,,,,,$/, ",4,5,,,")));
    files.set("out/notas.csv", rows.join("\n"));
    expect(await main(["--summarize-grades", "out/notas.csv", "out-key/key.json"], {}, deps)).toBe(0);
    const resumo = files.get("out-key/resumo-notas-fake.md") ?? "";
    expect(resumo).toContain(FAKE_BANNER);
    expect(resumo).toContain("| fake-a | 30 | 4.50 |"); // 15 retornos x 2 notas (4 e 5)
    expect(files.has(DOC)).toBe(false);
  });
});

// Garante que o modelo fake base segue sendo usado (sem rede) como alicerce das variantes.
describe("base", () => {
  it("FakeEssayModel é determinístico", async () => {
    const input = { topic: { title: "t", motivatingText: "m" }, part: "introduction" as const, text: "texto" };
    const m = new FakeEssayModel();
    expect((await m.generate(input)).output).toEqual((await m.generate(input)).output);
  });
});
