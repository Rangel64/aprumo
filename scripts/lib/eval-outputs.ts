/**
 * Apoio do eval D-010 para a nota CEGA (T17 / KAN-48): anonimização dos retornos, sinalização
 * heurística de RN-023, planilha-modelo e agregação das notas. Puro (sem rede, sem disco).
 *
 * Segurança: nenhum arquivo gerado aqui leva chave, usage do provedor ou nome do modelo, exceto o
 * `key.json`, que fica SEPARADO e só é aberto depois das notas. O texto do aluno nunca é gravado.
 */
import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { z } from "zod";
import type { EssayFeedbackAI } from "../../src/contracts/essay";
import { FAKE_EVAL_KEYS } from "./eval-fake";

export const BLIND_LABELS = ["X", "Y"] as const;
export type BlindLabel = (typeof BLIND_LABELS)[number];

// ---- sorteio de rótulos ----

/** PRNG mulberry32: determinístico pela semente (uint32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** caso -> rótulo -> modelKey. */
export type BlindAssignments = Record<string, Record<BlindLabel, string>>;

/**
 * Sorteia, por caso, qual dos 2 modelos recebe "X". Balanceado: a primeira chave fica com "X" em
 * floor(n/2) ou ceil(n/2) dos casos (diferença de no máximo 1). Depende só da semente e da
 * posição dos modelos, nunca do nome deles.
 */
export function assignBlindLabels(
  caseIds: readonly string[],
  modelKeys: readonly [string, string],
  seed: number,
): BlindAssignments {
  const rand = mulberry32(seed);
  const n = caseIds.length;
  // Metade dos casos com a ordem direta, metade com a invertida; o "extra" de n ímpar é sorteado.
  const direct = Math.floor(n / 2) + (n % 2 === 1 && rand() < 0.5 ? 1 : 0);
  const flags = Array.from({ length: n }, (_, i) => i < direct);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [flags[i], flags[j]] = [flags[j], flags[i]];
  }
  const out: BlindAssignments = {};
  caseIds.forEach((id, i) => {
    out[id] = flags[i]
      ? { X: modelKeys[0], Y: modelKeys[1] }
      : { X: modelKeys[1], Y: modelKeys[0] };
  });
  return out;
}

export function labelFor(assignments: BlindAssignments, caseId: string, modelKey: string): BlindLabel {
  const entry = assignments[caseId];
  const label = BLIND_LABELS.find((l) => entry?.[l] === modelKey);
  if (!label) throw new Error(`Sem rótulo cego para o caso "${caseId}".`);
  return label;
}

/**
 * Ordem de gravação independente do modelo: ordena por nome (alfabético, sem informação do modelo)
 * e embaralha pela semente. Evita que ordem/data dos arquivos agrupe por modelo.
 */
