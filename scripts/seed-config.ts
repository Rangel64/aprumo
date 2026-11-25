/**
 * Seed de config (T2): lê SÓ content/config.json, valida com o schema e faz upsert em app_config.
 * Não é o seed.ts v1 (catálogo e conta demo).
 *
 * Uso: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed:config
 * As variáveis vêm do ambiente do shell; o script nunca lê arquivo .env nem imprime chaves.
 * Sem `server-only` de propósito: roda sob tsx.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { AppConfigSchema } from "../src/contracts/content";

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do shell.",
    );
  }

  const file = resolve(process.cwd(), "content", "config.json");
  const parsed = AppConfigSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`)
      .join("\n");
    throw new Error(`content/config.json inválido:\n${problems}`);
  }

  const now = new Date().toISOString();
  const rows = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value,
    updated_at: now,
  }));

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from("app_config").upsert(rows, { onConflict: "key" });
  if (error) {
    throw new Error(`Falha no upsert de app_config: ${error.message}`);
  }
  console.log(`app_config atualizada: ${rows.length} chaves (${rows.map((r) => r.key).join(", ")}).`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
