/**
 * Validação pura de `content/` (T12, KAN-43). Não lê disco: recebe os JSON já carregados,
 * para testar sem arquivos e para o script `scripts/validate-content.ts` e o seed (T4) reutilizarem.
 * Sem `server-only` de propósito (roda sob tsx). Nunca inclui valores de chaves nas mensagens.
 */
import type { ZodError } from "zod";
import {
  AppConfigSchema,
  CompetencyMapJsonSchema,
  ContentJsonSchema,
  DemoEssaysJsonSchema,
  EssayTopicsJsonSchema,
  TrailJsonSchema,
  type ContentJson,
} from "@/contracts/content";

export const MIN_QUESTIONS = 5;
export const MIN_FLASHCARDS = 3;
export const COMPETENCIES = [1, 2, 3, 4, 5] as const;

export type IssueLevel = "erro" | "pendente";

export interface ContentIssue {
  level: IssueLevel;
  file: string;
  rule: string;
  message: string;
}

export interface ContentBundle {
  /** Arquivos de conteúdo (`content/<slug>.json`): `file` é o nome relativo, `data` o JSON bruto. */
  contents: { file: string; data: unknown }[];
  trail?: unknown;
  competencyMap?: unknown;
  essayTopics?: unknown;
  config?: unknown;
  demoEssays?: unknown;
}

export interface ValidateOptions {
  /** Todo slug da trilha precisa ter arquivo e passar em todas as regras. */
  strict?: boolean;
}

export interface ValidationReport {
  ok: boolean;
  strict: boolean;
  issues: ContentIssue[];
  errors: ContentIssue[];
  pending: ContentIssue[];
  /** Slugs de conteúdos com arquivo presente. */
  presentSlugs: string[];
}

const FILES = {
  trail: "content/trail.json",
  competencyMap: "content/competency-map.json",
  essayTopics: "content/essay-topics.json",
  config: "content/config.json",
  demoEssays: "content/essays/demo-essays.json",
} as const;

function pathText(path: PropertyKey[]): string {
  return path.map(String).join(".") || "(raiz)";
}

function isBlank(v: unknown): boolean {
  return typeof v !== "string" || v.trim() === "";
}

/** Converte erros do zod em problemas, nomeando as regras de fonte (RN-018) e origem (RF-062). */
function zodIssues(file: string, error: ZodError): ContentIssue[] {
  return error.issues.map((i) => {
    const path = i.path;
    const last = path[path.length - 1];
    let rule = "schema";
    if (path[0] === "sections" && last === "sourceCitation") rule = "RN-018";
    if (path[0] === "questions" && (last === "origin" || last === "sourceCitation")) rule = "RF-062";
    return { level: "erro", file, rule, message: `${pathText(path)}: ${i.message}` };
  });
}

/** Ciclos no grafo (pré-requisito -> conteúdo). Devolve um caminho de ciclo ou null. */
export function findCycle(graph: Map<string, string[]>): string[] | null {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];

  const visit = (node: string): string[] | null => {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      if (!graph.has(next)) continue;
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) return [...stack.slice(stack.indexOf(next)), next];
      if (c === WHITE) {
        const found = visit(next);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(node, BLACK);
    return null;
  };

  for (const node of graph.keys()) {
    if ((color.get(node) ?? WHITE) === WHITE) {
      const found = visit(node);
      if (found) return found;
    }
  }
  return null;
}

