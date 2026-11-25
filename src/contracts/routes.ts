/** Estados do filtro do Mapa (`/mapa?estado=`). */
export const MAP_STATE_FILTERS = [
  "todos",
  "dominado",
  "estudando",
  "nao-iniciado",
] as const;
export type MapStateFilter = (typeof MAP_STATE_FILTERS)[number];

function withQuery(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const query = search.toString().replaceAll("%2C", ",");
  return query ? `${path}?${query}` : path;
}

/** Rotas de tela (plano §3). Slugs e ids vêm de fora: nunca montar URL à mão. */
export const ROUTES = {
  home: "/",
  signIn: "/entrar",
  signUp: "/cadastro",
  dashboard: "/inicio",
  map: (estado?: MapStateFilter) =>
    withQuery("/mapa", { estado: estado === "todos" ? undefined : estado }),
  trail: (slug: string) => `/trilhas/${encodeURIComponent(slug)}`,
  journey: "/jornada",
  newJourney: (opts: { trilha?: string; conteudos?: string[] } = {}) =>
    withQuery("/jornada/nova", {
      trilha: opts.trilha,
      conteudos: opts.conteudos?.length ? opts.conteudos.join(",") : undefined,
    }),
  content: (slug: string) => `/conteudos/${encodeURIComponent(slug)}`,
  quiz: (slug: string) => `/conteudos/${encodeURIComponent(slug)}/mini-simulado`,
  review: "/revisar",
  schedule: "/cronograma",
  essay: "/redacao",
  essayResult: (submissionId: string) =>
    `/redacao/${encodeURIComponent(submissionId)}`,
} as const;

/** Rotas de API (Route Handlers). */
export const API_ROUTES = {
  health: "/api/health",
  essayFeedback: "/api/essays/feedback",
  cronDaily: "/api/cron/daily",
} as const;
