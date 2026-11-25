import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Sempre dinâmico: o estado do banco e do orçamento não pode vir de cache.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

// O PostgREST limita cada resposta (padrão 1000 linhas): lemos ai_usage em lotes.
const PAGE_SIZE = 1000;
// Espelha a regra de contagem do gasto (schema.sql, ai_usage; reserve_ai_usage, T18):
// 'succeeded' e 'failed' sempre contam; 'reserved' só vale por 3 min.
const RESERVED_TTL_MS = 3 * 60 * 1000;

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

/** Soma cost_usd paginando com .range(); lança em erro ou valor inválido. */
async function sumAiUsage(supabase: SupabaseAdmin): Promise<number> {
  const cutoff = new Date(Date.now() - RESERVED_TTL_MS).toISOString();
  let spent = 0;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("ai_usage")
      .select("cost_usd")
      .or(`status.neq.reserved,created_at.gt.${cutoff}`)
      .order("id") // ordem estável entre as páginas
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error("db");
    const rows = data ?? [];
    for (const r of rows) {
      const cost = Number(r.cost_usd ?? 0);
      if (!Number.isFinite(cost)) throw new Error("invalid cost_usd");
      spent += cost;
    }
    if (rows.length < PAGE_SIZE) return spent;
  }
}

/** Healthcheck: banco (SELECT em app_config), kill switch e orçamento de IA. Nunca chama IA. */
export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  try {
    const supabase = createAdminClient();
    const [config, spent] = await Promise.all([
      supabase
        .from("app_config")
        .select("key, value")
        .in("key", ["ai_enabled", "ai_global_budget_usd"]),
      sumAiUsage(supabase),
    ]);
    if (config.error) throw new Error("db");

    const values = Object.fromEntries((config.data ?? []).map((r) => [r.key, r.value]));
    // Orçamento ausente ou não numérico é erro de configuração (503), nunca NaN/null.
    const budget = Number(values.ai_global_budget_usd);
    if (values.ai_global_budget_usd == null || !Number.isFinite(budget)) {
      throw new Error("invalid budget");
    }
    // Arredonda a 6 casas (precisão de cost_usd) para evitar ruído de ponto flutuante.
    const budgetRemainingUsd = Math.round((budget - spent) * 1e6) / 1e6;

    return NextResponse.json(
      {
        status: "ok",
        db: "ok",
        ai: { enabled: values.ai_enabled === true, budgetRemainingUsd },
        commit,
      },
      { headers: NO_STORE },
    );
  } catch {
    // Resposta genérica: sem mensagem de erro interna.
    return NextResponse.json(
      {
        status: "degraded",
        db: "error",
        ai: { enabled: false, budgetRemainingUsd: 0 },
        commit,
      },
      { status: 503, headers: NO_STORE },
    );
  }
}
