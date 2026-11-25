/**
 * Validador de content/ (T12). Uso: pnpm tsx scripts/validate-content.ts [--strict]
 * Padrão: conteúdos da trilha ainda sem arquivo aparecem como "pendente" (não falham).
 * --strict: todo slug da trilha precisa ter arquivo e passar em todas as regras (CI final).
 * Lê só content/**; nunca lê .env nem imprime chaves. Sem `server-only` de propósito (tsx).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  formatReport,
  validateBundle,
  type ContentBundle,
  type ContentIssue,
  type ValidateOptions,
  type ValidationReport,
} from "../src/domain/content/validate";

const RESERVED = new Set(["trail.json", "competency-map.json", "essay-topics.json", "config.json"]);

function readJson(file: string): { data?: unknown; issue?: ContentIssue } {
  try {
    return { data: JSON.parse(readFileSync(file, "utf8")) };
  } catch {
    return { issue: { level: "erro", file, rule: "json", message: "JSON ilegível ou inválido" } };
  }
}

/** Lê content/ em `rootDir` (raiz do projeto) e valida. O seed da T4 chama esta função. */
export function validateContent(rootDir: string, options: ValidateOptions = {}): ValidationReport {
  const dir = join(rootDir, "content");
  const readIssues: ContentIssue[] = [];
  const load = (rel: string): unknown => {
    const full = join(dir, rel);
    if (!existsSync(full)) return undefined;
    const r = readJson(full);
    if (r.issue) readIssues.push({ ...r.issue, file: `content/${rel}` });
    return r.data;
  };

  const bundle: ContentBundle = {
    contents: [],
    trail: load("trail.json"),
    competencyMap: load("competency-map.json"),
    essayTopics: load("essay-topics.json"),
    config: load("config.json"),
    demoEssays: load(join("essays", "demo-essays.json")),
  };
  if (existsSync(dir)) {
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith(".json") || RESERVED.has(name)) continue;
      const data = load(name);
      if (data !== undefined) bundle.contents.push({ file: `content/${name}`, data });
    }
  }

  const report = validateBundle(bundle, options);
  if (readIssues.length === 0) return report;
  const errors = [...readIssues, ...report.errors];
  return { ...report, ok: false, issues: [...readIssues, ...report.issues], errors };
}

function main(): void {
  const strict = process.argv.includes("--strict");
  const report = validateContent(resolve(process.cwd()), { strict });
  console.log(formatReport(report));
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
