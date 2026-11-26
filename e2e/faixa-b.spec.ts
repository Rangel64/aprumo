import { expect, test, type Page } from "@playwright/test";

/**
 * Faixa B, Mapa e Trilha (T9, KAN-40): abre /mapa, vê nós, filtra, abre o drawer, abre a Trilha.
 *
 * Precisa de login e banco semeado (preview com `aprumo-dev`). Variáveis de ambiente de teste
 * (só os nomes; os valores ficam no ambiente de quem roda, nunca no repositório):
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD  conta de teste
 * Sem elas, os testes são pulados (o CI sem banco não quebra).
 *
 * Não depende da quantidade de nós nem do estado da conta: o seed final tem 18 conteúdos, mas o
 * teste exige só "pelo menos 1" para seguir verde durante a entrega parcial do seed.
 */
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const SKIP_REASON =
  "Sem E2E_USER_EMAIL/E2E_USER_PASSWORD: o cenário precisa de login e banco semeado (preview).";

async function login(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email as string);
  await page.getByLabel("Senha").fill(password as string);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
}

test.describe("mapa e trilha", () => {
  test.skip(!email || !password, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("mostra nós e ligações", async ({ page }) => {
    await page.goto("/mapa");
    await expect(page.getByRole("heading", { level: 1, name: "Mapa de Conteúdos" })).toBeVisible();
    const nodes = page.locator("[data-map-node]");
    await expect(nodes.first()).toBeVisible();
    expect(await nodes.count()).toBeGreaterThanOrEqual(1);
    await expect(page.locator(".react-flow__edge.edge-prerequisite").first()).toBeAttached();
    // Pré-requisito cheio; relacionada tracejada (quando o seed tem alguma).
    const related = page.locator(".react-flow__edge.edge-related path.react-flow__edge-path");
    if ((await related.count()) > 0) {
      await expect(related.first()).toHaveAttribute("style", /stroke-dasharray/);
    }
  });

  test("filtra por estado e trata valor inválido como todos", async ({ page }) => {
    await page.goto("/mapa");
    await page.getByRole("link", { name: "Dominados", exact: true }).click();
    await expect(page).toHaveURL(/\/mapa\?estado=dominado/);
    await expect(page.getByRole("link", { name: "Dominados", exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
    // Todo nó que aparece está dominado; sem nenhum, a mensagem com "Limpar filtros".
    const nodes = page.locator("[data-map-node]");
    if ((await nodes.count()) > 0) {
      for (const node of await nodes.all()) {
        await expect(node).toHaveAccessibleName(/, dominado/);
      }
    } else {
      await expect(page.getByText("Nenhum conteúdo com este estado por enquanto.")).toBeVisible();
      await page.getByRole("link", { name: "Limpar filtros" }).click();
      await expect(page).toHaveURL(/\/mapa$/);
    }

    await page.goto("/mapa?estado=bloqueado");
    await expect(page.getByRole("link", { name: "Todos", exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("drawer: abre com o nó, mostra as ações, Esc fecha e devolve o foco ao nó", async ({
    page,
  }) => {
    await page.goto("/mapa");
    const node = page.locator("[data-map-node]").first();
    await expect(node).toBeVisible();
    const slug = (await node.getAttribute("data-map-node")) as string;
    await node.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-labelledby", /.+/);
    await expect(dialog.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Estado" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Pré-requisitos" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Trilhas" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Estudar conteúdo" })).toHaveAttribute(
      "href",
      `/conteudos/${slug}`,
    );
    await expect(dialog.getByRole("link", { name: "Adicionar a uma Jornada" })).toHaveAttribute(
      "href",
      `/jornada/nova?conteudos=${slug}`,
    );
    // O foco entrou no drawer.
    await expect(dialog).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator(`[data-map-node="${slug}"]`)).toBeFocused();
  });

  test("a Trilha mostra nome, objetivo, quantidade e origem; slug inexistente dá 404", async ({
    page,
  }) => {
    await page.goto("/mapa");
    await page
      .getByRole("link", { name: /^Ver a Trilha / })
      .first()
      .click();
    await expect(page).toHaveURL(/\/trilhas\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Origem: plataforma")).toBeVisible();
    await expect(page.getByText(/^\d+ conteúdos?$/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /criar trilha/i })).toHaveCount(0);

    await page.goto("/trilhas/nao-existe-xyz");
    await expect(page.getByRole("heading", { name: "Trilha não encontrada" })).toBeVisible();
  });

  test("no celular a página não ganha rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/mapa");
    await expect(page.locator("[data-map-node]").first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

/**
 * Faixa B, Jornada (T10, KAN-41, US-011): /jornada/nova (meta e prazo obrigatórios, pré-seleção
 * por query string) e /jornada (roadmap). O teste que cria Jornada grava na conta de teste do
 * `aprumo-dev` (não há limite de Jornadas; a mais recente vira a ativa).
 */
const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Prefixo único da execução: a limpeza apaga SOMENTE Jornadas da conta E2E com este prefixo.
const GOAL_PREFIX = `e2e-jornada-${Date.now()}`;
const CREATED_GOAL = `${GOAL_PREFIX} Melhorar minha redação até o ENEM`;

/** REST/Auth admin pela service role (padrão do flashcards.spec.ts). */
async function admin(path: string, method = "GET") {
  const res = await fetch(`${supaUrl}${path}`, {
    method,
    headers: { apikey: serviceKey as string, Authorization: `Bearer ${serviceKey}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

test.describe("jornada", () => {
  test.skip(!email || !password, SKIP_REASON);

  // Limpeza: sem service role no ambiente, não apaga nada (a Jornada de teste fica na conta).
  test.afterAll(async () => {
    if (!supaUrl || !serviceKey) return;
    const list = await admin("/auth/v1/admin/users?per_page=200");
    const uid = (list.users as { id: string; email: string }[]).find((u) => u.email === email)?.id;
    if (!uid) return;
    const like = encodeURIComponent(`${GOAL_PREFIX}*`);
    const rows = (await admin(
      `/rest/v1/journeys?select=id&user_id=eq.${uid}&goal_description=like.${like}`,
    )) as { id: string }[];
    for (const { id } of rows) {
      await admin(`/rest/v1/journey_contents?journey_id=eq.${id}`, "DELETE");
      await admin(`/rest/v1/journeys?id=eq.${id}&user_id=eq.${uid}`, "DELETE");
    }
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Começar fica bloqueado sem meta e prazo, com mensagem no próprio campo", async ({
    page,
  }) => {
    await page.goto("/jornada/nova");
    await expect(page.getByRole("heading", { level: 1, name: "Criar Jornada" })).toBeVisible();
    const start = page.getByRole("button", { name: "Começar" });
    await expect(start).toBeDisabled();
    await expect(page.getByLabel("Meta")).toHaveAttribute("aria-describedby", /goal-msg/);
    await expect(page.getByLabel("Prazo")).toHaveAttribute("aria-describedby", /deadline-msg/);
    await expect(page.getByRole("radio", { name: "Prefiro sem metodologia" })).toBeChecked();

    // Ao sair do campo vazio, o erro real (não o hint fixo) aparece na região viva do campo.
    await page.getByLabel("Meta").focus();
    await page.getByLabel("Prazo").focus();
    await expect(page.locator("#goal-msg")).toContainText("A meta é obrigatória");
    await expect(page.locator("#goal-msg")).toHaveAttribute("aria-live", "polite");
    await expect(start).toBeDisabled();
  });

  test("pré-seleciona conteúdo pela URL e ignora slug inválido", async ({ page }) => {
    await page.goto("/mapa");
    const slug = (await page
      .locator("[data-map-node]")
      .first()
      .getAttribute("data-map-node")) as string;
    await page.goto(`/jornada/nova?conteudos=${slug},nao-existe-xyz,../x`);
    await expect(page.getByRole("heading", { level: 1, name: "Criar Jornada" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Conteúdos que eu escolher" })).toBeChecked();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(1);
  });

  test("cria a Jornada e abre /jornada com meta, prazo e progresso", async ({ page }) => {
    await page.goto("/jornada/nova");
    await page.getByRole("radio", { name: "Conteúdos que eu escolher" }).check();
    // Último conteúdo do catálogo: a conta de teste (ex.: demo) já domina os primeiros, e sem
    // conteúdo pendente a Jornada não teria "Estudar". O último não é dominado pelos outros e2e.
    await page.getByRole("checkbox").last().check();
    await page.getByLabel("Meta").fill(CREATED_GOAL);
    // Prazo bem no futuro (data fixa), para não depender do dia da execução.
    await page.getByLabel("Prazo").fill("2099-12-31");
    const start = page.getByRole("button", { name: "Começar" });
    await expect(start).toBeEnabled();
    await start.click();

    await page.waitForURL(/\/jornada$/);
    await expect(page.getByRole("heading", { level: 1, name: "Minha Jornada" })).toBeVisible();
    await expect(page.getByText(CREATED_GOAL)).toBeVisible();
    await expect(page.getByText(/31\/12\/2099/)).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Progresso da Jornada" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Estudar/ }).first()).toHaveAttribute(
      "href",
      /\/conteudos\/.+/,
    );
  });

  test("no celular /jornada/nova e /jornada não ganham rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    for (const path of ["/jornada/nova", "/jornada"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
});
