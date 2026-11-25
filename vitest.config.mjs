import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

// Alias "@/" igual ao tsconfig, para testar módulos que importam por "@/...".
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // e2e/*.spec.ts é do Playwright (pnpm test:e2e), não do Vitest.
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
