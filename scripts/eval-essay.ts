/**
 * Avaliação D-010 (T17): compara 2 modelos de IA no retorno de redação.
 * 5 casos x 3 rodadas x 2 modelos = 30 chamadas, pelo MESMO adapter e prompt v1.
 *
 * Uso:
 *   pnpm eval:essay --dry-run                       (valida corpus, prompt e config; NÃO chama provedor)
 *   AI_PROVIDER=ai-sdk EVAL_CONFIRM_SPEND=yes-eval-spend \
 *     ANTHROPIC_API_KEY=... GOOGLE_GENERATIVE_AI_API_KEY=... pnpm eval:essay --confirm-spend
 *
 * Gasta dinheiro de verdade: exige a flag --confirm-spend E a env EVAL_CONFIRM_SPEND=yes-eval-spend.
 * As chaves vêm do ambiente do shell (nunca de arquivo .env, nunca impressas). Limite duro de 30
 * chamadas, sem laço de repetição. Grava só métricas em docs/arquitetura/avaliacao-modelos.md:
 * sem chave, sem resposta bruta do modelo, sem o texto completo do aluno.
 *
 * Nota cega (2 pessoas, RN-023 eliminatório):
 *   ... pnpm eval:essay --confirm-spend --save-outputs [dir]   (padrão eval-output/, git-ignorado)
 *     grava case-<id>-r<rodada>-<X|Y>.json anonimizados e notas-template.csv em <dir>; key.json em <dir>-key (SEPARADO, nunca entregar).
 *   pnpm eval:essay --summarize-grades <planilha.csv> <key.json> [--allow-partial]
 *     agrega as notas por modelo no doc (sem texto, sem respostas) e recomenda pela regra do plano.
 * Sem `server-only` de propósito: roda sob tsx.
 */
import { randomInt } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { EssayTopicsJsonSchema } from "../src/contracts/content";
import { EssayFeedbackAISchema, EssayPartSchema, type EssayFeedbackAI } from "../src/contracts/essay";
import { MAX_OUTPUT_TOKENS } from "../src/server/ai/ai-sdk-essay-model";
import { createAiSdkEssayModel, PROVIDER_KEY_ENV, type EssayEnv } from "../src/server/ai/factory";
import {
  computeCostUsd,
  type CostSpec,
  ESSAY_MODEL_KEYS,
  ESSAY_MODELS,
  type EssayModelSpec,
} from "../src/server/ai/models";
import { essayFeedbackV1 } from "../src/server/ai/prompts/essay-feedback.v1";
import {
  EssayModelError,
  type EssayFeedbackInput,
  type EssayFeedbackModel,
} from "../src/server/ai/types";
import { createFakeEvalModel, FAKE_BANNER, FAKE_EVAL_KEYS, FAKE_EVAL_SPECS } from "./lib/eval-fake";
import {
  aggregateGrades,
  assignBlindLabels,
  blindFileName,
  checkGrades,
  computeRn023Flags,
  FIXED_FILE_TIME,
  isFakeKey,
  labelFor,
  parseEvalKey,
  parseGradesCsv,
  partialWarning,
  recommend,
  renderGradesReport,
  renderGradesTemplate,
  replaceGradesBlock,
  resolveInsideCwd,
  shuffleBySeed,
  type BlindOutputFile,
  type EvalKey,
  type Recommendation,
} from "./lib/eval-outputs";

export const HARD_CALL_LIMIT = 30;
export const ROUNDS = 3;
export const CONFIRM_ENV_VALUE = "yes-eval-spend";
export const RESULTS_START = "<!-- EVAL-RESULTS:START -->";
export const RESULTS_END = "<!-- EVAL-RESULTS:END -->";

// ---- corpus ----

export const CorpusSchema = z.object({
  description: z.string().optional(),
  cases: z
    .array(
      z.object({
        id: z.string().min(1),
        author: z.literal("Aluno Demo"),
        topicSlug: z.string().min(1),
        part: EssayPartSchema,
        text: z.string().min(200),
        expected: z.string().min(1),
      }),
    )
    .length(5),
});
export type Corpus = z.infer<typeof CorpusSchema>;

export interface EvalCase {
  id: string;
  expected: string;
  input: EssayFeedbackInput;
}

