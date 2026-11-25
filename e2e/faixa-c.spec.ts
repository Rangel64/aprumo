import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Faixa C, mini-simulado (T14, KAN-45): cenário 3 de 5 (reprova) e 4 de 5 (nó acende).
 *
 * Precisa de login e banco semeado (preview com `aprumo-dev`). Variáveis de ambiente de teste
 * (só os nomes; os valores ficam no ambiente de quem roda, nunca no repositório):
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD  conta de teste que AINDA NÃO dominou o conteúdo abaixo
 *   E2E_QUIZ_SLUG                      opcional; padrão "estrutura-em-4-paragrafos"
 * Sem as duas primeiras, os testes são pulados (o CI sem banco não quebra).
 *
 * O gabarito sai de `content/<slug>.json` (a fonte do seed), lido aqui pelo Node do teste; a
 * página nunca o traz. O domínio é definitivo (RN-007): repetir o cenário 4 de 5 com a mesma
 * conta mantém passed=true e o teste segue verde, mas só uma conta nova prova a transição de
 * "não dominado" para "dominado". O teste do nó aceso no Mapa é real (T9 entregue).
 */
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;
const slug = process.env.E2E_QUIZ_SLUG ?? "estrutura-em-4-paragrafos";
const SKIP_REASON =
  "Sem E2E_USER_EMAIL/E2E_USER_PASSWORD: o cenário precisa de login e banco semeado (preview).";

type KeyedQuestion = { stem: string; options: string[]; correctIndex: number };

function loadKey(): { title: string; questions: KeyedQuestion[] } {
  const raw = readFileSync(join(process.cwd(), "content", `${slug}.json`), "utf8");
  return JSON.parse(raw) as { title: string; questions: KeyedQuestion[] };
}

async function login(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email as string);
  await page.getByLabel("Senha").fill(password as string);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
}

/** Responde as questões na tela: certas nas primeiras `rights` (pela ordem exibida), erradas nas demais. */
async function answer(page: Page, rights: number) {
  const key = loadKey();
  const fieldsets = page.getByRole("group");
  const count = await fieldsets.count();
  expect(count).toBe(5);
  for (let i = 0; i < count; i++) {
    const legend = (await fieldsets.nth(i).locator("legend").innerText()).replace(/^\d+\.\s*/, "").trim();
    const q = key.questions.find((k) => k.stem === legend);
    expect(q, `questão não encontrada no conteúdo: ${legend}`).toBeTruthy();
    const pick = i < rights ? q!.correctIndex : (q!.correctIndex + 1) % q!.options.length;
    await fieldsets.nth(i).getByRole("radio").nth(pick).check();
  }
}

test.describe.configure({ mode: "serial" });

test.describe("mini-simulado", () => {
  test.skip(!email || !password, SKIP_REASON);

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/conteudos/${slug}/mini-simulado`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("3 de 5 reprova: lista seções a rever e volta ao estudo", async ({ page }) => {
    await answer(page, 3);
    await page.getByRole("button", { name: "Enviar respostas" }).click();

    // A região viva anuncia só uma frase curta; o cartão (links e botões) fica fora dela.
    const status = page.getByRole("status");
    await expect(status).toHaveText("Você acertou 3 de 5. Veja as seções a rever.");
    await expect(status.getByRole("link")).toHaveCount(0);
    // O foco vai ao título do resultado (o formulário desmontou).
    const heading = page.getByRole("heading", { level: 2, name: "Ainda não foi desta vez" });
    await expect(heading).toBeFocused();
    await expect(page.getByRole("link", { name: "Ver no Mapa" })).toHaveCount(0);

    await page.getByRole("link", { name: "Voltar ao estudo" }).click();
    await expect(page).toHaveURL(new RegExp(`/conteudos/${slug}$`));
  });

  test("resposta faltando: anuncia e leva o foco à primeira questão sem resposta", async ({ page }) => {
    // Responde só a 2ª questão (índice 1); a 1ª é a primeira sem resposta.
    await page.getByRole("group").nth(1).getByRole("radio").first().check();
    await page.getByRole("button", { name: "Enviar respostas" }).click();
    await expect(page.getByRole("status")).toHaveText("Faltam 4 respostas para enviar.");
    await expect(page.getByRole("group").first().getByRole("radio").first()).toBeFocused();
  });

  // Idempotente: o domínio é definitivo (RN-007), então repetir com a mesma conta mantém
  // passed=true e o teste continua verde; o ideal é uma conta nova para provar a transição.
  test("4 de 5 domina: resultado anunciado, foco no título e nó no Mapa", async ({ page }) => {
    await answer(page, 4);
    await page.getByRole("button", { name: "Enviar respostas" }).click();

    const status = page.getByRole("status");
    await expect(status).toHaveText("Você acertou 4 de 5. Conteúdo dominado.");
    await expect(status.getByRole("link")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Conteúdo dominado" })).toBeFocused();

    await page.getByRole("link", { name: "Ver no Mapa" }).click();
    await expect(page).toHaveURL(/\/mapa\?estado=dominado/);
    // Observável hoje: o filtro "dominado" lista o conteúdo pelo título.
    await expect(page.getByText(loadKey().title).first()).toBeVisible();
  });

  // O nó do Mapa (T9) usa o MapNode de A, que expõe ", dominado" em texto sr-only: o nome
  // acessível do botão do nó é "<título> , dominado" (o sr-only absoluto deixa um espaço antes da vírgula; pode ter ", revisado hoje" depois).
  test("4 de 5: o nó do conteúdo está aceso (dominado) no Mapa", async ({ page }) => {
    // Garante o domínio nesta conta (idempotente, RN-007) antes de olhar o Mapa.
    await page.goto(`/conteudos/${slug}/mini-simulado`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await answer(page, 4);
    await page.getByRole("button", { name: "Enviar respostas" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Conteúdo dominado" })).toBeFocused();

    await page.goto("/mapa");
    const title = loadKey().title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(
      page.getByRole("button", { name: new RegExp(`^${title}\\s*,\\s*dominado`) }),
    ).toBeVisible();
  });
});
