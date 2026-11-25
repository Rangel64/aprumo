/**
 * Verificação de RLS e CHECKs da migration 0001 (KAN-33 / T2), contra o banco REAL (aprumo-dev).
 *
 * Uso (o PO executa; nunca cole as chaves em chat, PR ou log):
 *   pnpm exec tsx --env-file=.env.local scripts/rls-check.ts
 *
 * Lê só process.env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 * Não lê nem grava arquivo de credencial; não imprime chave, token nem senha.
 * Cria 3 usuários de teste e dados de apoio (prefixo "rls-check-"), executa os casos como
 * anon/A/B e apaga tudo no final (inclusive em falha). Em FAIL só relata: nunca corrige banco nem política.
 * Sem `server-only` de propósito: roda sob tsx.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  classify, formatTable, redact, summarize, truncate, violatesConstraint,
  type CheckResult, type Outcome, type Resp,
} from "./lib/rls-report";

const CLIENT_OPTS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

const ALL_TABLES = [
  "profiles", "contents", "content_edges", "content_sections", "questions", "question_keys",
  "trails", "trail_contents", "flashcards", "competency_contents", "essay_topics", "journeys",
  "journey_contents", "availability_slots", "schedule_sessions", "flashcard_states",
  "essay_submissions", "content_progress", "quiz_attempts", "essay_feedbacks", "ai_usage", "app_config",
];

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável ausente: ${name} (use --env-file=.env.local).`);
  return v;
}

function strongPassword(): string {
  return `${randomBytes(24).toString("base64url")}aA1!`;
}

/** Dado de apoio: lança com o rótulo se falhar (sem eco de segredo). */
function must<T>(res: { data: T; error: { message: string } | null }, label: string): NonNullable<T> {
  if (res.error || res.data === null || res.data === undefined) {
    throw new Error(`Falha ao preparar "${label}": ${res.error?.message ?? "sem dados"}`);
  }
  return res.data as NonNullable<T>;
}