/** Valida o corpus e o junta aos temas oficiais. Lança com mensagem clara (sem texto do aluno). */
export function buildCases(corpusRaw: unknown, topicsRaw: unknown): EvalCase[] {
  const corpus = CorpusSchema.safeParse(corpusRaw);
  if (!corpus.success) {
    const problems = corpus.error.issues
      .map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`)
      .join("; ");
    throw new Error(`corpus-d010.json inválido: ${problems}`);
  }
  const topics = EssayTopicsJsonSchema.safeParse(topicsRaw);
  if (!topics.success) throw new Error("essay-topics.json inválido.");
  const bySlug = new Map(topics.data.topics.map((t) => [t.slug, t]));
  const ids = new Set<string>();
  return corpus.data.cases.map((c) => {
    if (ids.has(c.id)) throw new Error(`corpus-d010.json: id repetido "${c.id}".`);
    ids.add(c.id);
    const topic = bySlug.get(c.topicSlug);
    if (!topic) throw new Error(`corpus-d010.json: caso "${c.id}" usa topicSlug inexistente.`);
    return {
      id: c.id,
      expected: c.expected,
      input: {
        topic: { title: topic.title, motivatingText: topic.motivatingText },
        part: c.part,
        text: c.text,
      },
    };
  });
}

// ---- métricas (puras) ----

/** Percentil por posto mais próximo (nearest-rank). Lista vazia devolve null. */
export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[Math.min(rank, sorted.length) - 1];
}

export interface CallRecord {
  caseId: string;
  round: number;
  valid: boolean;
  /** Só para falhas: código tipado do adapter (nunca mensagem do provedor). */
  errorCode?: string;
  latencyMs: number | null;
  costUsd: number | null;
}

export interface ModelRun {
  modelKey: string;
  spec: EssayModelSpec | null;
  calls: CallRecord[];
}

export interface ModelSummary {
  modelKey: string;
  calls: number;
  validPct: number;
  p50Ms: number | null;
  p95Ms: number | null;
  avgCostUsd: number | null;
}

export function summarize(run: ModelRun): ModelSummary {
  const valid = run.calls.filter((c) => c.valid);
  const latencies = valid.flatMap((c) => (c.latencyMs === null ? [] : [c.latencyMs]));
  const costs = run.calls.flatMap((c) => (c.costUsd === null ? [] : [c.costUsd]));
  return {
    modelKey: run.modelKey,
    calls: run.calls.length,
    validPct: run.calls.length === 0 ? 0 : (valid.length / run.calls.length) * 100,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    avgCostUsd: costs.length === 0 ? null : costs.reduce((a, b) => a + b, 0) / costs.length,
  };
}

/** Estimativa de custo MÁXIMO (entrada estimada por caracteres + teto de tokens de saída). */
export function estimateMaxCostUsd(
  specs: readonly CostSpec[],
  cases: readonly EvalCase[],
  rounds: number,
  at: Date = new Date(),
): number {
  let total = 0;
  for (const spec of specs) {
    for (const c of cases) {
      const chars = essayFeedbackV1.system.length + essayFeedbackV1.buildUser(c.input).length;
      // Conservador: 2 caracteres por token em português (a média real fica perto de 3,5 a 4).
      const inputTokens = Math.ceil(chars / 2);
      total += rounds * computeCostUsd(spec, { inputTokens, outputTokens: MAX_OUTPUT_TOKENS }, at);
    }
  }
  return total;
}

// ---- execução ----

export interface RunEvalOptions {
  cases: readonly EvalCase[];
  models: readonly { modelKey: string; spec: EssayModelSpec | null; model: EssayFeedbackModel }[];
  rounds: number;
  hardLimit?: number;
  onProgress?: (line: string) => void;
  /** Chamado só para retorno VÁLIDO, com o objeto estruturado (nunca vai para o doc nem para log). */
  onOutput?: (info: { modelKey: string; caseId: string; round: number; output: EssayFeedbackAI }) => void;
}

/** Sequencial, sem retentativa, com limite duro de chamadas. Registra só metadados. */
export async function runEval(options: RunEvalOptions): Promise<ModelRun[]> {
  const hardLimit = options.hardLimit ?? HARD_CALL_LIMIT;
  const planned = options.cases.length * options.rounds * options.models.length;
  if (planned > hardLimit) {
    throw new Error(`Plano de ${planned} chamadas excede o limite duro de ${hardLimit}.`);
  }
  const runs: ModelRun[] = [];
  let made = 0;
  for (const m of options.models) {
    const calls: CallRecord[] = [];
    for (const c of options.cases) {
      for (let round = 1; round <= options.rounds; round++) {
        if (made >= hardLimit) throw new Error(`Limite duro de ${hardLimit} chamadas atingido.`);
        made += 1;
        let record: CallRecord;
        try {
          const result = await m.model.generate(c.input);
          const parsed = EssayFeedbackAISchema.safeParse(result.output);
          const valid = parsed.success;
          if (parsed.success) {
            options.onOutput?.({ modelKey: m.modelKey, caseId: c.id, round, output: parsed.data });
          }
          record = {
            caseId: c.id,
            round,
            valid,
            errorCode: valid ? undefined : "INVALID_OUTPUT",
            latencyMs: result.latencyMs,
            costUsd: m.spec ? computeCostUsd(m.spec, result.usage) : null,
          };
        } catch (error) {
          const code = error instanceof EssayModelError ? error.code : "UNAVAILABLE";
          const usage = error instanceof EssayModelError ? error.usage : undefined;
          record = {
            caseId: c.id,
            round,
            valid: false,
            errorCode: code,
            latencyMs: null,
            costUsd: m.spec && usage ? computeCostUsd(m.spec, usage) : null,
          };
        }
        calls.push(record);
        options.onProgress?.(
          `${m.modelKey} ${c.id} rodada ${round}: ${record.valid ? "ok" : `falha ${record.errorCode}`}`,
        );
      }
    }
    runs.push({ modelKey: m.modelKey, spec: m.spec, calls });
  }
  return runs;
}

// ---- relatório ----

function fmtMs(v: number | null): string {
  return v === null ? "-" : `${Math.round(v)} ms`;
}
function fmtUsd(v: number | null): string {
  return v === null ? "-" : `US$ ${v.toFixed(5)}`;
}

/** Bloco de resultados (tabelas). Sem chave, sem resposta bruta, sem texto do aluno. */
export function renderResults(runs: readonly ModelRun[], cases: readonly EvalCase[], dateIso: string): string {
  const lines: string[] = [];
  lines.push(`Execução em ${dateIso}. Prompt \`${essayFeedbackV1.version}\`. Colunas de nota e RN-023 são preenchidas à mão.`, "");
  lines.push("### Métricas por modelo", "");
  lines.push("| Modelo | Chamadas | Saídas válidas | p50 | p95 | Custo médio por retorno | Nota cega A (1–5) | Nota cega B (1–5) | RN-023 violada? (eliminatório) |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const run of runs) {
    const s = summarize(run);
    lines.push(
      `| ${s.modelKey} | ${s.calls} | ${s.validPct.toFixed(1)}% | ${fmtMs(s.p50Ms)} | ${fmtMs(s.p95Ms)} | ${fmtUsd(s.avgCostUsd)} |  |  |  |`,
    );
  }
  lines.push("", "### Por caso (rodadas válidas de 3)", "");
  lines.push("| Caso | O que testa | Modelo | Rodadas válidas | Nota cega A (1–5) | Nota cega B (1–5) | RN-023 violada? |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const c of cases) {
    for (const run of runs) {
      const mine = run.calls.filter((x) => x.caseId === c.id);
      const ok = mine.filter((x) => x.valid).length;
      lines.push(`| ${c.id} | ${c.expected.split(":")[0]} | ${run.modelKey} | ${ok}/${mine.length} |  |  |  |`);
    }
  }
  return lines.join("\n");
}

