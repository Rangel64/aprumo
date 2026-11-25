import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRedirectTarget } from "@/lib/auth/route-guard";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/** Renova a sessão do Supabase e aplica o guard de rotas (Next 16: `proxy.ts`). */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let renewedHeaders: Record<string, string> = {};
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Cache-Control: private, no-store etc. (evita cache de respostas com Set-Cookie).
        renewedHeaders = headers ?? {};
        for (const [key, value] of Object.entries(renewedHeaders)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // getUser() valida o token no servidor de auth (getSession só lê o cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const target = getRedirectTarget(request.nextUrl.pathname, user !== null);
  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    // Preserva cookies renovados na resposta de redirecionamento.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    for (const [key, value] of Object.entries(renewedHeaders)) {
      redirect.headers.set(key, value);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // api/health e api/cron ficam fora: não dependem do Supabase Auth (têm autenticação própria).
    "/((?!api/health(?:/|$)|api/cron(?:/|$)|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)",
  ],
};
