import { describe, expect, it } from "vitest";
import {
  classify, formatTable, redact, summarize, truncate, violatesConstraint, type CheckResult,
} from "../lib/rls-report";

// Mensagem real do PostgREST para CHECK violado. O nome da constraint começa no
// caractere 82 da linha exibida ("erro [23514]: " = 14 + 68 de prefixo), depois do corte de 89.
const CHECK_MSG =
  'new row for relation "essay_submissions" violates check constraint "essay_submissions_owner_or_example"';

describe("violatesConstraint", () => {
  it("reconhece a constraint mesmo quando o nome está depois do ponto de truncamento", () => {
    const o = classify({ data: null, error: { message: CHECK_MSG, code: "23514" } });
    // detail (exibição) corta antes do nome: só aparece "essay_s…".
    expect(o.detail).toBe('erro [23514]: new row for relation "essay_submissions" violates check constraint "essay_s…');
    expect(o.detail.includes("essay_submissions_owner_or_example")).toBe(false);
    // conferência usa a mensagem completa.
    expect(violatesConstraint(o, "essay_submissions_owner_or_example")).toBe(true);
  });

  it("não aceita constraint com nome diferente", () => {
    const o = classify({ data: null, error: { message: CHECK_MSG, code: "23514" } });
    expect(violatesConstraint(o, "essay_submissions_example_key_matches")).toBe(false);
  });

  it("exige o código 23514 além do nome", () => {
    const o = classify({ data: null, error: { message: CHECK_MSG, code: "42501" } });
    expect(violatesConstraint(o, "essay_submissions_owner_or_example")).toBe(false);
  });

  it("resposta sem erro nunca conta como violação", () => {
    expect(violatesConstraint(classify({ data: null, error: null }), "essay_submissions_owner_or_example")).toBe(false);
  });
});

describe("classify", () => {
  it("erro conta como negado e inclui o código", () => {
    const o = classify({ data: null, error: { message: "permission denied for table x", code: "42501" } });
    expect(o.denied).toBe(true);
    expect(o.detail).toBe("erro [42501]: permission denied for table x");
  });

  it("lista vazia é negado (0 linhas)", () => {
    expect(classify({ data: [], error: null })).toEqual({ denied: true, detail: "0 linhas" });
  });

  it("lista com linhas não é negado", () => {
    expect(classify({ data: [{ id: 1 }, { id: 2 }], error: null })).toEqual({
      denied: false,
      detail: "2 linha(s) retornada(s)",
    });
  });

  it("sem erro e sem linhas (insert, rpc) é aceito", () => {
    expect(classify({ data: null, error: null }).denied).toBe(false);
  });
});

describe("redact", () => {
  it("oculta todos os segredos e ignora vazios ou curtos", () => {
    expect(redact("a SEGREDO123 b SEGREDO123", ["SEGREDO123", "", "ab"])).toBe("a [oculto] b [oculto]");
  });
});

describe("summarize e formatTable", () => {
  const results: CheckResult[] = [
    { name: "(a) caso um", expected: "negado", obtained: "0 linhas", pass: true },
    { name: "(b) caso dois", expected: "negado", obtained: "1 linha(s) retornada(s)", pass: false },
    { name: "(c) caso três", expected: "negado", obtained: "erro", pass: true },
  ];

  it("conta 2 de 3 (2 PASS, 1 FAIL)", () => {
    const s = summarize(results);
    expect(s.passed).toBe(2);
    expect(s.total).toBe(3);
    expect(s.failed.map((r) => r.name)).toEqual(["(b) caso dois"]);
    expect(s.line).toBe("2 de 3 passaram");
  });

  it("tabela tem cabeçalho, separador e uma linha por caso", () => {
    const lines = formatTable(results).split("\n");
    expect(lines).toHaveLength(2 + 3);
    expect(lines[0]).toMatch(/^Caso\s+\| Esperado\s+\| Obtido\s+\| Resultado$/);
    expect(lines[3]).toContain("FAIL");
    expect(lines[2]).toContain("PASS");
  });

  it("trunca células longas com reticências", () => {
    expect(truncate("x".repeat(200), 10)).toBe("xxxxxxxxx…");
  });
});
