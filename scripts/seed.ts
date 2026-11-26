/**
 * Seed v1 (T4, KAN-35): catálogo, Trilha, conteúdos, questões, flashcards, temas, reservas e conta demo.
 * Idempotente (upsert por chave natural). Valida tudo ANTES de escrever.
 *
 * Uso (variáveis do ambiente do shell; o script nunca lê .env nem imprime valores):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_EMAIL (domínio reservado), DEMO_USER_PASSWORD
 *   pnpm seed                      # só Supabase local (localhost/127.0.0.1)
 *   SEED_CONFIRM_REMOTE=yes-seed-remote pnpm seed --allow-remote   # dev remoto, nunca prod
 *   pnpm seed --strict             # exige todos os conteúdos da Trilha
 * Recusa qualquer destino que contenha "prod". Sem `server-only` de propósito (roda sob tsx).
 */
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { runSeed } from "./lib/seed-run";

runSeed({
  rootDir: resolve(process.cwd()),
  env: process.env,
  argv: process.argv.slice(2),
  createClient: (url, key) =>
    createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
}).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : "Falha no seed.");
  process.exit(1);
});
