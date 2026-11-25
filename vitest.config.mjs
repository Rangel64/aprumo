import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Alias "@/" igual ao tsconfig, para testar módulos que importam por "@/...".
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