async function main(): Promise<number> {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  const runId = randomBytes(4).toString("hex");
  const prefix = `rls-check-${runId}`;
  const marker = `rls-check-body-${runId}`; // body de toda redação criada aqui (limpeza por marcador)
  const emailA = `rls-a-${runId}@example.com`;
  const emailB = `rls-b-${runId}@example.com`;
  const emailC = `rls-c-${runId}@example.com`; // cadastro com metadata is_demo
  const passA = strongPassword();
  const passB = strongPassword();
  const passC = strongPassword();
  const secrets: string[] = [anonKey, serviceKey, passA, passB, passC];

  const admin = createClient(url, serviceKey, CLIENT_OPTS);
  const userIds: string[] = [];
  const results: CheckResult[] = [];

  const clean = (t: string) => redact(t, secrets);
  const push = (name: string, expected: string, obtained: string, pass: boolean) =>
    results.push({ name, expected, obtained: clean(obtained), pass });

  async function run(p: PromiseLike<Resp>): Promise<Outcome> {
    try {
      return classify(await p);
    } catch (e) {
      return { denied: false, detail: `exceção: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
  /** Esperado: erro ou 0 linhas. */
  async function expectDenied(name: string, p: PromiseLike<Resp>): Promise<void> {
    const o = await run(p);
    push(name, "negado (erro ou 0 linhas)", o.detail, o.denied);
  }
  /** Esperado: só erro (insert/rpc: não há linha a filtrar). */
  async function expectError(name: string, p: PromiseLike<Resp>): Promise<void> {
    const o = await run(p);
    push(name, "erro (negado)", o.detail, o.denied && o.detail.startsWith("erro"));
  }
  /** Esperado: exatamente `n` linhas. */
  async function expectRows(name: string, n: number, p: PromiseLike<Resp>): Promise<void> {
    try {
      const res = await p;
      const count = Array.isArray(res.data) ? res.data.length : 0;
      push(name, `${n} linha(s)`, res.error ? `erro: ${res.error.message}` : `${count} linha(s)`, !res.error && count === n);
    } catch (e) {
      push(name, `${n} linha(s)`, `exceção: ${e instanceof Error ? e.message : String(e)}`, false);
    }
  }
  function expectEq(name: string, expected: string, obtained: string): void {
    push(name, expected, obtained, expected === obtained);
  }

  // ---- Limpeza (idempotente; nunca esconde o resultado dos casos) ----
  let cleaning: Promise<string[]> | null = null;
  const cleanup = (): Promise<string[]> => (cleaning ??= doCleanup());
  async function doCleanup(): Promise<string[]> {
    const problems: string[] = [];
    const step = async (label: string, fn: () => PromiseLike<{ error: { message: string } | null }>) => {
      try {
        const { error } = await fn();
        if (error) problems.push(`${label}: ${error.message}`);
      } catch (e) {
        problems.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    await step("essay_submissions (marcador)", () => admin.from("essay_submissions").delete().eq("body", marker));
    await step("essay_submissions (example_key)", () =>
      admin.from("essay_submissions").delete().like("example_key", `${prefix}%`));
    for (const id of userIds) {
      await step(`usuário ${id}`, () => admin.auth.admin.deleteUser(id));
    }
    await step("contents", () => admin.from("contents").delete().like("slug", `${prefix}%`));
    await step("trails", () => admin.from("trails").delete().like("slug", `${prefix}%`));
    await step("essay_topics", () => admin.from("essay_topics").delete().like("slug", `${prefix}%`));
    return problems.map((p) => clean(p));
  }
  const onSignal = () => {
    console.error("\nInterrompido: limpando os dados de teste...");
    void cleanup().then(() => process.exit(130));
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  let setupError: string | null = null;
  try {
    // ---- 1. Usuários de teste ----
    const mkUser = async (email: string, password: string): Promise<string> => {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data.user) throw new Error(`Falha ao criar usuário de teste: ${error?.message ?? "sem usuário"}`);
      userIds.push(data.user.id);
      return data.user.id;
    };
    const idA = await mkUser(emailA, passA);
    const idB = await mkUser(emailB, passB);

    // ---- 2. Dados de apoio (service role) ----
    const content = must(
      await admin.from("contents").insert({ slug: `${prefix}-c1`, title: "RLS c1", summary: "r", subject: "teste" }).select("id").single(),
      "contents",
    );
    const content2 = must(
      await admin.from("contents").insert({ slug: `${prefix}-c2`, title: "RLS c2", summary: "r", subject: "teste" }).select("id").single(),
      "contents 2",
    );
    const section = must(
      await admin.from("content_sections").insert({
        content_id: content.id, position: 1, kind: "text", title: "s", body_md: "b", source_citation: "rls-check",
      }).select("id").single(),
      "content_sections",
    );
    const question = must(
      await admin.from("questions").insert({
        content_id: content.id, section_id: section.id, stem: `${prefix}-q`, options: ["a", "b"],
        origin: "original", source_citation: "rls-check",
      }).select("id").single(),
      "questions",
    );
    must(
      await admin.from("question_keys").insert({ question_id: question.id, correct_index: 0, explanation: "e" }).select("question_id").single(),
      "question_keys",
    );
    const trail = must(
      await admin.from("trails").insert({ slug: `${prefix}-t`, name: "RLS trilha", objective: "o" }).select("id").single(),
      "trails",
    );
    const topic = must(
      await admin.from("essay_topics").insert({ slug: `${prefix}-tema`, title: "RLS tema", motivating_text: "m" }).select("id").single(),
      "essay_topics",
    );
    const journeyB = must(
      await admin.from("journeys").insert({
        user_id: idB, base_type: "contents", goal_description: "meta de B", deadline: "2099-12-31",
      }).select("id").single(),
      "journeys B",
    );
    const mkSub = async (userId: string | null, extra: Record<string, unknown>, label: string): Promise<string> => {
      const row = must(
        await admin.from("essay_submissions").insert({
          user_id: userId, topic_id: topic.id, part: "introduction", body: marker, ...extra,
        }).select("id").single(),
        label,
      );
      return row.id as string;
    };
    const subB = await mkSub(idB, {}, "essay_submissions B");
    const subA = await mkSub(idA, {}, "essay_submissions A");
    const subA2 = await mkSub(idA, {}, "essay_submissions A (2)");
    const subEx = await mkSub(null, { is_example: true, example_key: `${prefix}-ex` }, "essay_submissions reserva");
    for (const submission_id of [subB, subA, subEx]) {
      must(
        await admin.from("essay_feedbacks").insert({
          submission_id, model_key: "m", prompt_version: "rls-check", payload: {},
        }).select("id").single(),
        "essay_feedbacks",
      );
    }
    const aiB = must(
      await admin.from("ai_usage").insert({ user_id: idB, feature: "essay_feedback", status: "succeeded" }).select("id").single(),
      "ai_usage B",
    );
    must(
      await admin.from("ai_usage").insert({ user_id: idA, feature: "essay_feedback", status: "succeeded" }).select("id").single(),
      "ai_usage A",
    );
    must(
      await admin.from("content_progress").insert({ user_id: idB, content_id: content.id, status: "studying" }).select("user_id").single(),
      "content_progress B",
    );
    must(
      await admin.from("content_progress").insert({ user_id: idA, content_id: content2.id, status: "studying" }).select("user_id").single(),
      "content_progress A",
    );
    must(
      await admin.from("quiz_attempts").insert({
        user_id: idA, content_id: content.id, answers: [], correct: 1, total: 1, threshold_pct: 80, passed: true,
      }).select("id").single(),
      "quiz_attempts A",
    );

    // ---- Clientes autenticados ----
    const login = async (email: string, password: string): Promise<SupabaseClient> => {
      const c = createClient(url, anonKey, CLIENT_OPTS);
      const { error } = await c.auth.signInWithPassword({ email, password });
      if (error) throw new Error(`Login de teste falhou (${email}): ${error.message}`);
      return c;
    };
    const a = await login(emailA, passA);
    const b = await login(emailB, passB);
    const anon = createClient(url, anonKey, CLIENT_OPTS);

    // ---- Controles positivos (sem eles, "0 linhas" poderia ser teste mal feito) ----
    await expectRows("(ctl) A lê o próprio profile", 1, a.from("profiles").select("id").eq("id", idA));
    await expectRows("(ctl) A lê a própria redação", 1, a.from("essay_submissions").select("id").eq("id", subA));
    await expectRows("(ctl) A lê o próprio feedback", 1, a.from("essay_feedbacks").select("id").eq("submission_id", subA));
    await expectRows("(ctl) A lê o próprio content_progress", 1, a.from("content_progress").select("user_id").eq("user_id", idA));
    await expectRows("(ctl) A lê o próprio ai_usage", 1, a.from("ai_usage").select("id").eq("user_id", idA));
    await expectRows("(ctl) B lê a própria Jornada", 1, b.from("journeys").select("id").eq("id", journeyB.id));
    {
      const o = await run(a.from("essay_submissions").insert({ user_id: idA, topic_id: topic.id, part: "development", body: marker }));
      push("(ctl) A insere a própria redação (is_example=false)", "aceito (sem erro)", o.detail,
        !o.detail.startsWith("erro") && !o.detail.startsWith("exceção"));
    }

    // ---- (a) A não lê nem altera dados de B ----
    const bData: Array<[string, Record<string, string>, Record<string, unknown>]> = [
      ["journeys", { id: journeyB.id }, { goal_description: "invadido" }],
      ["essay_submissions", { id: subB }, { status: "completed" }],
      ["essay_feedbacks", { submission_id: subB }, { model_key: "invadido" }],
      ["content_progress", { user_id: idB }, { status: "studying" }],
      ["ai_usage", { id: aiB.id }, { cost_usd: 0 }],
    ];
    for (const [table, match, patch] of bData) {
      await expectDenied(`(a) A lê ${table} de B`, a.from(table).select("*").match(match));
      await expectDenied(`(a) A altera ${table} de B`, a.from(table).update(patch).match(match).select());
      await expectDenied(`(a) A apaga ${table} de B`, a.from(table).delete().match(match).select());
    }

    // ---- (b) catálogo: lê, não escreve ----
    const catalog: Array<[string, Record<string, string>, Record<string, unknown>, Record<string, unknown>]> = [
      ["contents", { id: content.id }, { title: "invadido" }, { slug: `${prefix}-c3`, title: "x", summary: "x", subject: "x" }],
      ["content_sections", { id: section.id }, { title: "invadido" }, {
        content_id: content.id, position: 9, kind: "text", title: "x", body_md: "x", source_citation: "x" }],
      ["questions", { id: question.id }, { stem: "invadido" }, {
        content_id: content.id, stem: `${prefix}-q2`, options: ["a"], origin: "original", source_citation: "x" }],
      ["trails", { id: trail.id }, { name: "invadido" }, { slug: `${prefix}-t2`, name: "x", objective: "x" }],
    ];
    for (const [table, match, patch, row] of catalog) {
      await expectRows(`(b) A lê ${table}`, 1, a.from(table).select("id").match(match));
      await expectError(`(b) A insere em ${table}`, a.from(table).insert(row));
      await expectDenied(`(b) A altera ${table}`, a.from(table).update(patch).match(match).select());
      await expectDenied(`(b) A apaga ${table}`, a.from(table).delete().match(match).select());
    }

    // ---- (c) question_keys e app_config ----
    await expectDenied("(c) A lê question_keys", a.from("question_keys").select("*").eq("question_id", question.id));
    await expectDenied("(c) A lê app_config", a.from("app_config").select("*"));

    // ---- (d) escritas do servidor: A não insere nem altera ----
    await expectError("(d) A insere content_progress", a.from("content_progress").insert({
      user_id: idA, content_id: content.id, status: "studying" }));
    await expectError("(d) A insere quiz_attempts", a.from("quiz_attempts").insert({
      user_id: idA, content_id: content.id, answers: [], correct: 1, total: 1, threshold_pct: 80, passed: true }));
    await expectError("(d) A insere ai_usage", a.from("ai_usage").insert({
      user_id: idA, feature: "essay_feedback", status: "succeeded" }));
    await expectError("(d) A insere essay_feedbacks", a.from("essay_feedbacks").insert({
      submission_id: subA2, model_key: "m", prompt_version: "v", payload: {} }));
    await expectDenied("(d) A altera content_progress (próprio)", a.from("content_progress")
      .update({ status: "mastered", mastered_at: "2099-01-01T00:00:00Z" }).eq("user_id", idA).select());
    await expectDenied("(d) A altera quiz_attempts (próprio)", a.from("quiz_attempts").update({ passed: false }).eq("user_id", idA).select());
    await expectDenied("(d) A altera ai_usage (próprio)", a.from("ai_usage").update({ cost_usd: 0 }).eq("user_id", idA).select());
    await expectDenied("(d) A altera essay_feedbacks (próprio)", a.from("essay_feedbacks").update({ model_key: "x" }).eq("submission_id", subA).select());
    await expectDenied("(d) A apaga ai_usage (próprio)", a.from("ai_usage").delete().eq("user_id", idA).select());

    // ---- (e) essay_submissions ----
    await expectError("(e) A insere redação com user_id de B", a.from("essay_submissions").insert({
      user_id: idB, topic_id: topic.id, part: "introduction", body: marker }));
    await expectError("(e) A insere redação com user_id nulo e is_example=false", a.from("essay_submissions").insert({
      user_id: null, topic_id: topic.id, part: "introduction", body: marker }));
    await expectError("(e) A insere redação com is_example=true (própria, com example_key)", a.from("essay_submissions").insert({
      user_id: idA, topic_id: topic.id, part: "introduction", body: marker, is_example: true, example_key: `${prefix}-a1` }));
    await expectError("(e) A insere reserva (user_id nulo, is_example=true)", a.from("essay_submissions").insert({
      user_id: null, topic_id: topic.id, part: "introduction", body: marker, is_example: true, example_key: `${prefix}-a2` }));
    await expectDenied("(e) A faz UPDATE em essay_submissions (própria)", a.from("essay_submissions")
      .update({ status: "completed" }).eq("id", subA2).select());
    await expectDenied("(e) A vira a própria redação em reserva (UPDATE)", a.from("essay_submissions")
      .update({ is_example: true, example_key: `${prefix}-a3` }).eq("id", subA2).select());

    // ---- (f) reserva invisível ----
    await expectDenied("(f) A lê a linha de reserva", a.from("essay_submissions").select("id").eq("id", subEx));
    await expectDenied("(f) A lê reservas (is_example=true)", a.from("essay_submissions").select("id").eq("is_example", true));
    await expectDenied("(f) A lê o feedback da reserva", a.from("essay_feedbacks").select("id").eq("submission_id", subEx));
    await expectDenied("(f) A apaga a reserva", a.from("essay_submissions").delete().eq("id", subEx).select());

    // ---- (g) Jornada de B ----
    await expectError("(g) A insere journey_contents na Jornada de B", a.from("journey_contents").insert({
      journey_id: journeyB.id, content_id: content.id, position: 1, added_from: "map" }));
    await expectError("(g) A insere schedule_sessions na Jornada de B (user_id de A)", a.from("schedule_sessions").insert({
      user_id: idA, journey_id: journeyB.id, content_id: content.id, starts_at: "2099-01-01T10:00:00Z", minutes: 30 }));
    await expectError("(g) A insere schedule_sessions na Jornada de B (user_id de B)", a.from("schedule_sessions").insert({
      user_id: idB, journey_id: journeyB.id, content_id: content.id, starts_at: "2099-01-01T10:00:00Z", minutes: 30 }));

    // ---- (h) profiles ----
    await expectRows("(h) A altera o próprio display_name", 1, a.from("profiles").update({ display_name: "Aluno RLS" }).eq("id", idA).select("id"));
    await expectError("(h) A altera is_demo", a.from("profiles").update({ is_demo: true }).eq("id", idA).select());
    await expectError("(h) A altera essay_daily_limit_override", a.from("profiles")
      .update({ essay_daily_limit_override: 999 }).eq("id", idA).select());
    await expectDenied("(h) A altera o display_name de B", a.from("profiles").update({ display_name: "invadido" }).eq("id", idB).select());
    {
      const { data } = await admin.from("profiles").select("id, display_name, is_demo, essay_daily_limit_override").in("id", [idA, idB]);
      const pa = data?.find((p) => p.id === idA);
      const pb = data?.find((p) => p.id === idB);
      expectEq("(h) profile de A: display_name mudou; is_demo e limite intactos", "Aluno RLS|false|null",
        `${pa?.display_name}|${pa?.is_demo}|${pa?.essay_daily_limit_override}`);
      expectEq("(h) profile de B intacto (sem display_name, is_demo=false, sem limite)", "null|false|null",
        `${pb?.display_name}|${pb?.is_demo}|${pb?.essay_daily_limit_override}`);
    }

    // ---- (i) anon ----
    {
      const leaks: string[] = [];
      let errors = 0;
      let empty = 0;
      for (const table of ALL_TABLES) {
        const o = await run(anon.from(table).select("*").limit(1));
        if (!o.denied) leaks.push(table);
        else if (o.detail.startsWith("erro")) errors++;
        else empty++;
      }
      push(
        `(i) anon não lê nenhuma das ${ALL_TABLES.length} tabelas`,
        "negado em todas",
        leaks.length === 0 ? `negado em todas (${errors} com erro, ${empty} com 0 linhas)` : `LEU: ${leaks.join(", ")}`,
        leaks.length === 0,
      );
    }

    // ---- (j) trigger de profile e metadata is_demo ----
    {
      const { data } = await admin.from("profiles").select("id, is_demo").in("id", [idA, idB]);
      const rows = data ?? [];
      expectEq("(j) trigger criou profiles de A e B com is_demo=false", "2 profiles, 0 com is_demo=true",
        `${rows.length} profiles, ${rows.filter((p) => p.is_demo).length} com is_demo=true`);
    }
    {
      const { data, error } = await anon.auth.signUp({
        email: emailC, password: passC, options: { data: { is_demo: true, display_name: "Teste RLS" } },
      });
      if (data.user) userIds.push(data.user.id);
      if (error || !data.user) {
        push("(j) signUp com metadata is_demo=true resulta em is_demo=false", "is_demo=false",
          `signUp falhou: ${error?.message ?? "sem usuário"}`, false);
      } else {
        const { data: prof } = await admin.from("profiles").select("is_demo, display_name").eq("id", data.user.id).maybeSingle();
        expectEq("(j) signUp com metadata is_demo=true resulta em is_demo=false (display_name vem do metadata)",
          "is_demo=false, display_name=Teste RLS", `is_demo=${prof?.is_demo}, display_name=${prof?.display_name}`);
      }
    }

    // ---- (k) handle_new_user não chamável por rpc ----
    await expectError("(k) anon chama rpc handle_new_user", anon.rpc("handle_new_user"));
    await expectError("(k) authenticated (A) chama rpc handle_new_user", a.rpc("handle_new_user"));

    // ---- (l) CHECKs (service role) ----
    {
      const r1 = await run(admin.from("essay_submissions").insert({
        user_id: null, topic_id: topic.id, part: "introduction", body: marker, is_example: false }));
      // Conferência sobre a mensagem completa (r.raw): o detail exibido é truncado e pode cortar o nome.
      push("(l) CHECK: sem user_id e is_example=false", "erro essay_submissions_owner_or_example", r1.detail,
        violatesConstraint(r1, "essay_submissions_owner_or_example"));
      const r2 = await run(admin.from("essay_submissions").insert({
        user_id: null, topic_id: topic.id, part: "introduction", body: marker, is_example: true }));
      push("(l) CHECK: is_example=true sem example_key", "erro essay_submissions_example_key_matches", r2.detail,
        violatesConstraint(r2, "essay_submissions_example_key_matches"));
    }

    // ---- (m) app_config ----
    {
      const file = resolve(process.cwd(), "content", "config.json");
      const expectedKeys = Object.keys(JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>);
      const { data, error } = await admin.from("app_config").select("key");
      const got = (data ?? []).map((r) => r.key as string);
      const missing = expectedKeys.filter((k) => !got.includes(k));
      push(
        `(m) app_config tem as ${expectedKeys.length} chaves de content/config.json`,
        `${expectedKeys.length} chaves presentes`,
        error ? `erro: ${error.message}` : missing.length === 0 ? `${expectedKeys.length} chaves presentes` : `faltam: ${missing.join(", ")}`,
        !error && missing.length === 0,
      );
    }

    // ---- Integridade: nada de B nem do catálogo mudou pelas tentativas de A ----
    {
      const [j, c, s] = await Promise.all([
        admin.from("journeys").select("goal_description").eq("id", journeyB.id).maybeSingle(),
        admin.from("contents").select("title").eq("id", content.id).maybeSingle(),
        admin.from("essay_submissions").select("status").eq("id", subB).maybeSingle(),
      ]);
      expectEq("(a/b) dados de B e do catálogo intactos após as tentativas de A", "meta de B|RLS c1|pending",
        `${j.data?.goal_description}|${c.data?.title}|${s.data?.status}`);
    }
  } catch (e) {
    setupError = clean(e instanceof Error ? e.message : String(e));
  }

  const cleanupProblems = await cleanup();
  process.removeListener("SIGINT", onSignal);
  process.removeListener("SIGTERM", onSignal);

  const summary = summarize(results);
  console.log(formatTable(results));
  console.log(`\n${summary.line}.`);
  if (summary.failed.length > 0) {
    console.log(`FALHAS (${summary.failed.length}): ${summary.failed.map((r) => truncate(r.name, 60)).join("; ")}`);
    console.log("Nada foi corrigido: relate os FAIL ao time (sem chaves).");
  }
  if (setupError) {
    console.error(`\nERRO na execução (resultados acima são parciais): ${setupError}`);
  }
  if (cleanupProblems.length > 0) {
    console.error(
      `\nAVISO: a limpeza teve problemas; pode haver lixo no banco (usuários rls-*@example.com e slugs ${prefix}*):\n- ${cleanupProblems.join("\n- ")}`,
    );
  } else {
    console.log("Limpeza concluída: usuários e dados de teste apagados.");
  }
  const bad = summary.failed.length > 0 || setupError !== null || cleanupProblems.length > 0 || results.length === 0;
  return bad ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : "Erro inesperado.");
    process.exit(1);
  },
);
