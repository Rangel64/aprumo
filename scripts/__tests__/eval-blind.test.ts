import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { FAKE_BANNER } from "../lib/eval-fake";
import {
  FIXED_FILE_TIME,
  GRADES_END,
  GRADES_START,
  aggregateGrades,
  isFakeKey,
  parseEvalKey,
  parseGradesCsv,
  resolveInsideCwd,
  type EvalKey,
} from "../lib/eval-outputs";
import { gitCheckIgnored, main, parseArgs, RESULTS_END, RESULTS_START, type MainDeps } from "../eval-essay";

const readReal = (p: string): unknown =>
  JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8")) as unknown;

// Doc de fixture (NÃO o docs/arquitetura/avaliacao-modelos.md vivo).
const DOC_FIXTURE = `# fixture\n\n${RESULTS_START}\n\nRESULTADO REAL INTACTO\n\n${RESULTS_END}\n\n${GRADES_START}\n\nnotas reais intactas\n\n${GRADES_END}\n`;
const DOC = "docs/arquitetura/avaliacao-modelos.md";
const HEADER =
  "caso,rodada,rotulo,nota_avaliador_1,nota_avaliador_2,violou_RN023_avaliador_1,violou_RN023_avaliador_2,observacao";

function setup(randomSeed = 42) {
  const files = new Map<string, string>();
  const logs: string[] = [];
  const touched: { paths: string[]; date: Date }[] = [];
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
    normalizeTimes: (paths, date) => void touched.push({ paths, date }),
    listFiles: (d) => [...files.keys()].filter((k) => k.startsWith(`${d}/`)).map((k) => k.slice(d.length + 1)),
    removeFiles: (ps) => ps.forEach((p) => files.delete(p)),
  };
  return { files, logs, deps, touched };
}