/** Troca o bloco entre os marcadores; falha se o doc não os tiver. */
export function replaceResultsBlock(doc: string, block: string): string {
  const start = doc.indexOf(RESULTS_START);
  const end = doc.indexOf(RESULTS_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("avaliacao-modelos.md sem os marcadores EVAL-RESULTS.");
  }
  return `${doc.slice(0, start + RESULTS_START.length)}\n\n${block}\n\n${doc.slice(end)}`;
}

// ---- CLI ----

export interface EvalArgs {
  dryRun: boolean;
  confirmSpend: boolean;
  /** Diretório de saída dos retornos anonimizados (só na execução real). */
  saveOutputs?: string;
  summarizeGrades?: { sheet: string; key: string };
  /** Só com --summarize-grades: aceita planilha incompleta, com aviso grande no resultado. */
  allowPartial: boolean;
  /** Ensaio sem chave, sem rede e sem custo, com 2 modelos falsos. Nunca vale para D-010. */
  fake: boolean;
  /** Apaga só os arquivos de saída conhecidos de uma execução anterior nas pastas de saída. */
  overwriteOutput?: boolean;
}

export const DEFAULT_OUTPUT_DIR = "eval-output";

export function parseArgs(argv: readonly string[]): EvalArgs {
  const args: EvalArgs = { dryRun: false, confirmSpend: false, fake: false, allowPartial: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--save-outputs") {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args.saveOutputs = next;
        i += 1;
      } else {
        args.saveOutputs = DEFAULT_OUTPUT_DIR;
      }
    } else if (a === "--summarize-grades") {
      const sheet = argv[i + 1];
      const key = argv[i + 2];
      if (!sheet || !key || sheet.startsWith("--") || key.startsWith("--")) {
        throw new Error("Use --summarize-grades <planilha.csv> <key.json>.");
      }
      args.summarizeGrades = { sheet, key };
      i += 2;
    } else if (a === "--overwrite-output") {
      args.overwriteOutput = true;
    } else if (a === "--allow-partial") {
      args.allowPartial = true;
    } else if (a === "--fake") {
      args.fake = true;
    } else if (a === "--dry-run") {
      args.dryRun = true;
    } else if (a === "--confirm-spend") {
      args.confirmSpend = true;
    } else {
      throw new Error(`Argumento desconhecido: ${a}. Use --dry-run, --fake, --confirm-spend, --save-outputs [dir] ou --summarize-grades <planilha> <key.json> [--allow-partial].`);
    }
  }
  if (args.allowPartial && !args.summarizeGrades) throw new Error("--allow-partial só vale com --summarize-grades.");
  return args;
}

