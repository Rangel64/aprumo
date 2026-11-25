/**
 * Variáveis públicas do Supabase. Os acessos usam o nome literal em `process.env`
 * para o Next inlinar no bundle do navegador. Nunca coloque segredo aqui.
 */
export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas.",
    );
  }
  return { url, anonKey };
}