describe("cegueira por ordem de escrita e mtime (--fake)", () => {
  it("a ordem de gravação não agrupa por modelo e o mtime/atime é fixo", async () => {
    const { deps, files, touched } = setup(42);
    expect(await main(["--fake", "--save-outputs", "out"], {}, deps)).toBe(0);
    const key = parseEvalKey(JSON.parse(files.get("out-key/key.json") ?? ""));
    const order = [...files.keys()].filter((k) => /^out\/case-.*-r\d-[XY]\.json$/.test(k));
    expect(order).toHaveLength(30);
    const models = order.map((k) => {
      const m = /^out\/case-(.*)-r\d-([XY])\.json$/.exec(k);
      return key.assignments[m?.[1] ?? ""][(m?.[2] ?? "X") as "X" | "Y"];
    });
    // Sem o embaralhamento seriam 15 de um modelo e depois 15 do outro (1 única troca).
    expect(new Set(models.slice(0, 15)).size).toBe(2);
    const switches = models.filter((m, i) => i > 0 && m !== models[i - 1]).length;
    expect(switches).toBeGreaterThan(4);
    // 30 retornos + notas-template.csv = 31 arquivos, todos com o mesmo instante fixo.
    expect(touched).toHaveLength(1);
    expect(touched[0].paths).toHaveLength(31);
    expect(touched[0].date).toEqual(FIXED_FILE_TIME);
    // A ordem depende da semente, não da coleta.
    const other = setup(7);
    await main(["--fake", "--save-outputs", "out"], {}, other.deps);
    const order2 = [...other.files.keys()].filter((k) => /^out\/case-/.test(k));
    expect(order2).not.toEqual(order);
    expect([...order2].sort()).toEqual([...order].sort());
  });

  it("utimes real deixa mtime igual ao instante fixo (fs real, diretório temporário)", async () => {
    const { mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(resolve(tmpdir(), "evalt-"));
    try {
      const files = [1, 2, 3].map((i) => resolve(dir, `f${i}.json`));
      for (const f of files) writeFileSync(f, "{}");
      for (const f of files) utimesSync(f, FIXED_FILE_TIME, FIXED_FILE_TIME);
      const times = files.map((f) => statSync(f).mtimeMs);
      expect(new Set(times).size).toBe(1);
      expect(times[0]).toBe(FIXED_FILE_TIME.getTime());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("caminhos e git-ignore", () => {
  it("resolveInsideCwd recusa escape por .., absoluto fora e o próprio cwd", () => {
    const cwd = process.cwd();
    expect(resolveInsideCwd("a/b", cwd)).toBe("a/b");
    expect(resolveInsideCwd(resolve(cwd, "x", "y"), cwd)).toBe("x/y");
    expect(() => resolveInsideCwd("../fora", cwd)).toThrow(/fora do diretório/);
    expect(() => resolveInsideCwd("a/../../fora", cwd)).toThrow(/fora do diretório/);
    expect(() => resolveInsideCwd(resolve(cwd, "..", "fora"), cwd)).toThrow(/fora do diretório/);
    expect(() => resolveInsideCwd(".", cwd)).toThrow();
  });

  it("--save-outputs e --summarize-grades recusam caminho fora do repo, sem gravar", async () => {
    for (const argv of [
      ["--fake", "--save-outputs", "../fora"],
      ["--fake", "--save-outputs", resolve(process.cwd(), "..", "fora")],
      ["--summarize-grades", "../s.csv", "k.json"],
      ["--summarize-grades", "s.csv", "../k.json"],
    ]) {
      const { deps, files } = setup();
      files.set("s.csv", "x");
      files.set("k.json", "{}");
      const before = files.size;
      expect(await main(argv, {}, deps)).toBe(1);
      expect(files.size).toBe(before);
    }
  });

  it("--save-outputs recusa diretório não git-ignorado (ou git indisponível) antes de qualquer chamada", async () => {
    const unavailable = (): boolean => {
      throw new Error("git indisponível");
    };
    for (const isGitIgnored of [() => false, unavailable]) {
      const { deps, files, logs } = setup();
      const createModel = vi.fn();
      expect(await main(["--fake", "--save-outputs", "out"], {}, { ...deps, isGitIgnored, createModel })).toBe(1);
      expect(files.size).toBe(0);
      expect(createModel).not.toHaveBeenCalled();
      expect(logs.join("\n")).toMatch(/Erro:/);
      expect(logs.join("\n")).not.toContain("rodada 1: ok");
    }
    // Só a pasta cega ignorada não basta: a pasta da key também precisa estar.
    const { deps, files } = setup();
    expect(await main(["--fake", "--save-outputs", "out"], {}, { ...deps, isGitIgnored: (p) => p.startsWith("out/") })).toBe(1);
    expect(files.size).toBe(0);
  });

  it("git check-ignore real: eval-output-key/ e eval-output/ são ignorados; src/ não", () => {
    expect(gitCheckIgnored("eval-output-key/.probe")).toBe(true);
    expect(gitCheckIgnored("eval-output/.probe")).toBe(true);
    expect(gitCheckIgnored("src/.probe")).toBe(false);
  });
});

describe("planilha: validação estrita", () => {
  const key: EvalKey = {
    seed: 1,
    assignments: { c1: { X: "m1", Y: "m2" }, c2: { X: "m2", Y: "m1" } },
    rows: [
      { caseId: "c1", round: 1, label: "X" },
      { caseId: "c1", round: 1, label: "Y" },
      { caseId: "c2", round: 1, label: "X" },
      { caseId: "c2", round: 1, label: "Y" },
    ],
    metrics: {
      m1: { validPct: 100, p50Ms: 3000, p95Ms: 5000, avgCostUsd: 0.01 },
      m2: { validPct: 100, p50Ms: 4000, p95Ms: 6000, avgCostUsd: 0.005 },
    },
  };
  const full = [HEADER, "c1,1,X,4,5,,,", "c1,1,Y,4,4,,,", "c2,1,X,4,4,,,", "c2,1,Y,5,4,,,"];
  const agg = (lines: string[], opts?: { allowPartial?: boolean }) =>
    aggregateGrades(parseGradesCsv(lines.join("\n")), key, opts);

  it("planilha completa passa; o p50 vem do key", () => {
    expect(agg(full).find((a) => a.modelKey === "m1")?.p50Ms).toBe(3000);
  });

  it("violou_RN023: só sim, nao/não e vazio; typo é rejeitado com erro claro", () => {
    for (const ok of ["sim", "SIM", "nao", "não", ""]) {
      expect(() => parseGradesCsv([HEADER, `c1,1,X,4,5,${ok},,`].join("\n"))).not.toThrow();
    }
    expect(parseGradesCsv([HEADER, "c1,1,X,4,5,não,sim,"].join("\n"))[0].violated).toBe(true);
    expect(parseGradesCsv([HEADER, "c1,1,X,4,5,não,,"].join("\n"))[0].violated).toBe(false);
    for (const bad of ["sin", "x", "1", "true", "s"]) {
      expect(() => parseGradesCsv([HEADER, `c1,1,X,4,5,,${bad},`].join("\n"))).toThrow(
        /violou_RN023.*c1 rodada 1 rótulo X/,
      );
    }
  });

  it("notas só inteiras de 1 a 5", () => {
    for (const bad of ["0", "6", "4.5", "abc"]) {
      expect(() => parseGradesCsv([HEADER, `c1,1,X,${bad},5,,,`].join("\n"))).toThrow(/Nota inválida/);
    }
  });

  it("falta linha, nota ausente, duplicada e linha extra viram erro claro, sem recomendação", () => {
    expect(() => agg(full.slice(0, 4))).toThrow(/faltando \(1\): c2 rodada 1 rótulo Y/);
    expect(() => agg(full.map((l) => l.replace("c2,1,X,4,4,,,", "c2,1,X,4,,,,")))).toThrow(
      /sem as 2 notas: c2 rodada 1 rótulo X \(1 de 2 notas\)/,
    );
    expect(() => agg([...full, "c1,1,X,4,4,,,"])).toThrow(/duplicadas: c1 rodada 1 rótulo X/);
    expect(() => agg([...full, "c1,2,X,4,4,,,"])).toThrow(/não constam no template: c1 rodada 2 rótulo X/);
    expect(() => agg([...full, "c9,1,X,4,4,,,"])).toThrow(/não consta no key.json/);
  });

  it("sem rows no key, o esperado é caso x 3 rodadas x 2 rótulos", () => {
    // 2 casos x 3 rodadas x 2 rótulos = 12 linhas esperadas; a planilha tem 4, faltam 8.
    const noRows: EvalKey = { ...key, rows: undefined };
    expect(() => aggregateGrades(parseGradesCsv(full.join("\n")), noRows)).toThrow(/faltando \(8\)/);
  });

  it("--allow-partial aceita faltas com aviso grande, mas nunca duplicadas nem extras", async () => {
    expect(agg(full.slice(0, 4), { allowPartial: true })).toHaveLength(2);
    expect(() => agg([...full, "c1,1,X,4,4,,,"], { allowPartial: true })).toThrow(/duplicadas/);
    const { deps, files } = setup();
    files.set("k.json", JSON.stringify(key));
    files.set("s.csv", full.slice(0, 4).join("\n"));
    expect(await main(["--summarize-grades", "s.csv", "k.json"], {}, deps)).toBe(1);
    expect(files.has(DOC)).toBe(false);
    expect(await main(["--summarize-grades", "s.csv", "k.json", "--allow-partial"], {}, deps)).toBe(0);
    const doc = files.get(DOC) ?? "";
    expect(doc).toContain("RESULTADO PARCIAL, NÃO USE PARA DECIDIR");
    expect(doc).toContain("| p50 (ms) |");
    // Parcial nunca recomenda (nem no doc versionado).
    expect(doc).not.toContain("Recomendado");
    expect(doc).not.toMatch(/recomendado o mais barato/);
    expect(doc).toContain("Sem recomendação: planilha parcial.");
    expect(() => parseArgs(["--allow-partial"])).toThrow(/--summarize-grades/);
  });

  it("planilha com ponto-e-vírgula (Excel pt-BR) dá erro útil", () => {
    expect(() => parseGradesCsv(HEADER.replaceAll(",", ";") + "\nc1;1;X;;;;;")).toThrow(/separado por vírgulas/);
  });
});

describe("pastas de saída: aninhamento, conteúdo prévio e symlink", () => {
  it("recusa key aninhada com a pasta de retornos, antes de qualquer chamada", async () => {
    const { deps, files } = setup();
    const createModel = vi.fn();
    expect(await main(["--fake", "--save-outputs", "eval-output/sub"], {}, { ...deps, createModel })).toBe(1);
    expect(files.size).toBe(0);
    expect(createModel).not.toHaveBeenCalled();
  });

  it("recusa pasta com arquivos; --overwrite-output apaga só os conhecidos", async () => {
    const { deps, files, logs } = setup();
    expect(await main(["--fake", "--save-outputs", "out"], {}, deps)).toBe(0);
    expect(await main(["--fake", "--save-outputs", "out"], {}, deps)).toBe(1);
    expect(logs.join("\n")).toMatch(/já contém arquivos/);
    files.set("out/guardar.txt", "meu");
    expect(await main(["--fake", "--save-outputs", "out", "--overwrite-output"], {}, deps)).toBe(0);
    expect(files.get("out/guardar.txt")).toBe("meu");
    expect(files.has("out-key/key.json")).toBe(true);
  });

  it("resolveInsideCwd: '..x' é aceito, '..' recusado e symlink para fora recusado", async () => {
    const { mkdtempSync, mkdirSync, rmSync, symlinkSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const base = mkdtempSync(resolve(tmpdir(), "evalr-"));
    try {
      const cwd = resolve(base, "repo");
      const outside = resolve(base, "fora");
      mkdirSync(cwd);
      mkdirSync(outside);
      expect(resolveInsideCwd("..x/a", cwd)).toBe("..x/a");
      expect(() => resolveInsideCwd("../fora", cwd)).toThrow(/fora do diretório/);
      try {
        symlinkSync(outside, resolve(cwd, "link"), "junction");
      } catch {
        return; // não testável aqui: sem permissão para criar link
      }
      expect(() => resolveInsideCwd("link/saida", cwd)).toThrow(/fora do diretório/);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});

describe("key.json validado", () => {
  const good = {
    seed: 1,
    assignments: { c1: { X: "m1", Y: "m2" } },
    metrics: { m1: { validPct: 100, p95Ms: 1, avgCostUsd: 0.1 } },
  };

  it("exige seed, assignments e metrics com erro claro", () => {
    expect(parseEvalKey(good).seed).toBe(1);
    for (const field of ["seed", "assignments", "metrics"]) {
      const bad: Record<string, unknown> = { ...good };
      delete bad[field];
      expect(() => parseEvalKey(bad)).toThrow(new RegExp(`key.json inválido: .*${field}`));
    }
    expect(() => parseEvalKey({ ...good, metrics: { m1: { validPct: "x" } } })).toThrow(/key.json inválido/);
    expect(() => parseEvalKey({ ...good, fake: "sim" })).toThrow(/fake/);
  });

  it("main --summarize-grades com key sem campo obrigatório falha sem gravar", async () => {
    const { deps, files } = setup();
    files.set("k.json", JSON.stringify({ seed: 1 }));
    files.set("s.csv", HEADER);
    expect(await main(["--summarize-grades", "s.csv", "k.json"], {}, deps)).toBe(1);
    expect(files.has(DOC)).toBe(false);
  });

  it("é fake mesmo sem o campo fake, se os modelKeys forem fake-a/fake-b; nunca escreve no doc", async () => {
    expect(isFakeKey(parseEvalKey(good))).toBe(false);
    const fakeKey = {
      seed: 1,
      assignments: { c1: { X: "fake-a", Y: "fake-b" } },
      rows: [
        { caseId: "c1", round: 1, label: "X" },
        { caseId: "c1", round: 1, label: "Y" },
      ],
      metrics: {
        "fake-a": { validPct: 100, p95Ms: 1, avgCostUsd: 0.1 },
        "fake-b": { validPct: 100, p95Ms: 1, avgCostUsd: 0.2 },
      },
    };
    expect(isFakeKey(parseEvalKey(fakeKey))).toBe(true);
    const { deps, files } = setup();
    files.set("kk/key.json", JSON.stringify(fakeKey));
    files.set("kk/s.csv", [HEADER, "c1,1,X,4,4,,,", "c1,1,Y,5,5,,,"].join("\n"));
    expect(await main(["--summarize-grades", "kk/s.csv", "kk/key.json"], {}, deps)).toBe(0);
    expect(files.has(DOC)).toBe(false);
    expect(files.get("kk/resumo-notas-fake.md")).toContain(FAKE_BANNER);
  });
});
