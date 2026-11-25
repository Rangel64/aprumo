/**
 * Regra pura de acesso por rota (usada pelo proxy). Sem rede, sem Next.
 * Retorna o destino do redirecionamento ou `null` quando a requisição segue.
 */

/** Primeiros segmentos das rotas do grupo `(app)`, que exigem sessão. */
export const PROTECTED_PREFIXES = [
  "/inicio",
  "/mapa",
  "/trilhas",
  "/jornada",
  "/conteudos",
  "/revisar",
  "/cronograma",
  "/redacao",
] as const;

/** Rotas só para visitantes: com sessão, vão para `/inicio`. */
export const GUEST_ONLY_PATHS = ["/entrar", "/cadastro"] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((p) => matchesPrefix(pathname, p));
}

/**
 * `/api/*` nunca é redirecionado: o proxy só renova a sessão ali. Cada handler
 * autenticado deve chamar `getUser()` e responder 401 por conta própria.
 */
export function getRedirectTarget(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (matchesPrefix(pathname, "/api")) return null;
  if (!isAuthenticated && isProtectedPath(pathname)) return "/entrar";
  if (isAuthenticated && isGuestOnlyPath(pathname)) return "/inicio";
  return null;
}