export function shuffleBySeed<T>(items: readonly T[], seed: number, keyOf: (t: T) => string): T[] {
  const out = [...items].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Instante fixo aplicado a mtime/atime dos arquivos cegos (não revela a ordem de coleta). */
export const FIXED_FILE_TIME = new Date("2000-01-01T00:00:00.000Z");

/**
 * Aceita só caminho DENTRO de `cwd` (sem `..` que escape, sem absoluto fora). Devolve o caminho
 * relativo normalizado com "/". O próprio `cwd` é recusado (precisa ser um subdiretório/arquivo).
 */
export function resolveInsideCwd(p: string, cwd: string): string {
  const fail = (): never => {
    throw new Error(`Caminho "${p}" fora do diretório de trabalho (ou o próprio diretório): use um caminho dentro do repositório.`);
  };
  const full = resolve(cwd, p);
  const rel = relative(resolve(cwd), full);
  // Segmento ".." exato (nomes legítimos como "..x" são aceitos).
  const first = rel.split(/[\\/]/)[0];
  if (rel === "" || first === ".." || isAbsolute(rel)) fail();
  // Symlink: resolve o pai existente mais próximo e confere que continua dentro do cwd real.
  let existing = full;
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  const realCwd = realpathSync(resolve(cwd));
  const realFull = resolve(realpathSync(existing), relative(existing, full));
  const realRel = relative(realCwd, realFull);
  if (realRel === "" || realRel.split(/[\\/]/)[0] === ".." || isAbsolute(realRel)) fail();
  return rel.split("\\").join("/");
}

// ---- RN-023: sinalização heurística (a decisão é humana) ----

/** Sequência de palavras idênticas (do texto do aluno) a partir da qual se sinaliza cópia. */
export const COPY_RUN_WORDS = 12;
/** Um campo livre com este tanto do tamanho do texto do aluno (e pelo menos MIN) sugere reescrita. */
export const REWRITE_LENGTH_RATIO = 0.7;
export const REWRITE_MIN_CHARS = 200;

export interface Rn023Flags {
  /** Heurística 1: maior sequência de palavras consecutivas copiada do texto do aluno. */
  longestCopiedWords: number;
  longCopy: boolean;
  /** Heurística 2: um campo livre (pontos fortes, melhorias, resumo) tão longo quanto o original. */
  rewriteLikeLength: boolean;
  anyFlag: boolean;
  note: string;
}

const words = (s: string): string[] =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Maior trecho de palavras consecutivas de `b` que também aparece (contíguo) em `a`. */
export function longestCommonWordRun(a: readonly string[], b: readonly string[]): number {
  let best = 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

/** Campos livres do retorno. `evidence` fica de fora: são citações literais permitidas por contrato. */
function freeTextFields(output: EssayFeedbackAI): string[] {
  return [
    output.summary,
    ...output.competencies.flatMap((c) => [...c.strengths, ...c.improvements]),
  ];
}

/** Só SINALIZA para a revisão humana; não expõe nem grava o texto do aluno. */
export function computeRn023Flags(studentText: string, output: EssayFeedbackAI): Rn023Flags {
  const student = words(studentText);
  const fields = freeTextFields(output);
  const longest = fields.reduce((m, f) => Math.max(m, longestCommonWordRun(student, words(f))), 0);
  const longCopy = longest >= COPY_RUN_WORDS;
  const rewriteLikeLength = fields.some(
    (f) => f.length >= REWRITE_MIN_CHARS && f.length >= REWRITE_LENGTH_RATIO * studentText.length,
  );
  return {
    longestCopiedWords: longest,
    longCopy,
    rewriteLikeLength,
    anyFlag: longCopy || rewriteLikeLength,
    note: `Heurística de apoio, não é decisão. longCopy: >= ${COPY_RUN_WORDS} palavras seguidas iguais ao texto do aluno fora de "evidence". rewriteLikeLength: campo livre com >= ${REWRITE_MIN_CHARS} caracteres e >= ${REWRITE_LENGTH_RATIO * 100}% do tamanho do texto do aluno.`,
  };
}

// ---- arquivos anonimizados ----

export interface BlindOutputFile {
  caseId: string;
  round: number;
  label: BlindLabel;
  output: EssayFeedbackAI;
  rn023Flags: Rn023Flags;
}

export const blindFileName = (caseId: string, round: number, label: BlindLabel): string =>
  `case-${caseId}-r${round}-${label}.json`;

export const CSV_HEADER =
  "caso,rodada,rotulo,nota_avaliador_1,nota_avaliador_2,violou_RN023_avaliador_1,violou_RN023_avaliador_2,observacao";

export function renderGradesTemplate(
  rows: readonly { caseId: string; round: number; label: BlindLabel }[],
): string {
  const sorted = [...rows].sort(
    (a, b) => a.caseId.localeCompare(b.caseId) || a.round - b.round || a.label.localeCompare(b.label),
  );
  return [CSV_HEADER, ...sorted.map((r) => `${r.caseId},${r.round},${r.label},,,,,`)].join("\n") + "\n";
}

export const EvalKeySchema = z.object({
  note: z.string().optional(),
  /** Presente só no ensaio `--fake`. */
  fake: z.boolean().optional(),
  seed: z.number().int(),
  promptVersion: z.string().optional(),
  /** caso -> rótulo -> modelKey. */
  assignments: z.record(z.string(), z.object({ X: z.string().min(1), Y: z.string().min(1) })),
  /** Linhas esperadas na planilha (as do template). Sem este campo: todos os casos x rodadas x rótulos. */
  rows: z
    .array(z.object({ caseId: z.string().min(1), round: z.number().int().min(1), label: z.enum(["X", "Y"]) }))
    .optional(),
  rounds: z.number().int().min(1).optional(),
  /** Métricas automáticas por modelo, para a regra de decisão (não vão para os avaliadores). */
  metrics: z.record(
    z.string(),
    z.object({
      validPct: z.number(),
      p50Ms: z.number().nullable().optional(),
      p95Ms: z.number().nullable(),
      avgCostUsd: z.number().nullable(),
    }),
  ),
});
export type EvalKey = z.infer<typeof EvalKeySchema>;

/** Valida o key.json; erro claro, sem cast. */
export function parseEvalKey(raw: unknown): EvalKey {
  const r = EvalKeySchema.safeParse(raw);
  if (!r.success) {
    const problems = r.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`).join("; ");
    throw new Error(`key.json inválido: ${problems}`);
  }
  if (Object.keys(r.data.metrics).length === 0) throw new Error("key.json inválido: metrics vazio.");
  return r.data;
}

/** Fake se o campo diz OU se algum modelKey das métricas/rótulos é de modelo fake. */
export function isFakeKey(key: EvalKey): boolean {
  const fakeKeys: readonly string[] = FAKE_EVAL_KEYS;
  const names = [...Object.keys(key.metrics), ...Object.values(key.assignments).flatMap((a) => [a.X, a.Y])];
  return key.fake === true || names.some((n) => fakeKeys.includes(n));
}

// ---- agregação das notas ----

export interface GradeRow {
  caseId: string;
  round: number;
  label: BlindLabel;
  scores: number[];
  violated: boolean;
}

const norm = (v: string): string =>
  v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function parseGradesCsv(csv: string): GradeRow[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("Planilha vazia.");
  if (lines[0].includes(";") && !lines[0].includes(",")) {
    throw new Error("A planilha parece separada por ponto-e-vírgula (Excel pt-BR). Salve como CSV separado por vírgulas (CSV UTF-8, delimitador vírgula).");
  }
  const header = lines[0].replace(/^﻿/, "").split(",").map((h) => h.trim());
  const expected = CSV_HEADER.split(",");
  if (header.length < 7 || expected.slice(0, 7).some((h, i) => header[i] !== h)) {
    throw new Error(`Cabeçalho da planilha inesperado. Esperado: ${CSV_HEADER}`);
  }
  const rows: GradeRow[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(",").map((x) => x.trim());
    const label = c[2]?.toUpperCase();
    if (label !== "X" && label !== "Y") throw new Error(`Rótulo inválido na planilha: "${c[2] ?? ""}".`);
    const round = Number(c[1]);
    if (!Number.isInteger(round) || round < 1) throw new Error(`Rodada inválida: "${c[1] ?? ""}".`);
    const where = `${c[0]} rodada ${round} rótulo ${label}`;
    const scores: number[] = [];
    for (const raw of [c[3], c[4]]) {
      if (!raw) continue;
      if (!/^[1-5]$/.test(raw)) throw new Error(`Nota inválida em ${where}: "${raw}" (use inteiro de 1 a 5).`);
      scores.push(Number(raw));
    }
    let violated = false;
    for (const raw of [c[5], c[6]]) {
      const v = norm(raw ?? "");
      if (v === "sim") violated = true;
      else if (v !== "" && v !== "nao") {
        throw new Error(`Valor inválido em violou_RN023 em ${where}: "${raw}" (use "sim", "nao" ou deixe vazio).`);
      }
    }
    rows.push({ caseId: c[0], round, label, scores, violated });
  }
  return rows;
}

// ---- completude da planilha ----

const rowId = (caseId: string, round: number, label: string): string => `${caseId} rodada ${round} rótulo ${label}`;

/** Linhas que o template deve ter, derivadas do key. */
export function expectedRows(key: EvalKey): { caseId: string; round: number; label: BlindLabel }[] {
  if (key.rows) return key.rows;
  const rounds = key.rounds ?? 3;
  return Object.keys(key.assignments).flatMap((caseId) =>
    Array.from({ length: rounds }, (_, i) => BLIND_LABELS.map((label) => ({ caseId, round: i + 1, label }))).flat(),
  );
}

export interface GradesCheck {
  duplicates: string[];
  extras: string[];
  missing: string[];
  incompleteScores: string[];
}

export function checkGrades(rows: readonly GradeRow[], key: EvalKey): GradesCheck {
  const expected = new Set(expectedRows(key).map((r) => rowId(r.caseId, r.round, r.label)));
  const seen = new Set<string>();
  const check: GradesCheck = { duplicates: [], extras: [], missing: [], incompleteScores: [] };
  for (const r of rows) {
    const id = rowId(r.caseId, r.round, r.label);
    if (seen.has(id)) check.duplicates.push(id);
    seen.add(id);
    if (!expected.has(id)) check.extras.push(id);
    else if (r.scores.length !== 2) check.incompleteScores.push(`${id} (${r.scores.length} de 2 notas)`);
  }
  check.missing = [...expected].filter((id) => !seen.has(id));
  return check;
}

const listed = (items: string[]): string =>
  items.length <= 10 ? items.join("; ") : `${items.slice(0, 10).join("; ")}; e mais ${items.length - 10}`;

function problemText(c: GradesCheck, includePartial: boolean): string[] {
  const out: string[] = [];
  if (c.duplicates.length) out.push(`linhas duplicadas: ${listed(c.duplicates)}`);
  if (c.extras.length) out.push(`linhas que não constam no template: ${listed(c.extras)}`);
  if (includePartial) {
    if (c.missing.length) out.push(`linhas faltando (${c.missing.length}): ${listed(c.missing)}`);
    if (c.incompleteScores.length) out.push(`linhas sem as 2 notas: ${listed(c.incompleteScores)}`);
  }
  return out;
}

/** Aviso grande para o modo `--allow-partial`; null se a planilha está completa. */
export function partialWarning(c: GradesCheck): string | null {
  if (!c.missing.length && !c.incompleteScores.length) return null;
  return `ATENÇÃO: RESULTADO PARCIAL, NÃO USE PARA DECIDIR. Planilha incompleta (--allow-partial): ${problemText(c, true).join(" | ")}.`;
}

export interface GradeModelAggregate {
  modelKey: string;
  ratings: number;
  meanScore: number | null;
  rn023Violations: number;
  validPct: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  avgCostUsd: number | null;
}

export function aggregateGrades(
  rows: readonly GradeRow[],
  key: EvalKey,
  opts: { allowPartial?: boolean } = {},
): GradeModelAggregate[] {
  for (const r of rows) {
    if (!key.assignments[r.caseId]?.[r.label]) {
      throw new Error(`Caso/rótulo da planilha não consta no key.json: ${r.caseId} ${r.label}.`);
    }
  }
  const check = checkGrades(rows, key);
  const problems = problemText(check, opts.allowPartial !== true);
  if (problems.length > 0) {
    throw new Error(`Planilha inválida: ${problems.join(" | ")}. Corrija a planilha (ou use --allow-partial só para uma prévia).`);
  }
  const byModel = new Map<string, { scores: number[]; violations: number }>();
  for (const [modelKey] of Object.entries(key.metrics)) byModel.set(modelKey, { scores: [], violations: 0 });
  for (const r of rows) {
    const modelKey = key.assignments[r.caseId][r.label];
    const acc = byModel.get(modelKey) ?? { scores: [], violations: 0 };
    acc.scores.push(...r.scores);
    if (r.violated) acc.violations += 1;
    byModel.set(modelKey, acc);
  }
  return [...byModel.entries()].map(([modelKey, acc]) => {
    const m = key.metrics[modelKey];
    return {
      modelKey,
      ratings: acc.scores.length,
      meanScore: acc.scores.length === 0 ? null : acc.scores.reduce((a, b) => a + b, 0) / acc.scores.length,
      rn023Violations: acc.violations,
      validPct: m?.validPct ?? null,
      p50Ms: m?.p50Ms ?? null,
      p95Ms: m?.p95Ms ?? null,
      avgCostUsd: m?.avgCostUsd ?? null,
    };
  });
}

// ---- regra de decisão (RECOMENDAÇÃO; o grupo decide) ----

export const DECISION_P95_MAX_MS = 20_000;
export const DECISION_COST_MAX_USD = 0.02;

export interface Recommendation {
  winner: string | null;
  lines: string[];
}

/**
 * Regra do plano (D-010):
 * 1. elimina quem violou RN-023 (o procedimento manda reavaliar depois de um ajuste de prompt;
 *    aqui conta toda violação marcada nesta rodada) ou teve menos de 100% de saídas válidas;
 * 2. entre os restantes, só entra quem tem p95 <= 20 s e custo médio <= US$ 0,02 por retorno;
 * 3. vence a maior nota média; em empate, o mais barato.
 */
export function recommend(aggs: readonly GradeModelAggregate[]): Recommendation {
  const lines: string[] = [];
  const alive = aggs.filter((a) => {
    if (a.rn023Violations > 0) {
      lines.push(`${a.modelKey}: eliminado (RN-023 violada em ${a.rn023Violations} retorno(s)).`);
      return false;
    }
    if (a.validPct === null || a.validPct < 100) {
      lines.push(`${a.modelKey}: eliminado (saídas válidas ${a.validPct === null ? "sem dado" : `${a.validPct.toFixed(1)}%`}, exige 100%).`);
      return false;
    }
    return true;
  });
  const eligible = alive.filter((a) => {
    const okP95 = a.p95Ms !== null && a.p95Ms <= DECISION_P95_MAX_MS;
    const okCost = a.avgCostUsd !== null && a.avgCostUsd <= DECISION_COST_MAX_USD;
    if (!okP95 || !okCost || a.meanScore === null) {
      lines.push(`${a.modelKey}: fora do limite (p95 <= 20 s: ${okP95 ? "ok" : "não"}; custo <= US$ 0,02: ${okCost ? "ok" : "não"}; nota ${a.meanScore === null ? "ausente" : "ok"}).`);
      return false;
    }
    return true;
  });
  if (eligible.length === 0) {
    lines.push("Nenhum modelo restante: sem recomendação; o grupo decide (ajustar o prompt e reavaliar, ou outro candidato).");
    return { winner: null, lines };
  }
  const best = Math.max(...eligible.map((a) => a.meanScore as number));
  const top = eligible.filter((a) => Math.abs((a.meanScore as number) - best) < 1e-9);
  top.sort((a, b) => (a.avgCostUsd as number) - (b.avgCostUsd as number));
  const winner = top[0];
  lines.push(
    top.length > 1
      ? `Empate na nota (${best.toFixed(2)}): recomendado o mais barato, ${winner.modelKey}.`
      : `Recomendado: ${winner.modelKey} (maior nota média, ${best.toFixed(2)}).`,
  );
  lines.push("Isto é só uma recomendação da regra do plano; a decisão é do grupo (ADR-005).");
  return { winner: winner.modelKey, lines };
}

// ---- relatório agregado (sem texto, sem respostas) ----

export const GRADES_START = "<!-- EVAL-GRADES:START -->";
export const GRADES_END = "<!-- EVAL-GRADES:END -->";

const fmtNum = (v: number | null, d: number): string => (v === null ? "-" : v.toFixed(d));

export function renderGradesReport(
  aggs: readonly GradeModelAggregate[],
  rec: Recommendation,
  dateIso: string,
  warning: string | null = null,
): string {
  const out: string[] = warning ? [`**${warning}**`, ""] : [];
  out.push(`Agregação das notas cegas em ${dateIso}. Só médias e contagens por modelo.`, "");
  out.push("| Modelo | Notas dadas | Nota média (1–5) | Retornos com RN-023 violada | Saídas válidas | p50 (ms) | p95 (ms) | Custo médio (US$) |");
  out.push("|---|---|---|---|---|---|---|---|");
  for (const a of aggs) {
    out.push(
      `| ${a.modelKey} | ${a.ratings} | ${fmtNum(a.meanScore, 2)} | ${a.rn023Violations} | ${a.validPct === null ? "-" : `${a.validPct.toFixed(1)}%`} | ${fmtNum(a.p50Ms, 0)} | ${fmtNum(a.p95Ms, 0)} | ${fmtNum(a.avgCostUsd, 5)} |`,
    );
  }
  out.push("", "Recomendação pela regra de decisão (a decisão é do grupo):", "");
  for (const l of rec.lines) out.push(`- ${l}`);
  return out.join("\n");
}

/** Troca o bloco de notas no doc; falha se faltarem os marcadores. */
export function replaceGradesBlock(doc: string, block: string): string {
  const start = doc.indexOf(GRADES_START);
  const end = doc.indexOf(GRADES_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("avaliacao-modelos.md sem os marcadores EVAL-GRADES.");
  }
  return `${doc.slice(0, start + GRADES_START.length)}\n\n${block}\n\n${doc.slice(end)}`;
}
