import { describe, expect, it } from "vitest";
import { essayFeedbackFixture } from "@/contracts/fixtures";
import { validateBundle, type ContentBundle } from "../validate";

// Fixtures sintéticas: nada lê content/ do disco (os docs e conteúdos mudam a cada sprint).

function question(n: number, over: Record<string, unknown> = {}) {
  return {
    stem: `Enunciado sintético ${n}`,
    options: ["A", "B", "C"],
    correctIndex: 1,
    explanation: "Porque sim (fixture).",
    origin: "original",
    sourceCitation: "Fonte sintética de teste",
    ...over,
  };
}

function content(slug: string, over: Record<string, unknown> = {}) {
  return {
    slug,
    title: `Conteúdo ${slug}`,
    summary: "Resumo sintético",
    subject: "Português/Redação",
    position: { x: 0, y: 0 },
    sort: 1,
    prerequisites: [],
    related: [],
    sections: [{ kind: "text", title: "Seção 1", bodyMd: "Texto.", sourceCitation: "Fonte sintética" }],
    questions: [1, 2, 3, 4, 5].map((n) => question(n)),
    flashcards: [1, 2, 3].map((n) => ({ front: `Frente ${n}`, back: `Verso ${n}` })),
    ...over,
  };
}

const trailOf = (slugs: string[]) => ({
  slug: "trilha-teste",
  name: "Trilha de teste",
  objective: "Objetivo",
  origin: "platform",
  color: "#7b5cff",
  contentSlugs: slugs,
});

const mapOf = (slugs: string[], skip: number[] = []) => ({
  competencies: [1, 2, 3, 4, 5]
    .filter((c) => !skip.includes(c))
    .map((competency) => ({ competency, contentSlugs: slugs })),
});

const topics = { topics: [{ slug: "tema-teste", title: "Tema", motivatingText: "Texto motivador sintético." }] };

function bundle(contents: Record<string, unknown>[], over: Partial<ContentBundle> = {}): ContentBundle {
  const slugs = contents.map((c) => String(c.slug));
  return {
    contents: contents.map((c) => ({ file: `content/${String(c.slug)}.json`, data: c })),
    trail: trailOf(slugs),
    competencyMap: mapOf(slugs),
    essayTopics: topics,
    ...over,
  };
}

const rules = (r: ReturnType<typeof validateBundle>) => r.errors.map((e) => e.rule);

