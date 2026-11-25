/**
 * Lógica pura do relatório do rls-check (sem rede, sem I/O): classificação de respostas,
 * redação de segredos, tabela final e resumo. Testada em scripts/__tests__/rls-report.test.ts.
 */

export type CheckResult = {
  /** Caso, ex.: "(a) A não lê journeys de B". */
  name: string;
  expected: string;
  obtained: string;
  pass: boolean;
};

/** Forma mínima de uma resposta do supabase-js (PostgREST). */
export type Resp = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

/**
 * `detail` é a versão truncada, só para exibição na tabela.
 * `raw` e `code` (só em erro) guardam a mensagem completa do banco, sem truncar,
 * para conferências como o nome da constraint (ver violatesConstraint).
 */
export type Outcome = { denied: boolean; detail: string; raw?: string; code?: string };

const MAX_CELL = 90;

/** Código SQLSTATE de violação de CHECK. */
export const CHECK_VIOLATION = "23514";

export function truncate(text: string, max = MAX_CELL): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * Esperado: erro 23514 (check_violation) cuja mensagem completa cita a constraint.
 * Usa a mensagem original (não o `detail` truncado), pois o nome pode vir depois do corte.
 */
export function violatesConstraint(o: Outcome, constraint: string): boolean {
  return o.code === CHECK_VIOLATION && o.raw !== undefined && o.raw.includes(constraint);
}

/**
 * Classifica uma resposta: "negado" = erro (permissão/RLS/CHECK) ou 0 linhas.
 * Resposta sem erro e sem linhas devolvidas (insert sem select, rpc) conta como aceita.
 */
export function classify(res: Resp): Outcome {
  if (res.error) {
    const code = res.error.code ? ` [${res.error.code}]` : "";
    const raw = `erro${code}: ${res.error.message}`;
    return { denied: true, detail: truncate(raw), raw, code: res.error.code };
  }
  if (Array.isArray(res.data)) {
    return res.data.length === 0
      ? { denied: true, detail: "0 linhas" }
      : { denied: false, detail: `${res.data.length} linha(s) retornada(s)` };
  }
  return { denied: false, detail: "sem erro (operação aceita)" };
}

/** Troca cada segredo (se tiver 6+ caracteres) por [oculto]. */
export function redact(text: string, secrets: readonly string[]): string {
  let out = text;
  for (const s of secrets) {
    if (s && s.length >= 6) out = out.split(s).join("[oculto]");
  }
  return out;
}

export function summarize(results: readonly CheckResult[]): {
  passed: number;
  total: number;
  failed: CheckResult[];
  line: string;
} {
  const failed = results.filter((r) => !r.pass);
  const total = results.length;
  const passed = total - failed.length;
  return { passed, total, failed, line: `${passed} de ${total} passaram` };
}

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - text.length));
}

/** Tabela em texto: caso, esperado, obtido, resultado. */
export function formatTable(results: readonly CheckResult[]): string {
  const header = ["Caso", "Esperado", "Obtido", "Resultado"];
  const rows = results.map((r) => [
    truncate(r.name),
    truncate(r.expected),
    truncate(r.obtained),
    r.pass ? "PASS" : "FAIL",
  ]);
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const fmt = (cells: string[]) => cells.map((c, i) => pad(c, widths[i])).join(" | ");
  const sep = widths.map((w) => "-".repeat(w)).join("-+-");
  return [fmt(header), sep, ...rows.map(fmt)].join("\n");
}
