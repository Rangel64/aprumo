import { expect, test } from "@playwright/test";

// Esqueleto (T5). O fluxo completo entra na T22.
test("a Entrada abre e mostra o botão Começar agora", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Começar agora").first()).toBeVisible();
});

test("GET /api/health retorna 200", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ok");
});