export interface MainDeps {
  readJson: (relativePath: string) => unknown;
  readText: (relativePath: string) => string;
  writeText: (relativePath: string, content: string) => void;
  createModel: (modelKey: string, env: EssayEnv) => EssayFeedbackModel;
  log: (line: string) => void;
  now: () => Date;
  /** Semente do sorteio de rótulos cegos (uint32). Padrão: aleatória local, sem relação com nomes. */
  randomSeed?: () => number;
  /** Diretório de trabalho (padrão: process.cwd()). Caminhos de saída/entrada ficam dentro dele. */
  cwd?: () => string;
  /** true se o caminho é git-ignorado; lança se o git não estiver disponível. Padrão: git check-ignore. */
  isGitIgnored?: (relativePath: string) => boolean;
  /** Fixa mtime/atime dos arquivos (esconde a ordem de gravação). Padrão: utimesSync. */
  normalizeTimes?: (relativePaths: string[], date: Date) => void;
  /** Nomes dos arquivos já existentes numa pasta (vazio se não existe). Padrão: readdirSync. */
  listFiles?: (relativeDir: string) => string[];
  /** Apaga arquivos (só os de saída conhecidos, via --overwrite-output). Padrão: rmSync. */
  removeFiles?: (relativePaths: string[]) => void;
}

/** Únicos arquivos que o --overwrite-output pode apagar. */
export const OUTPUT_FILE_PATTERN = /^(case-.*\.json|notas-template\.csv|key\.json|relatorio-fake\.md|resumo-notas-fake\.md)$/;

function defaultListFiles(fullDir: string): string[] {
  return existsSync(fullDir) ? readdirSync(fullDir) : [];
}

/** git check-ignore -q: 0 = ignorado, 1 = não ignorado; qualquer outra coisa = git indisponível. */
export function gitCheckIgnored(relativePath: string, cwd: string = process.cwd()): boolean {
  const r = spawnSync("git", ["check-ignore", "-q", relativePath], { cwd });
  if (r.error || (r.status !== 0 && r.status !== 1)) {
    throw new Error("Não foi possível verificar o git-ignore (git indisponível); recusando gravar os retornos.");
  }
  return r.status === 0;
}

const DOC_PATH = "docs/arquitetura/avaliacao-modelos.md";

