import { defineConfig } from "@playwright/test";

// Sem webServer: o teste roda contra um servidor já no ar (preview, ou `pnpm start`).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    // Chromium padrão do Playwright; para usar um navegador do sistema: E2E_BROWSER_CHANNEL=msedge.
    ...(process.env.E2E_BROWSER_CHANNEL ? { channel: process.env.E2E_BROWSER_CHANNEL } : {}),
  },
});
