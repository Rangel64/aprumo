import "server-only";
import { AppConfigSchema, type AppConfig } from "@/contracts/content";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lê `app_config` (uma linha por chave) e valida com zod. Sem cache de propósito:
 * os valores podem mudar no painel do Supabase sem redeploy (kill switch, limites).
 * `app_config` não tem política de RLS: só a service role lê.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("app_config").select("key, value");
  if (error) {
    throw new Error(`Falha ao ler app_config: ${error.message}`);
  }

  const raw = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  const parsed = AppConfigSchema.safeParse(raw);
  if (!parsed.success) {
    // Só caminhos e mensagens: nunca os valores.
    const problems = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`)
      .join("; ");
    throw new Error(`app_config inválida: ${problems}`);
  }
  return parsed.data;
}