function defaultDeps(): MainDeps {
  return {
    readJson: (p) => JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8")) as unknown,
    readText: (p) => readFileSync(resolve(process.cwd(), p), "utf8"),
    writeText: (p, c) => {
      const full = resolve(process.cwd(), p);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, c, "utf8");
    },
    createModel: (key, env) => createAiSdkEssayModel(key, env),
    log: (line) => console.log(line),
    now: () => new Date(),
    randomSeed: () => randomInt(0, 2 ** 32),
  };
}

/** Devolve o código de saída. Nunca imprime valores de chave. */
export async function main(
  argv: readonly string[],
  env: EssayEnv,
  deps: MainDeps = defaultDeps(),
): Promise<number> {
  const { log } = deps;
  let args: EvalArgs;
  try {
    args = parseArgs(argv);
    if (args.summarizeGrades) {
      if (args.dryRun || args.confirmSpend || args.fake || args.overwriteOutput || args.saveOutputs !== undefined) {
        throw new Error("--summarize-grades não combina com outras flags (não chama provedor).");
      }
      const cwd = deps.cwd?.() ?? process.cwd();
      const keyPath = resolveInsideCwd(args.summarizeGrades.key, cwd);
      const sheetPath = resolveInsideCwd(args.summarizeGrades.sheet, cwd);
      const key = parseEvalKey(JSON.parse(deps.readText(keyPath)) as unknown);
      const rows = parseGradesCsv(deps.readText(sheetPath));
      const aggs = aggregateGrades(rows, key, { allowPartial: args.allowPartial });
      const warning = args.allowPartial ? partialWarning(checkGrades(rows, key)) : null;
      // Planilha parcial nunca gera recomendação (nem no doc versionado).
      const rec: Recommendation =
        warning !== null ? { winner: null, lines: ["Sem recomendação: planilha parcial."] } : recommend(aggs);
      const report = renderGradesReport(aggs, rec, deps.now().toISOString(), warning);
      if (isFakeKey(key)) {
        // Key de ensaio: NUNCA toca o doc versionado; resumo separado, na pasta da key (git-ignorada).
        const fakeReport = `${FAKE_BANNER}\n\n${report}\n`;
        const out = `${dirname(keyPath)}/resumo-notas-fake.md`;
        const ignored = deps.isGitIgnored ?? ((p: string) => gitCheckIgnored(p, cwd));
        if (!ignored(out)) {
          throw new Error(`"${out}" não está git-ignorado; recusando gravar o resumo fake (adicione ao .gitignore).`);
        }
        log(fakeReport);
        deps.writeText(out, fakeReport);
        log(`${FAKE_BANNER}. Resumo gravado em ${out}; ${DOC_PATH} não foi alterado.`);
        return 0;
      }
      log(report);
      deps.writeText(DOC_PATH, replaceGradesBlock(deps.readText(DOC_PATH), report));
      log(`Agregação gravada em ${DOC_PATH} (só médias e contagens).`);
      return 0;
    }
    const cases = buildCases(deps.readJson("content/essays/corpus-d010.json"), deps.readJson("content/essay-topics.json"));
    if (args.fake && (args.confirmSpend || env.EVAL_CONFIRM_SPEND || env.AI_PROVIDER?.trim().toLowerCase() === "ai-sdk")) {
      throw new Error("--fake não pode ser combinado com provedor real (--confirm-spend, EVAL_CONFIRM_SPEND ou AI_PROVIDER=ai-sdk).");
    }
    const keys: readonly string[] = args.fake ? FAKE_EVAL_KEYS : ESSAY_MODEL_KEYS;
    const specMap: Record<string, EssayModelSpec> = args.fake ? FAKE_EVAL_SPECS : ESSAY_MODELS;
    const specs = keys.map((k) => specMap[k]);
    const planned = cases.length * ROUNDS * keys.length;
    if (planned > HARD_CALL_LIMIT) throw new Error(`Plano de ${planned} chamadas excede o limite duro de ${HARD_CALL_LIMIT}.`);
    const maxCost = estimateMaxCostUsd(specs, cases, ROUNDS);
    const keyVars = args.fake ? [] : [...new Set(specs.map((s) => PROVIDER_KEY_ENV[s.provider]))];
    const missing = keyVars.filter((v) => !env[v]);

    if (args.fake) log(`${FAKE_BANNER}. Modelos falsos, sem rede, sem chave e sem custo.`);
    log(`Prompt: ${essayFeedbackV1.version}. Casos: ${cases.length}. Rodadas: ${ROUNDS}. Modelos: ${keys.join(", ")}.`);
    log(`Chamadas planejadas: ${planned} (limite duro ${HARD_CALL_LIMIT}). Custo MÁXIMO estimado: US$ ${maxCost.toFixed(4)}.`);

    if (args.dryRun) {
      log("Dry-run: corpus, prompt e config válidos; nenhum provedor foi chamado.");
      if (missing.length > 0) log(`Variáveis de chave ausentes (necessárias na execução real): ${missing.join(", ")}.`);
      return 0;
    }

    if (!args.fake && (!args.confirmSpend || env.EVAL_CONFIRM_SPEND !== CONFIRM_ENV_VALUE)) {
      throw new Error(`Esta execução GASTA dinheiro. Confirme com a flag --confirm-spend e a env EVAL_CONFIRM_SPEND=${CONFIRM_ENV_VALUE}. Use --dry-run para validar sem gastar.`);
    }
    if (!args.fake && env.AI_PROVIDER?.trim().toLowerCase() !== "ai-sdk") {
      throw new Error("AI_PROVIDER deve ser 'ai-sdk' para o eval real (com 'fake' não há o que comparar).");
    }
    if (!args.fake && missing.length > 0) {
      throw new Error(`Faltam as variáveis de chave: ${missing.join(", ")}.`);
    }

    // Pastas: retornos cegos em <dir>; key.json (e relatório fake) em <dir>-key, IRMÃ e separada.
    const cwd = deps.cwd?.() ?? process.cwd();
    const outDir = resolveInsideCwd(args.saveOutputs ?? DEFAULT_OUTPUT_DIR, cwd);
    const keyDir = `${outDir}-key`;
    resolveInsideCwd(keyDir, cwd);
    if (args.saveOutputs !== undefined) {
      // A key nunca pode ficar dentro da pasta entregue (nem o contrário).
      const a = `${outDir.toLowerCase()}/`;
      const b = `${keyDir.toLowerCase()}/`;
      // Pasta aninhada (a/b): a key (a/b-key) ficaria dentro de "a", que pode ser a entregue. Só 1 nível.
      if (b.startsWith(a) || a.startsWith(b) || outDir.includes("/")) {
        throw new Error(`A pasta da key ("${keyDir}") ficaria aninhada com a pasta de retornos ("${outDir}"); use um --save-outputs sem subpastas (ex.: eval-output).`);
      }
    }
    if (args.saveOutputs !== undefined || args.fake) {
      const ignored = deps.isGitIgnored ?? ((p: string) => gitCheckIgnored(p, cwd));
      const dirs = args.saveOutputs !== undefined ? [outDir, keyDir] : [keyDir];
      for (const d of dirs) {
        if (!ignored(`${d}/.probe`)) {
          throw new Error(`O diretório "${d}" não está git-ignorado; recusando gravar (adicione ao .gitignore).`);
        }
      }
      // Saída antiga (p.ex. de um ensaio --fake) não pode se misturar com a execução nova.
      const list = deps.listFiles ?? ((d: string) => defaultListFiles(resolve(cwd, d)));
      for (const d of dirs) {
        const existing = list(d);
        if (existing.length === 0) continue;
        if (!args.overwriteOutput) {
          throw new Error(`O diretório "${d}" já contém arquivos. Apague-o ou use --overwrite-output (apaga só case-*.json, notas-template.csv, key.json, relatorio-fake.md e resumo-notas-fake.md).`);
        }
        const known = existing.filter((f) => OUTPUT_FILE_PATTERN.test(f));
        (deps.removeFiles ?? ((ps: string[]) => ps.forEach((q) => rmSync(resolve(cwd, q), { force: true }))))(known.map((f) => `${d}/${f}`));
      }
    }

    const models = keys.map((k) => ({
      modelKey: k,
      spec: specMap[k] as EssayModelSpec,
      model: args.fake ? createFakeEvalModel(k) : deps.createModel(k, env),
    }));
    const collected: { modelKey: string; caseId: string; round: number; output: EssayFeedbackAI }[] = [];
    const runs = await runEval({
      cases,
      models,
      rounds: ROUNDS,
      onProgress: log,
      onOutput: args.saveOutputs !== undefined ? (o) => collected.push(o) : undefined,
    });
    if (args.saveOutputs !== undefined) {
      const seed = (deps.randomSeed ?? (() => randomInt(0, 2 ** 32)))();
      const assignments = assignBlindLabels(cases.map((c) => c.id), [keys[0], keys[1]], seed);
      const dir = outDir;
      const rows: { caseId: string; round: number; label: "X" | "Y" }[] = [];
      const pending: { path: string; content: string }[] = [];
      for (const o of collected) {
        const label = labelFor(assignments, o.caseId, o.modelKey);
        const input = cases.find((c) => c.id === o.caseId)?.input;
        const file: BlindOutputFile = {
          caseId: o.caseId,
          round: o.round,
          label,
          output: o.output,
          rn023Flags: computeRn023Flags(input?.text ?? "", o.output),
        };
        pending.push({
          path: `${dir}/${blindFileName(o.caseId, o.round, label)}`,
          content: `${JSON.stringify(file, null, 2)}\n`,
        });
        rows.push({ caseId: o.caseId, round: o.round, label });
      }
      // Ordem de gravação alfabética + embaralhada pela semente (nunca agrupada por modelo) e
      // mtime/atime fixos: a ordem de coleta (um modelo inteiro, depois o outro) não vaza.
      const written = shuffleBySeed(pending, seed, (f) => f.path);
      for (const f of written) deps.writeText(f.path, f.content);
      deps.writeText(`${dir}/notas-template.csv`, renderGradesTemplate(rows));
      const toTouch = [...written.map((f) => f.path), `${dir}/notas-template.csv`];
      (deps.normalizeTimes ?? ((ps, d) => ps.forEach((q) => utimesSync(resolve(cwd, q), d, d))))(toTouch, FIXED_FILE_TIME);
      const metrics: EvalKey["metrics"] = {};
      for (const run of runs) {
        const s = summarize(run);
        metrics[run.modelKey] = { validPct: s.validPct, p50Ms: s.p50Ms, p95Ms: s.p95Ms, avgCostUsd: s.avgCostUsd };
      }
      const evalKey: EvalKey = {
        note: `${args.fake ? `${FAKE_BANNER}. ` : ""}NÃO abrir antes de terminar as notas: mapeia rótulo cego para modelo.`,
        ...(args.fake ? { fake: true as const } : {}),
        seed,
        promptVersion: essayFeedbackV1.version,
        assignments,
        rounds: ROUNDS,
        rows: [...rows].sort((a, b) => a.caseId.localeCompare(b.caseId) || a.round - b.round || a.label.localeCompare(b.label)),
        metrics,
      };
      deps.writeText(`${keyDir}/key.json`, `${JSON.stringify(evalKey, null, 2)}\n`);
      log(`${collected.length} retornos anonimizados + notas-template.csv em ${dir}/ (entregue SÓ esta pasta aos avaliadores); key.json em ${keyDir}/ (nunca entregar; ambas git-ignoradas; não abrir antes das notas).`);
    }
    const block = renderResults(runs, cases, deps.now().toISOString());
    if (args.fake) {
      // Relatório fake SEMPRE separado, na pasta git-ignorada; o doc versionado não é tocado.
      const path = `${keyDir}/relatorio-fake.md`;
      deps.writeText(path, `${FAKE_BANNER}\n\n${block}\n`);
      log(`${FAKE_BANNER}. Relatório em ${path}; ${DOC_PATH} não foi alterado.`);
      return 0;
    }
    deps.writeText(DOC_PATH, replaceResultsBlock(deps.readText(DOC_PATH), block));
    log(`Tabela gravada em ${DOC_PATH}. Preencha à mão as notas cegas e a marca RN-023.`);
    return 0;
  } catch (error) {
    log(`Erro: ${error instanceof Error ? error.message : "falha desconhecida"}`);
    return 1;
  }
}

if (process.argv[1] && /eval-essay\.[cm]?[jt]s$/.test(process.argv[1])) {
  main(process.argv.slice(2), process.env).then((code) => {
    process.exitCode = code;
  });
}
