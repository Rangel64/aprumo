import { expect, test, type Page } from "@playwright/test";

/**
 * Faixa C, flashcards (T16, KAN-47, US-018): sessão de revisão em /revisar.
 *
 * Precisa de login e banco semeado com cartões vencidos para a conta (preview ou Supabase local).
 * Variáveis de ambiente de teste (só os nomes; os valores ficam no ambiente de quem roda):
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD  conta com cartões pendentes hoje
 * Sem elas, os testes são pulados (o CI sem banco não quebra).
 *
 * A sessão é destrutiva: concluir agenda os cartões para depois de hoje. Para o spec ser repetível
 * sem re-semear, o início do describe apaga os estados de cartão da conta demo (via service role,
 * só se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem no ambiente; o banco local
 * descartável). Sem a chave, vale o aviso antigo: re-semeie entre as rodadas.
 *
 * O describe da fila (D-043) usa uma conta própria, criada na hora, para não competir com os
 * outros specs, que rodam em paralelo e mexem no progresso da conta demo.
 */
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const SKIP_REASON =
  "Sem E2E_USER_EMAIL/E2E_USER_PASSWORD: o cenário precisa de login e banco semeado com cartões vencidos.";

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** REST/Auth admin do Supabase local, pela service role. Só o banco descartável. */
async function admin(path: string, method = "GET", body?: unknown, extra: Record<string, string> = {}) {
  const res = await fetch(`${supaUrl}${path}`, {
    method,
    headers: {
      apikey: serviceKey as string,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function userIdByEmail(addr: string): Promise<string | undefined> {
  const list = await admin("/auth/v1/admin/users?per_page=200");
  return (list.users as { id: string; email: string }[]).find((u) => u.email === addr)?.id;
}

async function login(page: Page, addr = email as string, pass = password as string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(addr);
  await page.getByLabel("Senha").fill(pass);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
}

test.describe("flashcards (/revisar)", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!email || !password, SKIP_REASON);

  // Repetível: zera os estados de cartão da conta demo; cartões de conteúdos em estudo sem estado
  // contam como vencidos (D-043), então a sessão volta a ter o que revisar.
  test.beforeAll(async () => {
    if (!supaUrl || !serviceKey) return;
    const id = await userIdByEmail(email as string);
    if (id) await admin(`/rest/v1/flashcard_states?user_id=eq.${id}`, "DELETE");
  });

  test("sessão completa: virar, avaliar nos 4 níveis, concluir, Mapa e nada pendente", async ({ page }) => {
    await login(page);
    await page.goto("/revisar");

    // Progresso "n de N cartas": N vem do banco da conta; 1 é a posição inicial.
    const progress = page.getByText(/^1 de \d+ cartas?$/);
    await expect(progress).toBeVisible();
    const total = Number(/de (\d+)/.exec((await progress.innerText()) ?? "")?.[1]);
    expect(total).toBeGreaterThanOrEqual(4);
    await expect(page.getByLabel(/Tente responder/)).toBeVisible();

    const answerLabel = page.getByText("RESPOSTA", { exact: true });
    const status = page.getByRole("status");

    // Espaço com foco no campo de texto NÃO vira a carta; o espaço entra no texto.
    await page.getByLabel(/Tente responder/).focus();
    await page.keyboard.type("meu palpite");
    await expect(answerLabel).toHaveCount(0);
    await expect(page.getByLabel(/Tente responder/)).toHaveValue("meu palpite");

    // Espaço fora de campo vira a carta, anuncia na região viva e leva o foco à resposta.
    await page.getByLabel(/Tente responder/).blur();
    await page.keyboard.press("Space");
    await expect(answerLabel).toBeVisible();
    await expect(status).toHaveText("Resposta mostrada. Avalie sua confiança.");
    await expect(page.getByText("Sua tentativa: meu palpite")).toBeVisible();
    await expect(page.locator("p:focus")).toContainText(/\S/);

    // Erro ao registrar: role=alert, a carta continua virada e nada avança.
    await page.route("**/revisar", (route) =>
      route.request().method() === "POST" ? route.abort() : route.continue(),
    );
    await page.getByRole("button", { name: /^Errei/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Não foi possível registrar" })).toBeVisible();
    await expect(page.getByText(`1 de ${total} cartas`, { exact: true })).toBeVisible();
    await page.unroute("**/revisar");

    // Avalia a 1ª carta e as seguintes, cada uma com um nível diferente (1, 2, 3, 4, 4...).
    const levels = ["Errei", "Rever", "Quase", "Sabia!"];
    for (let i = 0; i < total; i++) {
      if (i > 0) {
        // Após avançar, o foco vai ao enunciado da nova carta e a região viva anuncia a posição.
        await expect(page.getByText(`${i + 1} de ${total} cartas`, { exact: true })).toBeVisible();
        await expect(page.locator("p[tabindex='-1']:focus")).toBeVisible();
        await page.getByRole("button", { name: /^Ver resposta/ }).click();
        await expect(answerLabel).toBeVisible();
      }
      const level = levels[Math.min(i, levels.length - 1)];
      await page.getByRole("button", { name: new RegExp(`^${level.replace("!", "\!")}`) }).click();
      if (i === 0) await expect(status).toContainText("Avaliado como Errei. Próxima revisão amanhã.");
    }

    // Conclusão: título recebe o foco e o resultado é anunciado.
    const done = page.getByRole("heading", { level: 1, name: "Sessão concluída" });
    await expect(done).toBeVisible();
    await expect(done).toBeFocused();
    await expect(status).toContainText("Sessão concluída.");

    // O Mapa mostra "revisado hoje" nos conteúdos revisados.
    await page.getByRole("link", { name: "Ver no Mapa" }).click();
    await expect(page).toHaveURL(/\/mapa/);
    await expect(page.getByRole("button", { name: /revisado hoje/ }).first()).toBeVisible();

    // Sem pendências: tela "nada pendente" com link ao Mapa.
    await page.goto("/revisar");
    await expect(page.getByRole("status")).toContainText("Nada pendente para revisar hoje");
    await expect(page.getByRole("link", { name: "Ir para o Mapa" })).toBeVisible();
  });

  test("em 375px a revisão não tem rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await login(page);
    await page.goto("/revisar");
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

/**
 * Fila do dia (D-043) com dados exatos, na conta própria "fila":
 *  - conteúdo A em estudo: cartão A1 com estado vencido (due_on 2020-01-01) -> aparece;
 *    A2 com estado futuro (2099-12-31) -> NÃO aparece; A3 sem estado -> aparece (conta como vencido);
 *  - conteúdo B sem content_progress, cartões sem estado -> NÃO aparecem.
 * Esperado: 2 cartões (A1 e A3). Cálculo: 3 de A, menos 1 futuro = 2; B fora.
 */
test.describe("flashcards: fila do dia (D-043)", () => {
  test.describe.configure({ mode: "serial" });
  const FILA_EMAIL = "fila-e2e@aprumo.local";
  const FILA_PASS = "Fila-e2e-12345";
  test.skip(!supaUrl || !serviceKey, "Sem NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY: precisa preparar dados no banco local.");

  type Card = { id: string; front: string };
  let cardsA: Card[] = [];
  let cardsB: Card[] = [];

  test.beforeAll(async () => {
    // Usuário próprio (o trigger cria o profile); se já existe, reaproveita.
    let id = await userIdByEmail(FILA_EMAIL);
    if (!id) {
      const created = await admin("/auth/v1/admin/users", "POST", {
        email: FILA_EMAIL,
        password: FILA_PASS,
        email_confirm: true,
      });
      id = created.id as string;
    }
    // Reset do estado desta conta, sem depender de rodada anterior.
    await admin(`/rest/v1/flashcard_states?user_id=eq.${id}`, "DELETE");
    await admin(`/rest/v1/content_progress?user_id=eq.${id}`, "DELETE");

    // Dois conteúdos com pelo menos 3 cartões cada, lidos do banco (não dos docs).
    const cards = (await admin("/rest/v1/flashcards?select=id,front,content_id&order=id")) as
      (Card & { content_id: string })[];
    const byContent = new Map<string, Card[]>();
    for (const c of cards) byContent.set(c.content_id, [...(byContent.get(c.content_id) ?? []), c]);
    const eligible = [...byContent.entries()].filter(([, v]) => v.length >= 3);
    expect(eligible.length, "o seed precisa de 2 conteúdos com 3+ cartões").toBeGreaterThanOrEqual(2);
    const [[contentA, listA], [, listB]] = eligible;
    cardsA = listA.slice(0, 3);
    cardsB = listB;

    await admin("/rest/v1/content_progress", "POST", { user_id: id, content_id: contentA, status: "studying" });
    await admin("/rest/v1/flashcard_states", "POST", [
      { user_id: id, flashcard_id: cardsA[0].id, last_rating: 2, due_on: "2020-01-01", reviewed_at: "2020-01-01T12:00:00Z" },
      { user_id: id, flashcard_id: cardsA[1].id, last_rating: 4, due_on: "2099-12-31", reviewed_at: "2020-01-01T12:00:00Z" },
    ]);
  });

  test("mostra o cartão vencido e o sem estado; omite o de estado futuro e os de conteúdo sem progresso", async ({ page }) => {
    await login(page, FILA_EMAIL, FILA_PASS);
    await page.goto("/revisar");
    await expect(page.getByText("1 de 2 cartas", { exact: true })).toBeVisible();

    // Percorre a fila inteira e coleta os enunciados exibidos.
    const shown: string[] = [];
    for (let i = 0; i < 2; i++) {
      const front = (await page.locator("p[tabindex='-1']").first().innerText()).trim();
      shown.push(front);
      await page.getByRole("button", { name: /^Ver resposta/ }).click();
      await page.getByRole("button", { name: /^Sabia!/ }).click();
      if (i === 0) await expect(page.getByText("2 de 2 cartas", { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 1, name: "Sessão concluída" })).toBeVisible();

    expect([...shown].sort()).toEqual([cardsA[0].front, cardsA[2].front].sort());
    expect(shown).not.toContain(cardsA[1].front);
    for (const b of cardsB) expect(shown).not.toContain(b.front);
  });
});
