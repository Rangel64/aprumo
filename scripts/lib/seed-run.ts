/**
 * Orquestração do seed (T4). Ordem: travas de segurança -> validação TOTAL (sem escrever)
 * -> client -> catálogo -> reservas -> conta demo -> estado-base.
 * Idempotente por chave natural (slug, example_key, pares únicos); a 2ª execução não muda contagens.
 * Nunca loga chaves, URL, e-mail ou senha. Sem `server-only` de propósito (roda sob tsx).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureDemoUser, resetDemoBaseState } from "../../src/server/demo-reset";
import { assertSafeTarget, readSeedEnv } from "./seed-guard";
import { loadSeedPlan, type PlanResult, type SeedPlan } from "./seed-plan";

interface DbResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function must<T>(res: DbResult<T>, context: string): T {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  return res.data as T;
}

export class SeedValidationError extends Error {}

export interface CatalogSummary {
  contents: number;
  edges: number;
  sections: number;
  questions: number;
  flashcards: number;
  trailContents: number;
  competencyContents: number;
  topics: number;
  fallbackExamples: number;
}

/** Grava o catálogo por upsert (chave natural). Pré-condição: plano já validado. */
export async function writeCatalog(client: SupabaseClient, plan: SeedPlan): Promise<CatalogSummary> {
  // contents
  const contentRows = must(
    await client
      .from("contents")
      .upsert(
        plan.contents.map((c) => ({
          slug: c.slug,
          title: c.title,
          summary: c.summary,
          subject: c.subject,
          pos_x: c.position.x,
          pos_y: c.position.y,
          sort: c.sort,
        })),
        { onConflict: "slug" },
      )
      .select("id, slug"),
    "Falha em contents",
  ) as { id: string; slug: string }[];
  const contentId = new Map(contentRows.map((r) => [r.slug, r.id]));

  // content_edges (só entre conteúdos presentes)
  const edges: { from_id: string; to_id: string; kind: string }[] = [];
  for (const c of plan.contents) {
    const to = contentId.get(c.slug)!;
    for (const pre of c.prerequisites) {
      const from = contentId.get(pre);
      if (from) edges.push({ from_id: from, to_id: to, kind: "prerequisite" });
    }
    for (const rel of c.related) {
      const other = contentId.get(rel);
      if (other) edges.push({ from_id: to, to_id: other, kind: "related" });
    }
  }
  if (edges.length > 0) {
    must(await client.from("content_edges").upsert(edges, { onConflict: "from_id,to_id,kind" }), "Falha em content_edges");
  }

  // content_sections
  const sectionRows = plan.contents.flatMap((c) =>
    c.sections.map((s, i) => ({
      content_id: contentId.get(c.slug)!,
      position: i + 1,
      kind: s.kind,
      title: s.title,
      body_md: s.bodyMd,
      quick_question: s.quickQuestion ?? null,
      source_citation: s.sourceCitation,
      source_url: s.sourceUrl ?? null,
    })),
  );
  const sections = must(
    await client
      .from("content_sections")
      .upsert(sectionRows, { onConflict: "content_id,position" })
      .select("id, content_id, position"),
    "Falha em content_sections",
  ) as { id: string; content_id: string; position: number }[];
  const sectionId = new Map(sections.map((s) => [`${s.content_id}|${s.position}`, s.id]));

  // questions + question_keys
  const questionInputs = plan.contents.flatMap((c) =>
    c.questions.map((q) => ({ c, q })),
  );
  const questionRows = questionInputs.map(({ c, q }) => ({
    content_id: contentId.get(c.slug)!,
    section_id: q.sectionPosition
      ? (sectionId.get(`${contentId.get(c.slug)!}|${q.sectionPosition}`) ?? null)
      : null,
    stem: q.stem,
    options: q.options,
    origin: q.origin,
    source_citation: q.sourceCitation,
  }));
  const questions = must(
    await client
      .from("questions")
      .upsert(questionRows, { onConflict: "content_id,stem" })
      .select("id, content_id, stem"),
    "Falha em questions",
  ) as { id: string; content_id: string; stem: string }[];
  const questionId = new Map(questions.map((q) => [`${q.content_id}|${q.stem}`, q.id]));
  const keyRows = questionInputs.map(({ c, q }) => ({
    question_id: questionId.get(`${contentId.get(c.slug)!}|${q.stem}`)!,
    correct_index: q.correctIndex,
    explanation: q.explanation,
  }));
  if (keyRows.length > 0) {
    must(await client.from("question_keys").upsert(keyRows, { onConflict: "question_id" }), "Falha em question_keys");
  }

  // flashcards
  const flashRows = plan.contents.flatMap((c) =>
    c.flashcards.map((f) => ({ content_id: contentId.get(c.slug)!, front: f.front, back: f.back })),
  );
  if (flashRows.length > 0) {
    must(await client.from("flashcards").upsert(flashRows, { onConflict: "content_id,front" }), "Falha em flashcards");
  }

  // trails + trail_contents (posição = índice na lista da Trilha, mesmo com lacunas pendentes)
  const trailRows = must(
    await client
      .from("trails")
      .upsert(
        {
          slug: plan.trail.slug,
          name: plan.trail.name,
          objective: plan.trail.objective,
          origin: plan.trail.origin,
          color: plan.trail.color,
        },
        { onConflict: "slug" },
      )
      .select("id"),
    "Falha em trails",
  ) as { id: string }[];
  const trailId = trailRows[0].id;
  const trailContentRows = plan.trail.contentSlugs.flatMap((slug, i) => {
    const id = contentId.get(slug);
    return id ? [{ trail_id: trailId, content_id: id, position: i + 1 }] : [];
  });
  if (trailContentRows.length > 0) {
    must(
      await client.from("trail_contents").upsert(trailContentRows, { onConflict: "trail_id,content_id" }),
      "Falha em trail_contents",
    );
  }

  // competency_contents
  const compKeys = new Set<string>();
  const compRows: { competency: number; content_id: string; position: number }[] = [];
  for (const entry of plan.competencyMap.competencies) {
    entry.contentSlugs.forEach((slug, i) => {
      const id = contentId.get(slug);
      const key = `${entry.competency}|${id}`;
      if (!id || compKeys.has(key)) return;
      compKeys.add(key);
      compRows.push({ competency: Number(entry.competency), content_id: id, position: i });
    });
  }
  if (compRows.length > 0) {
    must(
      await client.from("competency_contents").upsert(compRows, { onConflict: "competency,content_id" }),
      "Falha em competency_contents",
    );
  }

  // essay_topics
  const topicRows = must(
    await client
      .from("essay_topics")
      .upsert(
        plan.topics.map((t) => ({
          slug: t.slug,
          title: t.title,
          motivating_text: t.motivatingText,
          source_citation: t.sourceCitation ?? null,
        })),
        { onConflict: "slug" },
      )
      .select("id, slug"),
    "Falha em essay_topics",
  ) as { id: string; slug: string }[];
  const topicId = new Map(topicRows.map((t) => [t.slug, t.id]));

  // Reservas (fallbackExamples): upsert por example_key, user_id nulo, com retorno.
  let fallbackExamples = 0;
  if (plan.demoEssays) {
    const examples = plan.demoEssays.fallbackExamples;
    const subs = must(
      await client
        .from("essay_submissions")
        .upsert(
          examples.map((e) => ({
            user_id: null,
            topic_id: topicId.get(e.topicSlug)!,
            part: e.part,
            body: e.body,
            status: "completed",
            is_example: true,
            example_key: e.example_key,
          })),
          { onConflict: "example_key" },
        )
        .select("id, example_key"),
      "Falha em essay_submissions (reservas)",
    ) as { id: string; example_key: string }[];
    const subId = new Map(subs.map((s) => [s.example_key, s.id]));
    must(
      await client.from("essay_feedbacks").upsert(
        examples.map((e) => ({
          submission_id: subId.get(e.example_key)!,
          model_key: e.feedback.modelKey,
          prompt_version: e.feedback.promptVersion,
          payload: e.feedback,
          total_estimate: e.feedback.totalEstimate,
        })),
        { onConflict: "submission_id" },
      ),
      "Falha em essay_feedbacks (reservas)",
    );
    fallbackExamples = examples.length;
  }

  return {
    contents: contentRows.length,
    edges: edges.length,
    sections: sections.length,
    questions: questions.length,
    flashcards: flashRows.length,
    trailContents: trailContentRows.length,
    competencyContents: compRows.length,
    topics: topicRows.length,
    fallbackExamples,
  };
}

