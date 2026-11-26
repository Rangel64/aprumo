/**
 * Conta demo (T4, KAN-35): criação/atualização da conta e reposição do estado-base.
 * Reutilizada pelo `scripts/seed.ts` e pelo cron diário (T5).
 *
 * Sem `import "server-only"` de propósito: o seed roda sob `tsx`, onde esse pacote lança erro.
 * O módulo NÃO cria client nem lê a service role: recebe o client já criado pelo chamador
 * (`createAdminClient()` no cron; client do próprio script no seed). Nunca importe daqui
 * em código de cliente.
 *
 * Estado-base: 3 conteúdos dominados (os 3 primeiros da Trilha), 1 Jornada ativa (meta fictícia,
 * prazo hoje + 30 dias), flashcards desses conteúdos vencidos hoje e as redações da demo.
 * Nunca escreve em `ai_usage`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DemoEssaysJson } from "@/contracts/content";

export type DemoAccountEssay = DemoEssaysJson["demoAccountEssays"][number];

export const DEMO_DISPLAY_NAME = "Aluno Demo";
export const DEMO_MASTERED_COUNT = 3;
export const DEMO_JOURNEY_GOAL = "Dominar a base da redação (meta fictícia da demo)";
export const DEMO_DEADLINE_DAYS = 30;
const DEMO_TIMEZONE = "America/Sao_Paulo";
const MAX_USER_PAGES = 50;

export interface DemoResetSummary {
  masteredContents: number;
  journeyContents: number;
  flashcardStates: number;
  /** Redações repostas; `null` quando `demoEssays` não foi informado (nada foi tocado). */
  essays: number | null;
  deadline: string;
}

interface DbResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function must<T>(res: DbResult<T>, context: string): T {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  return res.data as T;
}

/** Data (YYYY-MM-DD) em America/Sao_Paulo, o mesmo fuso de `ai_usage.usage_date`. */
export function localDateIso(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DEMO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const out = new Date(Date.UTC(y, m - 1, d + days));
  return out.toISOString().slice(0, 10);
}

function isAlreadyExists(err: { message?: string; code?: string }): boolean {
  return err.code === "email_exists" || /already|exists|registered/i.test(err.message ?? "");
}

/** Remove e-mail, senha e URLs da mensagem de erro antes de reportá-la. */
function redact(message: string | undefined, secrets: string[]): string {
  let out = message ?? "erro desconhecido";
  for (const s of secrets) if (s) out = out.split(s).join("[omitido]");
  return out.replace(/https?:\/\/\S+/gi, "[url omitida]");
}

/** Cria a conta demo ou atualiza a senha e o perfil dela. Devolve o id; nunca loga e-mail nem senha. */
export async function ensureDemoUser(
  client: SupabaseClient,
  creds: { email: string; password: string },
): Promise<string> {
  const email = creds.email.trim().toLowerCase();
  const created = await client.auth.admin.createUser({
    email,
    password: creds.password,
    email_confirm: true,
    user_metadata: { display_name: DEMO_DISPLAY_NAME },
  });

  let userId = created.data?.user?.id;
  if (!userId) {
    // Só "já existe" segue para listUsers; qualquer outra falha (senha fraca etc.) é reportada.
    if (created.error && !isAlreadyExists(created.error)) {
      throw new Error(
        `Falha ao criar a conta demo: ${redact(created.error.message, [email, creds.password])}`,
      );
    }
    // Já existe: procura pelo e-mail e atualiza a senha.
    let found: string | undefined;
    for (let page = 1; page <= MAX_USER_PAGES && !found; page++) {
      const list = await client.auth.admin.listUsers({ page, perPage: 200 });
      if (list.error) throw new Error(`Falha ao listar usuários: ${list.error.message}`);
      const users = list.data.users;
      found = users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (users.length < 200) break;
    }
    if (!found) {
      throw new Error(`Falha ao criar a conta demo: ${created.error?.message ?? "erro desconhecido"}`);
    }
    const updated = await client.auth.admin.updateUserById(found, {
      password: creds.password,
      email_confirm: true,
      user_metadata: { display_name: DEMO_DISPLAY_NAME },
    });
    if (updated.error) throw new Error(`Falha ao atualizar a conta demo: ${updated.error.message}`);
    userId = found;
  }

  // O trigger handle_new_user cria o profile; o upsert garante is_demo=true e o nome.
  must(
    await client
      .from("profiles")
      .upsert({ id: userId, display_name: DEMO_DISPLAY_NAME, is_demo: true }, { onConflict: "id" }),
    "Falha ao marcar o perfil como demo",
  );
  return userId;
}

