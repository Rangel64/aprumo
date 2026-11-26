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
 * Sem `server-only` de propósito: roda sob tsx.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { EssayTopicsJsonSchema } from "../src/contracts/content";
import { EssayFeedbackAISchema, EssayPartSchema } from "../src/contracts/essay";
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
          const valid = EssayFeedbackAISchema.safeParse(result.output).success;
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
}

export function parseArgs(argv: readonly string[]): EvalArgs {
  const known = new Set(["--dry-run", "--confirm-spend"]);
  for (const a of argv) {
    if (!known.has(a)) throw new Error(`Argumento desconhecido: ${a}. Use --dry-run ou --confirm-spend.`);
  }
  return { dryRun: argv.includes("--dry-run"), confirmSpend: argv.includes("--confirm-spend") };
}

export interface MainDeps {
  readJson: (relativePath: string) => unknown;
  readText: (relativePath: string) => string;
  writeText: (relativePath: string, content: string) => void;
  createModel: (modelKey: string, env: EssayEnv) => EssayFeedbackModel;
  log: (line: string) => void;
  now: () => Date;
}

const DOC_PATH = "docs/arquitetura/avaliacao-modelos.md";

function defaultDeps(): MainDeps {
  return {
    readJson: (p) => JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8")) as unknown,
    readText: (p) => readFileSync(resolve(process.cwd(), p), "utf8"),
    writeText: (p, c) => writeFileSync(resolve(process.cwd(), p), c, "utf8"),
    createModel: (key, env) => createAiSdkEssayModel(key, env),
    log: (line) => console.log(line),
    now: () => new Date(),
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
    const cases = buildCases(deps.readJson("content/essays/corpus-d010.json"), deps.readJson("content/essay-topics.json"));
    const keys = ESSAY_MODEL_KEYS;
    const specs = keys.map((k) => ESSAY_MODELS[k]);
    const planned = cases.length * ROUNDS * keys.length;
    if (planned > HARD_CALL_LIMIT) throw new Error(`Plano de ${planned} chamadas excede o limite duro de ${HARD_CALL_LIMIT}.`);
    const maxCost = estimateMaxCostUsd(specs, cases, ROUNDS);
    const keyVars = [...new Set(specs.map((s) => PROVIDER_KEY_ENV[s.provider]))];
    const missing = keyVars.filter((v) => !env[v]);

    log(`Prompt: ${essayFeedbackV1.version}. Casos: ${cases.length}. Rodadas: ${ROUNDS}. Modelos: ${keys.join(", ")}.`);
    log(`Chamadas planejadas: ${planned} (limite duro ${HARD_CALL_LIMIT}). Custo MÁXIMO estimado: US$ ${maxCost.toFixed(4)}.`);

    if (args.dryRun) {
      log("Dry-run: corpus, prompt e config válidos; nenhum provedor foi chamado.");
      if (missing.length > 0) log(`Variáveis de chave ausentes (necessárias na execução real): ${missing.join(", ")}.`);
      return 0;
    }

    if (!args.confirmSpend || env.EVAL_CONFIRM_SPEND !== CONFIRM_ENV_VALUE) {
      throw new Error(`Esta execução GASTA dinheiro. Confirme com a flag --confirm-spend e a env EVAL_CONFIRM_SPEND=${CONFIRM_ENV_VALUE}. Use --dry-run para validar sem gastar.`);
    }
    if (env.AI_PROVIDER?.trim().toLowerCase() !== "ai-sdk") {
      throw new Error("AI_PROVIDER deve ser 'ai-sdk' para o eval real (com 'fake' não há o que comparar).");
    }
    if (missing.length > 0) {
      throw new Error(`Faltam as variáveis de chave: ${missing.join(", ")}.`);
    }

    const models = keys.map((k) => ({ modelKey: k, spec: ESSAY_MODELS[k] as EssayModelSpec, model: deps.createModel(k, env) }));
    const runs = await runEval({ cases, models, rounds: ROUNDS, onProgress: log });
    const block = renderResults(runs, cases, deps.now().toISOString());
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