describe("validateBundle", () => {
  it("caso feliz: 1 conteúdo sintético completo passa", () => {
    const r = validateBundle(bundle([content("a")]), { strict: true });
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.presentSlugs).toEqual(["a"]);
  });

  it("reprova seção sem fonte (RN-018)", () => {
    const c = content("a", { sections: [{ kind: "text", title: "S", bodyMd: "Texto." }] });
    const r = validateBundle(bundle([c]));
    expect(r.ok).toBe(false);
    expect(rules(r)).toContain("RN-018");
  });

  it("reprova seção com fonte só de espaços (RN-018)", () => {
    const c = content("a", { sections: [{ kind: "text", title: "S", bodyMd: "T", sourceCitation: "   " }] });
    expect(rules(validateBundle(bundle([c])))).toContain("RN-018");
  });

  it("reprova questão sem origin (RF-062)", () => {
    const q = question(1);
    delete (q as Partial<typeof q>).origin;
    const c = content("a", { questions: [q, ...[2, 3, 4, 5].map((n) => question(n))] });
    expect(rules(validateBundle(bundle([c])))).toContain("RF-062");
  });

  it("reprova questão sem fonte (RF-062)", () => {
    const c = content("a", {
      questions: [question(1, { sourceCitation: "" }), ...[2, 3, 4, 5].map((n) => question(n))],
    });
    expect(rules(validateBundle(bundle([c])))).toContain("RF-062");
  });

  it("rejeita ciclo sintético de pré-requisitos (US-006)", () => {
    // a -> b -> c -> a
    const cs = [
      content("a", { prerequisites: ["c"] }),
      content("b", { prerequisites: ["a"] }),
      content("c", { prerequisites: ["b"] }),
    ];
    const r = validateBundle(bundle(cs));
    expect(rules(r)).toContain("ciclo");
    expect(r.errors.find((e) => e.rule === "ciclo")?.message).toMatch(/a -> b -> c -> a|b -> c -> a -> b|c -> a -> b -> c/);
  });

  it("aceita grafo acíclico com pré-requisitos", () => {
    const cs = [content("a"), content("b", { prerequisites: ["a"] }), content("c", { prerequisites: ["a", "b"] })];
    expect(validateBundle(bundle(cs), { strict: true }).ok).toBe(true);
  });

  it("reprova conteúdo com menos de 5 questões", () => {
    const c = content("a", { questions: [1, 2, 3, 4].map((n) => question(n)) });
    const r = validateBundle(bundle([c]));
    expect(rules(r)).toContain("minimo-questoes");
  });

  it("reprova conteúdo com menos de 3 flashcards", () => {
    const c = content("a", { flashcards: [{ front: "F", back: "V" }] });
    expect(rules(validateBundle(bundle([c])))).toContain("minimo-flashcards");
  });

  it("reprova competência sem conteúdo", () => {
    const r = validateBundle(bundle([content("a")], { competencyMap: mapOf(["a"], [3]) }));
    const issue = r.errors.find((e) => e.rule === "competencia-sem-conteudo");
    expect(issue?.message).toContain("competência 3");
    expect(r.errors.filter((e) => e.rule === "competencia-sem-conteudo")).toHaveLength(1);
  });

  it("reprova slug duplicado", () => {
    const b = bundle([content("a")]);
    b.contents.push({ file: "content/a-copia.json", data: content("a") });
    expect(rules(validateBundle(b))).toContain("slug-unico");
  });

  it("trilha com slug sem arquivo: pendente no padrão, erro no strict", () => {
    const b = bundle([content("a")], { trail: trailOf(["a", "inexistente"]) });
    const padrao = validateBundle(b);
    expect(padrao.ok).toBe(true);
    expect(padrao.pending.map((p) => p.rule)).toEqual(["conteudo-pendente"]);
    expect(padrao.pending[0].message).toContain("inexistente");

    const strict = validateBundle(b, { strict: true });
    expect(strict.ok).toBe(false);
    expect(rules(strict)).toContain("conteudo-pendente");
  });

  it("pré-requisito fora da trilha e sem arquivo é erro", () => {
    const r = validateBundle(bundle([content("a", { prerequisites: ["fantasma"] })]));
    expect(rules(r)).toContain("prerequisito-inexistente");
  });

  it("pré-requisito pendente (na trilha, sem arquivo) passa no padrão e falha no strict", () => {
    const b = bundle([content("a", { prerequisites: ["b"] })], { trail: trailOf(["a", "b"]), competencyMap: mapOf(["a", "b"]) });
    expect(validateBundle(b).ok).toBe(true);
    expect(validateBundle(b, { strict: true }).ok).toBe(false);
  });

  it("strict: conteúdo com arquivo fora da trilha reprova", () => {
    const b = bundle([content("a"), content("b")], { trail: trailOf(["a"]), competencyMap: mapOf(["a"]) });
    expect(rules(validateBundle(b, { strict: true }))).toContain("fora-da-trilha");
    expect(validateBundle(b).ok).toBe(true);
  });

  it("config.json inválido reprova", () => {
    const r = validateBundle(bundle([content("a")], { config: { quiz_question_count: 0 } }));
    expect(r.errors.some((e) => e.file === "content/config.json")).toBe(true);
  });

  it("demo-essays: example_key repetida reprova", () => {
    const row = (key: string) => ({ topicSlug: "tema-teste", part: "introduction", body: "Texto", feedback: essayFeedbackFixture, example_key: key });
    const demo = (keys: string[]) => ({ demoAccountEssays: [{ ...row("x"), example_key: undefined }], fallbackExamples: keys.map(row) });
    const ok = validateBundle(bundle([content("a")], { demoEssays: demo(["k1", "k2"]) }));
    expect(ok.errors).toEqual([]);
    const r = validateBundle(bundle([content("a")], { demoEssays: demo(["k", "k"]) }));
    expect(r.errors.map((e) => e.message).join("|")).toContain("example_key repetida");
  });

  it("arquivos opcionais ausentes (config, demo-essays) não falham", () => {
    expect(validateBundle(bundle([content("a")])).ok).toBe(true);
  });
});