/**
 * Repõe o estado-base da conta demo. Idempotente: roda N vezes com o mesmo resultado.
 * `demoEssays` ausente (arquivo da T18 ainda não existe): as redações não são tocadas.
 */
export async function resetDemoBaseState(
  client: SupabaseClient,
  input: { userId: string; demoEssays?: DemoAccountEssay[] | null; now?: Date },
): Promise<DemoResetSummary> {
  const { userId } = input;
  const today = localDateIso(input.now ?? new Date());
  const deadline = addDaysIso(today, DEMO_DEADLINE_DAYS);

  // Trilha (a primeira por slug) e seus conteúdos, em ordem.
  const trails = must(
    await client.from("trails").select("id, slug").order("slug").limit(1),
    "Falha ao ler a Trilha",
  ) as { id: string }[];
  if (trails.length === 0) throw new Error("Nenhuma Trilha no banco: rode o seed do catálogo antes.");
  const trailId = trails[0].id;

  const trailContents = must(
    await client
      .from("trail_contents")
      .select("content_id, position")
      .eq("trail_id", trailId)
      .order("position"),
    "Falha ao ler os conteúdos da Trilha",
  ) as { content_id: string; position: number }[];
  const trailContentIds = trailContents.map((r) => r.content_id);
  const masteredIds = trailContentIds.slice(0, DEMO_MASTERED_COUNT);
  const nowIso = (input.now ?? new Date()).toISOString();

  // 1) Dominados: apaga o progresso da demo e grava os 3 primeiros.
  must(await client.from("content_progress").delete().eq("user_id", userId), "Falha ao limpar o progresso");
  if (masteredIds.length > 0) {
    must(
      await client.from("content_progress").insert(
        masteredIds.map((content_id) => ({
          user_id: userId,
          content_id,
          status: "mastered",
          mastered_at: nowIso,
        })),
      ),
      "Falha ao gravar os conteúdos dominados",
    );
  }

  // 2) Jornada: apaga as da demo (journey_contents e sessões saem em cascata) e cria 1 ativa.
  must(await client.from("journeys").delete().eq("user_id", userId), "Falha ao limpar as Jornadas");
  const journey = must(
    await client
      .from("journeys")
      .insert({
        user_id: userId,
        base_type: "trail",
        trail_id: trailId,
        goal_type: "master_contents",
        goal_description: DEMO_JOURNEY_GOAL,
        deadline,
        methodology: "none",
        status: "active",
      })
      .select("id")
      .single(),
    "Falha ao criar a Jornada",
  ) as { id: string };
  if (trailContentIds.length > 0) {
    must(
      await client.from("journey_contents").insert(
        trailContentIds.map((content_id, i) => ({
          journey_id: journey.id,
          content_id,
          position: i + 1,
          added_from: "base",
        })),
      ),
      "Falha ao gravar os conteúdos da Jornada",
    );
  }

  // 3) Flashcards dos conteúdos dominados, vencidos hoje.
  must(await client.from("flashcard_states").delete().eq("user_id", userId), "Falha ao limpar os flashcards");
  let flashcardStates = 0;
  if (masteredIds.length > 0) {
    const cards = must(
      await client.from("flashcards").select("id").in("content_id", masteredIds),
      "Falha ao ler os flashcards",
    ) as { id: string }[];
    if (cards.length > 0) {
      must(
        await client.from("flashcard_states").insert(
          cards.map((c) => ({
            user_id: userId,
            flashcard_id: c.id,
            last_rating: 3,
            due_on: today,
            reviewed_at: null,
          })),
        ),
        "Falha ao gravar os flashcards",
      );
    }
    flashcardStates = cards.length;
  }

  // 4) Redações: função SQL (uma transação) apaga TODAS as da demo e reinsere as do estado-base.
  let essays: number | null = null;
  if (input.demoEssays) {
    const payload = input.demoEssays.map((e) => ({
      topic_slug: e.topicSlug,
      part: e.part,
      body: e.body,
      model_key: e.feedback.modelKey,
      prompt_version: e.feedback.promptVersion,
      total_estimate: e.feedback.totalEstimate,
      payload: e.feedback,
    }));
    const count = must(
      await client.rpc("demo_replace_essays", { p_user_id: userId, p_essays: payload }),
      "Falha ao repor as redações da demo",
    );
    essays = typeof count === "number" ? count : payload.length;
  }

  return {
    masteredContents: masteredIds.length,
    journeyContents: trailContentIds.length,
    flashcardStates,
    essays,
    deadline,
  };
}
