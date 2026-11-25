import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a service role: IGNORA a RLS. Só no servidor, depois de validar a sessão
 * com `supabase.auth.getUser()`. A chave vem só de variável de ambiente, sem `NEXT_PUBLIC_`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Sem cache do fetch do Next: config e contagens precisam refletir o banco na hora.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
