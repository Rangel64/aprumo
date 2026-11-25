import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Ponto de extensão: a reposição da conta demo (T4, `src/server/demo-reset.ts`).
 * Enquanto a rotina não existir, fica `null` e o cron responde `demoReset: "skipped"`.
 * Quando chegar, troque por: `() => import("@/server/demo-reset").then((m) => m.resetDemoAccount())`.
 */
const demoReset: (() => Promise<void>) | null = null;

/** Comparação em tempo constante: compara os SHA-256 (mesmo tamanho) com timingSafeEqual. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Nunca aceita quando indefinido; sem detalhes na resposta.
    return NextResponse.json({ error: "internal" }, { status: 500, headers: NO_STORE });
  }
  const header = request.headers.get("authorization") ?? "";
  if (!safeEqual(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    // Keep-alive: um SELECT leve evita a pausa do projeto Supabase gratuito.
    const { error } = await createAdminClient().from("app_config").select("key").limit(1);
    if (error) throw new Error("db");

    let demoResetStatus: "ok" | "skipped" = "skipped";
    if (demoReset) {
      await demoReset();
      demoResetStatus = "ok";
    }
    return NextResponse.json(
      { status: "ok", keepAlive: "ok", demoReset: demoResetStatus },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500, headers: NO_STORE });
  }
}
