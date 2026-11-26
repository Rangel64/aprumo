/**
 * Plano do seed (T4): lê content/**, valida TUDO (schemas de content.ts + validador da T12)
 * e devolve os dados prontos para gravar. Não toca em banco nem em variáveis de ambiente.
 * Sem `server-only` de propósito (roda sob tsx).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CompetencyMapJsonSchema,
  ContentJsonSchema,
  DemoEssaysJsonSchema,
  EssayTopicsJsonSchema,
  TrailJsonSchema,
  type CompetencyMapJson,
  type ContentJson,
  type DemoEssaysJson,
  type EssayTopicsJson,
  type TrailJson,
} from "../../src/contracts/content";
import type { ContentBundle } from "../../src/domain/content/validate";
import { validateContent } from "../validate-content";

const RESERVED = new Set(["trail.json", "competency-map.json", "essay-topics.json", "config.json"]);

export interface SeedPlan {
  contents: ContentJson[];
  trail: TrailJson;
  competencyMap: CompetencyMapJson;
  topics: EssayTopicsJson["topics"];
  /** `null` quando content/essays/demo-essays.json ainda não existe (T18). */
  demoEssays: DemoEssaysJson | null;
  /** Avisos não fatais (itens ignorados), para o log. */
  notes: string[];
}

export type PlanResult = { ok: true; plan: SeedPlan } | { ok: false; errors: string[] };

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Lê content/ cru (mesmo layout do validador). Arquivo ilegível vira `undefined`; o validador T12 já o reporta. */
export function loadBundle(rootDir: string): ContentBundle {
  const dir = join(rootDir, "content");
  const load = (...rel: string[]): unknown => {
    const full = join(dir, ...rel);
    if (!existsSync(full)) return undefined;
    try {
      return readJson(full);
    } catch {
      return undefined;
    }
  };
  const bundle: ContentBundle = {
    contents: [],
    trail: load("trail.json"),
    competencyMap: load("competency-map.json"),
    essayTopics: load("essay-topics.json"),
    config: load("config.json"),
    demoEssays: load("essays", "demo-essays.json"),
  };
  if (existsSync(dir)) {
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith(".json") || RESERVED.has(name)) continue;
      const data = load(name);
      if (data !== undefined) bundle.contents.push({ file: `content/${name}`, data });
    }
  }
  return bundle;
}

function issuesOf(file: string, error: { issues: { path: PropertyKey[]; message: string }[] }): string[] {
  return error.issues.map((i) => `${file}: ${i.path.map(String).join(".") || "(raiz)"}: ${i.message}`);
}

/** Valida o bundle com os schemas de content.ts e as referências cruzadas. Pura. */
export function buildSeedPlan(bundle: ContentBundle): PlanResult {
  const errors: string[] = [];
  const notes: string[] = [];

  const trailP = TrailJsonSchema.safeParse(bundle.trail);
  if (!trailP.success) errors.push(...issuesOf("content/trail.json", trailP.error));
  const mapP = CompetencyMapJsonSchema.safeParse(bundle.competencyMap);
  if (!mapP.success) errors.push(...issuesOf("content/competency-map.json", mapP.error));
  const topicsP = EssayTopicsJsonSchema.safeParse(bundle.essayTopics);
  if (!topicsP.success) errors.push(...issuesOf("content/essay-topics.json", topicsP.error));

  const contents: ContentJson[] = [];
  const seen = new Set<string>();
  for (const { file, data } of bundle.contents) {
    const p = ContentJsonSchema.safeParse(data);
    if (!p.success) {
      errors.push(...issuesOf(file, p.error));
      continue;
    }
    if (seen.has(p.data.slug)) errors.push(`${file}: slug "${p.data.slug}" repetido`);
    seen.add(p.data.slug);
    contents.push(p.data);
  }

  let demoEssays: DemoEssaysJson | null = null;
  if (bundle.demoEssays === undefined) {
    notes.push(
      "content/essays/demo-essays.json ainda não existe (T18): reservas e redações da demo ignoradas; rode o seed de novo quando o arquivo existir.",
    );
  } else {
    const p = DemoEssaysJsonSchema.safeParse(bundle.demoEssays);
    if (p.success) demoEssays = p.data;
    else errors.push(...issuesOf("content/essays/demo-essays.json", p.error));
  }

  if (demoEssays && topicsP.success) {
    const topicSlugs = new Set(topicsP.data.topics.map((t) => t.slug));
    const all = [...demoEssays.demoAccountEssays, ...demoEssays.fallbackExamples];
    for (const e of all) {
      if (!topicSlugs.has(e.topicSlug)) {
        errors.push(`content/essays/demo-essays.json: topicSlug "${e.topicSlug}" não existe em essay-topics.json`);
      }
    }
  }

  if (errors.length > 0 || !trailP.success || !mapP.success || !topicsP.success) {
    return { ok: false, errors };
  }

  const missing = trailP.data.contentSlugs.filter((s) => !seen.has(s));
  if (missing.length > 0) {
    notes.push(`${missing.length} conteúdo(s) da Trilha ainda sem arquivo: ignorados nesta execução.`);
  }

  return {
    ok: true,
    plan: {
      contents,
      trail: trailP.data,
      competencyMap: mapP.data,
      topics: topicsP.data.topics,
      demoEssays,
      notes,
    },
  };
}

/** Validador T12 (disco) + schemas, tudo ANTES de qualquer escrita. */
export function loadSeedPlan(rootDir: string, options: { strict?: boolean } = {}): PlanResult {
  const report = validateContent(rootDir, { strict: options.strict === true });
  if (!report.ok) {
    return {
      ok: false,
      errors: report.errors.map((e) => `${e.file}: [${e.rule}] ${e.message}`),
    };
  }
  return buildSeedPlan(loadBundle(rootDir));
}
