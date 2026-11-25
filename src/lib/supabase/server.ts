import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

/**
 * Cliente Supabase da sessão do usuário (RLS aplica). Um novo por requisição.
 * Em Server Components os cookies são somente leitura: o `setAll` falha em silêncio
 * e a renovação da sessão fica a cargo do proxy/middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado de um Server Component: ignorar (o proxy renova a sessão).
        }
      },
    },
  });
}