export function validateBundle(bundle: ContentBundle, options: ValidateOptions = {}): ValidationReport {
  const strict = options.strict === true;
  const issues: ContentIssue[] = [];
  const add = (level: IssueLevel, file: string, rule: string, message: string) =>
    issues.push({ level, file, rule, message });

  // ---- trilha ----
  let trailSlugs: string[] = [];
  if (bundle.trail === undefined) {
    add("erro", FILES.trail, "arquivo", "arquivo ausente");
  } else {
    const parsed = TrailJsonSchema.safeParse(bundle.trail);
    if (parsed.success) trailSlugs = parsed.data.contentSlugs;
    else issues.push(...zodIssues(FILES.trail, parsed.error));
  }

  // ---- conteúdos ----
  const valid: { file: string; content: ContentJson }[] = [];
  const present = new Set<string>();
  const slugOwner = new Map<string, string>();

  for (const { file, data } of bundle.contents) {
    const fileSlug = file.replace(/^.*[\\/]/, "").replace(/\.json$/, "");
    const rawSlug =
      typeof data === "object" && data !== null && typeof (data as { slug?: unknown }).slug === "string"
        ? (data as { slug: string }).slug
        : fileSlug;

    const owner = slugOwner.get(rawSlug);
    if (owner !== undefined) {
      add("erro", file, "slug-unico", `slug "${rawSlug}" já usado em ${owner}`);
    } else {
      slugOwner.set(rawSlug, file);
    }
    present.add(rawSlug);
    if (rawSlug !== fileSlug) {
      add("erro", file, "slug-arquivo", `slug "${rawSlug}" difere do nome do arquivo ("${fileSlug}.json")`);
    }

    const parsed = ContentJsonSchema.safeParse(data);
    if (!parsed.success) {
      issues.push(...zodIssues(file, parsed.error));
      continue;
    }
    const c = parsed.data;
    // O schema aceita string só com espaços; fonte em branco também reprova.
    c.sections.forEach((s, i) => {
      if (isBlank(s.sourceCitation)) add("erro", file, "RN-018", `sections.${i}.sourceCitation: seção sem fonte`);
    });
    c.questions.forEach((q, i) => {
      if (isBlank(q.sourceCitation)) add("erro", file, "RF-062", `questions.${i}.sourceCitation: questão sem fonte`);
    });
    if (c.questions.length < MIN_QUESTIONS) {
      add("erro", file, "minimo-questoes", `${c.questions.length} questão(ões); mínimo ${MIN_QUESTIONS}`);
    }
    if (c.flashcards.length < MIN_FLASHCARDS) {
      add("erro", file, "minimo-flashcards", `${c.flashcards.length} flashcard(s); mínimo ${MIN_FLASHCARDS}`);
    }
    valid.push({ file, content: c });
  }

  // ---- trilha x arquivos ----
  const trailSet = new Set(trailSlugs);
  for (const slug of trailSlugs) {
    if (present.has(slug)) continue;
    add(
      strict ? "erro" : "pendente",
      FILES.trail,
      "conteudo-pendente",
      `conteúdo "${slug}" da trilha ainda sem arquivo`,
    );
  }
  if (strict && bundle.trail !== undefined) {
    for (const [slug, file] of slugOwner) {
      if (!trailSet.has(slug)) add("erro", file, "fora-da-trilha", `conteúdo "${slug}" não está na trilha`);
    }
  }

  // ---- grafo de pré-requisitos ----
  const graph = new Map<string, string[]>();
  for (const { content } of valid) graph.set(content.slug, []);
  for (const { file, content } of valid) {
    for (const pre of content.prerequisites) {
      if (present.has(pre)) {
        graph.get(pre)?.push(content.slug); // aresta pré-requisito -> conteúdo
      } else if (!trailSet.has(pre)) {
        add("erro", file, "prerequisito-inexistente", `pré-requisito "${pre}" não existe nem consta na trilha`);
      } else if (strict) {
        add("erro", file, "prerequisito-inexistente", `pré-requisito "${pre}" sem arquivo (modo estrito)`);
      }
    }
    for (const rel of content.related) {
      if (!present.has(rel) && !trailSet.has(rel)) {
        add("erro", file, "relacionado-inexistente", `relacionado "${rel}" não existe nem consta na trilha`);
      }
    }
  }
  const cycle = findCycle(graph);
  if (cycle) {
    add("erro", "content/*.json", "ciclo", `ciclo de pré-requisitos (US-006): ${cycle.join(" -> ")}`);
  }

  // ---- mapa de competências ----
  if (bundle.competencyMap === undefined) {
    add("erro", FILES.competencyMap, "arquivo", "arquivo ausente");
  } else {
    const parsed = CompetencyMapJsonSchema.safeParse(bundle.competencyMap);
    if (!parsed.success) {
      issues.push(...zodIssues(FILES.competencyMap, parsed.error));
    } else {
      const covered = new Set(parsed.data.competencies.map((c) => c.competency));
      for (const n of COMPETENCIES) {
        if (!covered.has(n)) add("erro", FILES.competencyMap, "competencia-sem-conteudo", `competência ${n} sem conteúdo`);
      }
      for (const entry of parsed.data.competencies) {
        for (const slug of entry.contentSlugs) {
          if (present.has(slug)) continue;
          if (!trailSet.has(slug)) {
            add("erro", FILES.competencyMap, "slug-inexistente", `C${entry.competency}: "${slug}" não existe nem consta na trilha`);
          } else if (strict) {
            add("erro", FILES.competencyMap, "slug-inexistente", `C${entry.competency}: "${slug}" sem arquivo (modo estrito)`);
          }
        }
      }
    }
  }

  // ---- temas, config, redações da demo ----
  if (bundle.essayTopics === undefined) {
    add("erro", FILES.essayTopics, "arquivo", "arquivo ausente");
  } else {
    const parsed = EssayTopicsJsonSchema.safeParse(bundle.essayTopics);
    if (!parsed.success) issues.push(...zodIssues(FILES.essayTopics, parsed.error));
  }
  if (bundle.config !== undefined) {
    const parsed = AppConfigSchema.safeParse(bundle.config);
    if (!parsed.success) issues.push(...zodIssues(FILES.config, parsed.error));
  }
  if (bundle.demoEssays !== undefined) {
    // O schema exige example_key única nas reservas e topicSlug+part únicos nas da conta demo.
    const parsed = DemoEssaysJsonSchema.safeParse(bundle.demoEssays);
    if (!parsed.success) issues.push(...zodIssues(FILES.demoEssays, parsed.error));
  }

  const errors = issues.filter((i) => i.level === "erro");
  const pending = issues.filter((i) => i.level === "pendente");
  return {
    ok: errors.length === 0,
    strict,
    issues,
    errors,
    pending,
    presentSlugs: [...present],
  };
}

/** Texto do relatório em pt-BR (arquivo, regra, mensagem). */
export function formatReport(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push(`Validação de content/ (modo ${report.strict ? "estrito" : "padrão"})`);
  for (const i of report.issues) {
    lines.push(`[${i.level.toUpperCase()}] ${i.file} | ${i.rule} | ${i.message}`);
  }
  lines.push(
    `Resumo: ${report.presentSlugs.length} conteúdo(s) com arquivo, ${report.pending.length} pendente(s), ${report.errors.length} erro(s).`,
  );
  lines.push(report.ok ? "Resultado: aprovado." : "Resultado: REPROVADO.");
  return lines.join("\n");
}