export interface SeedDeps {
  rootDir: string;
  env: Record<string, string | undefined>;
  argv: readonly string[];
  /** Só é chamado DEPOIS da validação; em teste, prova que não houve escrita. */
  createClient: (url: string, serviceRoleKey: string) => SupabaseClient;
  loadPlan?: (rootDir: string, options: { strict?: boolean }) => PlanResult;
  log?: (message: string) => void;
  now?: Date;
}

export async function runSeed(deps: SeedDeps): Promise<void> {
  const log = deps.log ?? ((m: string) => console.log(m));
  const cfg = readSeedEnv(deps.env);
  const target = assertSafeTarget({ url: cfg.url, argv: deps.argv, env: deps.env });
  log(target.local ? "Destino: Supabase local." : "Destino: Supabase remoto de desenvolvimento (confirmado).");

  const loadPlan = deps.loadPlan ?? loadSeedPlan;
  const planResult = loadPlan(deps.rootDir, { strict: deps.argv.includes("--strict") });
  if (!planResult.ok) {
    const shown = planResult.errors.slice(0, 50).join("\n");
    const more = planResult.errors.length > 50 ? `\n... e mais ${planResult.errors.length - 50}` : "";
    throw new SeedValidationError(`Conteúdo inválido; nada foi escrito.\n${shown}${more}`);
  }
  const { plan } = planResult;
  for (const note of plan.notes) log(`Aviso: ${note}`);

  const client = deps.createClient(cfg.url, cfg.serviceRoleKey);
  const catalog = await writeCatalog(client, plan);
  log(`Catálogo: ${JSON.stringify(catalog)}`);

  const userId = await ensureDemoUser(client, { email: cfg.demoEmail, password: cfg.demoPassword });
  const summary = await resetDemoBaseState(client, {
    userId,
    demoEssays: plan.demoEssays?.demoAccountEssays ?? null,
    now: deps.now,
  });
  log(`Conta demo (estado-base): ${JSON.stringify(summary)}`);
  if (summary.essays === null) log("Redações da demo não carregadas (sem demo-essays.json).");
}
